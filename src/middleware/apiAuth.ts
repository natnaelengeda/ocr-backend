import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Load API Key from .env file
const API_KEY = process.env.API_KEY || '';

export function apiAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const allowedIP = ['asdf'];

  // Retrieve IP address safely
  const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress) as string | undefined;

  // Define allowed paths
  const allowedPaths = [
    '/getImage',
    '/test'
  ];

  // Authentication logic
  if (
    apiKey === API_KEY ||
    allowedPaths.some(path => req.path.includes(path)) ||
    (ip && allowedIP.includes(ip))
  ) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}
