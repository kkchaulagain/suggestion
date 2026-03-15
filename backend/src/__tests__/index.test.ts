/**
 * Tests for index.ts onStartFailed (catch handler for start() rejection).
 * Covers the error path that logs and exits when start() fails.
 */
jest.mock('../db', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
}));

const mockListen = jest.fn();
jest.mock('../app', () => ({
  listen: mockListen,
}));

describe('index onStartFailed', () => {
  it('logs error and exits when called with an error', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const { logger } = require('../logger');
    const errorSpy = jest.spyOn(logger, 'error');

    const { onStartFailed } = require('../index');
    const err = new Error('start failed');
    onStartFailed(err);

    expect(errorSpy).toHaveBeenCalledWith('Server start failed', err);
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe('index start()', () => {
  it('logs warn when connect fails', async () => {
    jest.resetModules();
    const db = require('../db');
    db.connect.mockRejectedValueOnce(new Error('connection failed'));
    const { logger } = require('../logger');
    const warnSpy = jest.spyOn(logger, 'warn');

    require('../index');

    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    expect(warnSpy).toHaveBeenCalledWith(
      'MongoDB not connected',
      expect.objectContaining({ message: 'connection failed' }),
    );
    warnSpy.mockRestore();
  });

  it('logs info when server is listening', async () => {
    jest.resetModules();
    mockListen.mockImplementation((_port: number, _host: string, cb: () => void) => {
      if (typeof cb === 'function') cb();
    });
    const { logger } = require('../logger');
    const infoSpy = jest.spyOn(logger, 'info');

    require('../index');

    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    expect(infoSpy).toHaveBeenCalledWith('Server running', expect.objectContaining({ host: expect.any(String), port: expect.any(Number) }));
    infoSpy.mockRestore();
  });
});
