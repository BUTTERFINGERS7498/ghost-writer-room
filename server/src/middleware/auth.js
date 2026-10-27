import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/helpers.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in first');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Your session has expired, please log in again');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, 'Account not found');

  req.user = user;
  next();
}
