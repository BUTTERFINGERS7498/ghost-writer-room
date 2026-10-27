import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/helpers.js';

const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export async function register(req, res) {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] }).collation({ locale: 'en', strength: 2 });
  if (existing) {
    throw new HttpError(409, existing.email === email ? 'Email is already registered' : 'Username is taken');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });
  res.status(201).json({ token: signToken(user), user });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: signToken(user), user });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
