import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { isRole } from '../utils/roles';

interface AccessTokenPayload {
  user_id: string;
  email: string;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // Scrub any spoofed identity headers from the incoming request
  delete req.headers['x-user-id'];
  delete req.headers['x-user-email'];
  delete req.headers['x-user-role'];

  // Accept token from HttpOnly cookie (browser) or Authorization header (API clients)
  const cookieToken  = (req.cookies as Record<string, string> | undefined)?.breezy_access;
  const bearerToken  = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice('Bearer '.length)
    : undefined;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;

    if (!isRole(payload.role)) {
      next();
      return;
    }

    req.user = { id: payload.user_id, email: payload.email, role: payload.role };

    // Forward verified identity to downstream services via trusted headers
    req.headers['x-user-id']    = payload.user_id;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role']  = payload.role;

    // Keep Authorization header so downstream services that read it still work
    req.headers['authorization'] = `Bearer ${token}`;

    next();
  } catch {
    next();
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
};
