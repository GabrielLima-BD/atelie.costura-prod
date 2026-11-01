import type { Request, Response } from 'express';
import { app } from '../backend/src/app.js';

export default function handler(request: Request, response: Response) {
  return app(request, response);
}
