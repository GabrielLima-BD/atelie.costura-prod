import type { RequestHandler } from 'express';
import { getSupabaseAuth } from '../config/supabase.js';
import { AppError } from './errors.js';

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token de acesso não informado');
    }
    const { data, error } = await getSupabaseAuth().auth.getUser(header.slice(7));
    if (error || !data.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token de acesso inválido');
    }
    request.userId = data.user.id;
    next();
  } catch (error) {
    next(error);
  }
};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
