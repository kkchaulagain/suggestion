const _request = require('supertest');
const { connect, disconnect } = require('../db');
const _app = require('../app');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
import { isAuthenticated } from '../middleware/isauthenticated';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

interface MockRequestWithCookies {
  cookies?: Record<string, string>;
  id?: string;
}

describe('isAuthenticated Middleware', () => {
    beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnect();
  });
  const secret = process.env.JWT_SECRET || 'default_secret_key';
  const validToken = jwt.sign({ userId: '12345' }, secret);

  const mockResponse = (): MockResponse => {
    const res = {} as MockResponse;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('should return 401 if token is missing', async () => {
    const req = { cookies: {} } as MockRequestWithCookies;
    const res = mockResponse();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if token is valid', async () => {
    const req = { cookies: { token: validToken } } as MockRequestWithCookies;
    const res = mockResponse();
    const next = jest.fn();

    await isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.id).toBe('12345');
  });
});