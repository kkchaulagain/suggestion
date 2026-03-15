import type { Request, Response } from 'express';
const express = require('express');
const multer = require('multer');
const { uploadToR2, isR2Configured } = require('../services/r2');
const { logger } = require('../logger');

const router = express.Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};
type UploadRequest = Request & { file?: UploadedFile };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(
    _req: Request,
    file: { mimetype: string },
    cb: (err: Error | null, accept?: boolean) => void,
  ) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  },
});

router.post('/', upload.single('file'), async (req: UploadRequest, res: Response) => {
  if (!isR2Configured()) {
    return res.status(503).json({ error: 'Upload service is not configured' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }

  try {
    const result = await uploadToR2(file.buffer, file.mimetype, file.originalname || 'image');
    if (!result) {
      return res.status(503).json({ error: 'Upload failed' });
    }
    return res.status(200).json({ url: result.url });
  } catch (err) {
    logger.error('R2 upload error:', err);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
