import { isBusinessRole } from '../middleware/isbusiness';

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');

describe('isBusinessRole Middleware', () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if req.id is missing', async () => {
    const req: any = {};
    const res = mockResponse();
    const next = jest.fn();

    await isBusinessRole(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 404 if user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const req: any = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();

    await isBusinessRole(req, res, next);

    expect(User.findById).toHaveBeenCalledWith(req.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not business', async () => {
    User.findById.mockResolvedValue({ _id: 'u1', role: 'user' });

    const req: any = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();

    await isBusinessRole(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and attach user when role is business', async () => {
    const businessUser = { _id: 'u2', role: 'business' };
    User.findById.mockResolvedValue(businessUser);

    const req: any = { id: '507f1f77bcf86cd799439011' };
    const res = mockResponse();
    const next = jest.fn();

    await isBusinessRole(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(businessUser);
    expect(res.status).not.toHaveBeenCalled();
  });
});
