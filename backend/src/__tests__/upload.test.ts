/**
 * Upload route tests. Mocks R2 service so no real Cloudflare calls.
 */
const request = require('supertest');

const mockUploadToR2 = jest.fn();
const mockIsR2Configured = jest.fn();

jest.mock('../services/r2', () => ({
  uploadToR2: (...args: unknown[]) => mockUploadToR2(...args),
  isR2Configured: () => mockIsR2Configured(),
}));

const app = require('../app');

describe('POST /api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when no file is sent', async () => {
    mockIsR2Configured.mockReturnValue(true);

    await request(app)
      .post('/api/upload')
      .expect(400)
      .expect((res: { body: { error?: string } }) => {
        expect(res.body.error).toMatch(/no file/i);
      });
  });

  it('returns 503 when R2 is not configured', async () => {
    mockIsR2Configured.mockReturnValue(false);

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), 'test.jpg')
      .expect(503)
      .expect((res: { body: { error?: string } }) => {
        expect(res.body.error).toMatch(/not configured/i);
      });

    expect(mockUploadToR2).not.toHaveBeenCalled();
  });

  it('returns 200 with url when R2 is configured and file is valid', async () => {
    mockIsR2Configured.mockReturnValue(true);
    mockUploadToR2.mockResolvedValue({
      url: 'https://pub-xxx.r2.dev/uploads/abc123.jpg',
      key: 'uploads/abc123.jpg',
    });

    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), 'photo.jpg')
      .expect(200);

    expect(res.body).toHaveProperty('url', 'https://pub-xxx.r2.dev/uploads/abc123.jpg');
    expect(mockUploadToR2).toHaveBeenCalledTimes(1);
    expect(mockUploadToR2).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/jpeg',
      'photo.jpg'
    );
  });

  it('returns 503 when R2 returns null (upload failed)', async () => {
    mockIsR2Configured.mockReturnValue(true);
    mockUploadToR2.mockResolvedValue(null);

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff]), 'test.jpg')
      .expect(503)
      .expect((res: { body: { error?: string } }) => {
        expect(res.body.error).toMatch(/upload failed/i);
      });
  });

  it('rejects non-image file (fileFilter)', async () => {
    mockIsR2Configured.mockReturnValue(true);

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('not an image'), { filename: 'file.txt', contentType: 'text/plain' })
      .expect(500);

    expect(mockUploadToR2).not.toHaveBeenCalled();
  });

  it('returns 500 when R2 throws', async () => {
    mockIsR2Configured.mockReturnValue(true);
    mockUploadToR2.mockRejectedValue(new Error('R2 error'));

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff]), 'test.jpg')
      .expect(500)
      .expect((res: { body: { error?: string } }) => {
        expect(res.body.error).toMatch(/failed to upload/i);
      });
  });
});
