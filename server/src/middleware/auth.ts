import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bantay-kalikasan-menro-rizal-2026';

export interface AuthPayload {
  id: string;
  type: 'staff' | 'citizen';
  email: string;
  department?: string;
  staff_role?: 'main_admin' | 'section_admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function staffOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.type !== 'staff') {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
}

export function citizenOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.type !== 'citizen') {
    return res.status(403).json({ error: 'Citizen access required' });
  }
  next();
}

export function mainAdminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.type !== 'staff') {
    return res.status(403).json({ error: 'Staff access required' });
  }
  if (req.user.staff_role !== 'main_admin' && req.user.department !== 'admin') {
    return res.status(403).json({ error: 'Main Admin access required' });
  }
  next();
}

export { JWT_SECRET };
