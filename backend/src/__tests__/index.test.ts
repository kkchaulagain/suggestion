describe('server bootstrap', () => {
  async function flushModuleWork() {
    await new Promise((resolve) => setImmediate(resolve));
  }

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    delete process.env.HOST;
    delete process.env.PORT;
  });

  it('connects to MongoDB and starts listening on the configured host and port', async () => {
    process.env.HOST = '127.0.0.1';
    process.env.PORT = '4321';

    const connect = jest.fn().mockResolvedValue(undefined);
    const listen = jest.fn((_port, _host, callback) => {
      callback();
      return { close: jest.fn() };
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.doMock('../db', () => ({ connect }));
    jest.doMock('../app', () => ({ listen }));

    require('../index');
    await flushModuleWork();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(4321, '127.0.0.1', expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith('MongoDB connected');
    expect(logSpy).toHaveBeenCalledWith('Server running at http://127.0.0.1:4321');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns when MongoDB connection fails and still starts the server', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('mongo down'));
    const listen = jest.fn((_port, _host, callback) => {
      callback();
      return { close: jest.fn() };
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.doMock('../db', () => ({ connect }));
    jest.doMock('../app', () => ({ listen }));

    require('../index');
    await flushModuleWork();

    expect(warnSpy).toHaveBeenCalledWith('MongoDB not connected:', 'mongo down');
    expect(listen).toHaveBeenCalledWith(3000, '0.0.0.0', expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith('Server running at http://0.0.0.0:3000');
  });

  it('logs and exits when startup fails after connect handling', async () => {
    const connect = jest.fn().mockResolvedValue(undefined);
    const listen = jest.fn(() => {
      throw new Error('listen failed');
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    jest.doMock('../db', () => ({ connect }));
    jest.doMock('../app', () => ({ listen }));

    require('../index');
    await flushModuleWork();

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'listen failed' }));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
