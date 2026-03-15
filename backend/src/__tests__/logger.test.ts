/**
 * Tests for central logger: noop in test, console transport, json transport, and error serialization.
 */
const originalNodeEnv = process.env.NODE_ENV;
const originalLogTransport = process.env.LOG_TRANSPORT;

describe('logger', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOG_TRANSPORT = originalLogTransport;
    jest.resetModules();
  });

  it('does not call console in test env', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { logger } = require('../logger');
    logger.error('e');
    logger.warn('w');
    logger.info('i');

    expect(errSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('console transport calls console.error/warn/log/debug', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LOG_TRANSPORT;
    jest.resetModules();

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    const { logger } = require('../logger');
    logger.error('err', new Error('e1'));
    logger.error('err-only');
    logger.warn('warn', { k: 1 });
    logger.warn('warn-only');
    logger.info('info', { p: 1 });
    logger.info('info-only');
    logger.debug('debug', { d: 1 });
    logger.debug('debug-only');

    expect(errSpy).toHaveBeenCalledWith('err', expect.any(Error));
    expect(errSpy).toHaveBeenCalledWith('err-only');
    expect(warnSpy).toHaveBeenCalledWith('warn', { k: 1 });
    expect(warnSpy).toHaveBeenCalledWith('warn-only');
    expect(logSpy).toHaveBeenCalledWith('info', { p: 1 });
    expect(logSpy).toHaveBeenCalledWith('info-only');
    expect(debugSpy).toHaveBeenCalledWith('debug', { d: 1 });
    expect(debugSpy).toHaveBeenCalledWith('debug-only');
    errSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('json transport writes JSON lines to stderr for error/warn and stdout for info/debug', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_TRANSPORT = 'json';
    jest.resetModules();

    const stderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const stdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const { logger } = require('../logger');
    const err = new Error('db failed');
    logger.error('failed', err);
    logger.warn('warn', { x: 1 });
    logger.info('started', { port: 3000 });
    logger.debug('debug-msg', { d: 2 });

    expect(stderrWrite).toHaveBeenCalledTimes(2);
    const errLine = JSON.parse((stderrWrite.mock.calls[0] ?? [])[0] as string);
    expect(errLine.level).toBe('error');
    expect(errLine.message).toBe('failed');
    expect(errLine.err).toEqual(expect.objectContaining({ name: 'Error', message: 'db failed' }));
    expect(errLine.timestamp).toBeDefined();

    const warnLine = JSON.parse((stderrWrite.mock.calls[1] ?? [])[0] as string);
    expect(warnLine.level).toBe('warn');
    expect(warnLine.meta).toEqual({ x: 1 });

    expect(stdoutWrite).toHaveBeenCalledTimes(2);
    const infoLine = JSON.parse((stdoutWrite.mock.calls[0] ?? [])[0] as string);
    expect(infoLine.level).toBe('info');
    expect(infoLine.meta).toEqual({ port: 3000 });
    const debugLine = JSON.parse((stdoutWrite.mock.calls[1] ?? [])[0] as string);
    expect(debugLine.level).toBe('debug');
    expect(debugLine.meta).toEqual({ d: 2 });

    stderrWrite.mockRestore();
    stdoutWrite.mockRestore();
  });

  it('json transport serializes Error with code property', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_TRANSPORT = 'json';
    jest.resetModules();

    const stderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const { logger } = require('../logger');
    const errWithCode = new Error('ECONNREFUSED') as Error & { code: string };
    errWithCode.code = 'ECONNREFUSED';
    logger.error('conn failed', errWithCode);

    const line = JSON.parse((stderrWrite.mock.calls[0] ?? [])[0] as string);
    expect(line.err).toEqual(expect.objectContaining({ name: 'Error', message: 'ECONNREFUSED', code: 'ECONNREFUSED' }));
    stderrWrite.mockRestore();
  });

  it('json transport serializes non-Error as value', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_TRANSPORT = 'json';
    jest.resetModules();

    const stderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const { logger } = require('../logger');
    logger.error('oops', 'string error');

    const line = JSON.parse((stderrWrite.mock.calls[0] ?? [])[0] as string);
    expect(line.err).toEqual({ value: 'string error' });
    stderrWrite.mockRestore();
  });
});
