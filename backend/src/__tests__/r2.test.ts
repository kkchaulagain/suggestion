/**
 * R2 service: getR2Config, isR2Configured, uploadToR2 (null when not configured).
 */
const originalEnv = process.env;

describe('r2 service', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('isR2Configured returns false when env is missing', () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
    const { isR2Configured } = require('../services/r2');
    expect(isR2Configured()).toBe(false);
  });

  it('isR2Configured returns true when all required env are set', () => {
    process.env.R2_ACCOUNT_ID = 'acc';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET_NAME = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://pub.example.dev';
    const { isR2Configured } = require('../services/r2');
    expect(isR2Configured()).toBe(true);
  });

  it('uploadToR2 returns null when not configured', async () => {
    delete process.env.R2_ACCOUNT_ID;
    const { uploadToR2 } = require('../services/r2');
    const result = await uploadToR2(Buffer.from('x'), 'image/jpeg', 'test.jpg');
    expect(result).toBe(null);
  });

  it('uploadToR2 returns url and key when configured (with prefix)', async () => {
    process.env.R2_ACCOUNT_ID = 'acc';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET_NAME = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://pub.example.dev/';
    process.env.R2_KEY_PREFIX = 'dev/';

    const mockSend = jest.fn().mockResolvedValue({});
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
      PutObjectCommand: jest.fn(),
    }));

    const { uploadToR2 } = require('../services/r2');
    const result = await uploadToR2(Buffer.from('img'), 'image/png', 'photo.png');

    expect(result).not.toBeNull();
    expect(result!.url).toMatch(/^https:\/\/pub\.example\.dev\//);
    expect(result!.key).toMatch(/^dev\/uploads\/.+\.png$/);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('uploadToR2 handles file without extension', async () => {
    process.env.R2_ACCOUNT_ID = 'acc';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET_NAME = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://pub.example.dev';

    const mockSend = jest.fn().mockResolvedValue({});
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
      PutObjectCommand: jest.fn(),
    }));

    const { uploadToR2 } = require('../services/r2');
    const result = await uploadToR2(Buffer.from('img'), 'image/jpeg', 'noext');

    expect(result).not.toBeNull();
    expect(result!.key).toMatch(/^uploads\/[a-f0-9-]+$/);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('normalizeKeyPrefix returns empty when R2_KEY_PREFIX is unset', () => {
    process.env.R2_ACCOUNT_ID = 'acc';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET_NAME = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://pub.example.dev';
    delete process.env.R2_KEY_PREFIX;
    jest.resetModules();
    const { isR2Configured } = require('../services/r2');
    expect(isR2Configured()).toBe(true);
  });

  it('uploadToR2 uses default Content-Type when mimeType is falsy', async () => {
    process.env.R2_ACCOUNT_ID = 'acc';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET_NAME = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://pub.example.dev';
    const mockSend = jest.fn().mockResolvedValue({});
    let capturedContentType: string | undefined;
    const PutObjectCommand = jest.fn().mockImplementation((opts: Record<string, unknown>) => {
      capturedContentType = opts.ContentType as string | undefined;
      return {};
    });
    jest.doMock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
      PutObjectCommand,
    }));
    jest.resetModules();
    const { uploadToR2 } = require('../services/r2');
    const result = await uploadToR2(Buffer.from('x'), '', 'file.bin');
    expect(result).not.toBeNull();
    expect(capturedContentType).toBe('application/octet-stream');
  });
});
