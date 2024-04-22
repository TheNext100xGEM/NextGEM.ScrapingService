import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/config';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      } else {
        // Attach the decoded token to the request object for later use
        req['user'] = decodedToken;
        next();
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
