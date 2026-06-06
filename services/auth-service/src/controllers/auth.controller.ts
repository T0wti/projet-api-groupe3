import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { pool } from '../config/db';

const JWT_SECRET          = process.env.JWT_SECRET          || 'secret';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'refresh_secret';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN      || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const USER_SERVICE_URL    = process.env.USER_SERVICE_URL    || 'http://user-service:3001';

/**
 * Generate access and refresh tokens for a user.
 */
const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { user_id: userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    { user_id: userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  return { accessToken, refreshToken };
};

/**
 * Register a new user account.
 * Creates authentication credentials and synchronizes user data with the User Service
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'username, email and password are required' });
    return;
  }

  const existing = await pool.query(
    'SELECT id FROM auth_users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    res.status(409).json({ message: 'Email already in use' });
    return;
  }

  const userId      = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    'INSERT INTO auth_users (user_id, email, password_hash) VALUES ($1, $2, $3)',
    [userId, email, passwordHash]
  );

  await fetch(`${USER_SERVICE_URL}/api/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, username, email, role: 'user' }),
  });

  const { accessToken, refreshToken } = generateTokens(userId, email);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, expiresAt]
  );

  res.status(201).json({ accessToken, refreshToken, userId });
};

/**
 * Authenticate a user and issue new tokens.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'email and password are required' });
    return;
  }

  const result = await pool.query(
    'SELECT * FROM auth_users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const user    = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  await pool.query(
    'UPDATE auth_users SET last_login = NOW() WHERE user_id = $1',
    [user.user_id]
  );

  const { accessToken, refreshToken } = generateTokens(user.user_id, user.email);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.user_id, refreshToken, expiresAt]
  );

  res.status(200).json({ accessToken, refreshToken, userId: user.user_id });
};

/**
 * Generate a new access token using a valid refresh token.
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: 'refreshToken is required' });
    return;
  }

  const result = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [refreshToken]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { user_id: string };

    const userResult = await pool.query(
      'SELECT email FROM auth_users WHERE user_id = $1',
      [decoded.user_id]
    );

    const { accessToken } = generateTokens(decoded.user_id, userResult.rows[0].email);

    res.status(200).json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Log out a user by revoking the refresh token.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: 'refreshToken is required' });
    return;
  }

  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Validate an access token and return its payload.
 */
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ valid: true, payload: decoded });
  } catch {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
};
