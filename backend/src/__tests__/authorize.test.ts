import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { authorize } from '../middleware/authorize';

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

interface MockRequestWithId {
  id?: string;
  user?: { _id: string; role: string; isActive?: boolean };
}

/** Cast mock req/res to the types the middleware expects so tests compile with strict types. */
function asAuthorizedRequest(req: MockRequestWithId): ExpressRequest & { id?: string; user?: { _id: string; role: string; isActive?: boolean } } {
  return req as ExpressRequest & { id?: string; user?: { _id: string; role: string; isActive?: boolean } };
}
function asResponse(res: MockResponse): ExpressResponse {
  return res as unknown as ExpressResponse;
}

describe('authorize middleware', () => {
  const mockResponse = (): MockResponse => {
    const res = {} as MockResponse;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if req.id is missing', async () => {
    const req = {} as MockRequestWithId;
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('admin');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(User.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 if user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const req: MockRequestWithId = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('admin');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(User.findById).toHaveBeenCalledWith(req.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if user is inactive', async () => {
    User.findById.mockResolvedValue({ _id: 'u1', role: 'admin', isActive: false });

    const req: MockRequestWithId = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('admin');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 if user role is not in allowed roles', async () => {
    User.findById.mockResolvedValue({ _id: 'u1', role: 'user', isActive: true });

    const req: MockRequestWithId = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('admin');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches user when role is allowed', async () => {
    const adminUser = { _id: 'u2', role: 'admin', isActive: true };
    User.findById.mockResolvedValue(adminUser);

    const req: MockRequestWithId = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('admin');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(adminUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows multiple roles', async () => {
    const businessUser = { _id: 'u3', role: 'business', isActive: true };
    User.findById.mockResolvedValue(businessUser);

    const req: MockRequestWithId = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('business', 'admin', 'governmentservices');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(businessUser);
  });

  it('returns 500 when User.findById throws', async () => {
    User.findById.mockRejectedValue(new Error('DB connection lost'));

    const req: MockRequestWithId = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();
    const middleware = authorize('admin');

    await middleware(asAuthorizedRequest(req), asResponse(res), next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Internal server error',
        error: 'Server error',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
