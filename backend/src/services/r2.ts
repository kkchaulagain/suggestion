/**
 * Cloudflare R2 (S3-compatible) upload helper.
 * Requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 * Optional: R2_KEY_PREFIX – e.g. "dev/" for local dev so prod and dev stay in same bucket under different prefixes.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');

function normalizeKeyPrefix(prefix: string | undefined): string {
  if (!prefix || typeof prefix !== 'string') return '';
  return prefix.trim().replace(/\/+$/, '').replace(/^\/+/, '') + (prefix.trim() ? '/' : '');
}

function getR2Config(): { client: typeof S3Client; bucket: string; publicBaseUrl: string; keyPrefix: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const keyPrefix = normalizeKeyPrefix(process.env.R2_KEY_PREFIX);
  return { client, bucket, publicBaseUrl, keyPrefix };
}

async function uploadToR2(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<{ url: string; key: string } | null> {
  const config = getR2Config();
  if (!config) return null;

  const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '';
  const key = `${config.keyPrefix}uploads/${randomUUID()}${ext}`;

  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
    })
  );

  const url = `${config.publicBaseUrl}/${key}`;
  return { url, key };
}

function isR2Configured(): boolean {
  return getR2Config() !== null;
}

module.exports = { uploadToR2, isR2Configured };
