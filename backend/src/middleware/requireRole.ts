import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/streaming';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req.session as any).userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireRole = (role: UserRole) => (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  if (!session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (session.role !== role && session.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
