import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middlewares/errors.js';
import { idParam, pagination } from '../schemas/common.js';
import { customerSchema, expenseSchema, goalSchema, materialSchema, serviceSchema } from '../schemas/common.js';

type TableName = 'clientes' | 'servicos' | 'despesas' | 'materiais' | 'metas';
const router = Router();

function createCrud(path: string, table: TableName, schema: z.AnyZodObject) {
  router.get(`/${path}`, async (request, response, next) => {
    try {
      const { page, limit } = pagination.parse(request.query);
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await getSupabaseAdmin().from(table).select('*', { count: 'exact' }).range(from, to);
      if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
      response.json({ data, pagination: { page, limit, total: count ?? 0 } });
    } catch (error) { next(error); }
  });
  router.get(`/${path}/:id`, async (request, response, next) => {
    try {
      const { id } = idParam.parse(request.params);
      const { data, error } = await getSupabaseAdmin().from(table).select('*').eq('id', id).single();
      if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Registro não encontrado');
      response.json({ data });
    } catch (error) { next(error); }
  });
  router.post(`/${path}`, async (request, response, next) => {
    try {
      const payload = schema.parse(request.body);
      const { data, error } = await getSupabaseAdmin().from(table).insert(payload).select().single();
      if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
      response.status(201).json({ data });
    } catch (error) { next(error); }
  });
  router.patch(`/${path}/:id`, async (request, response, next) => {
    try {
      const { id } = idParam.parse(request.params);
      const payload = schema.partial().parse(request.body);
      const { data, error } = await getSupabaseAdmin().from(table).update(payload).eq('id', id).select().single();
      if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Registro não encontrado');
      response.json({ data });
    } catch (error) { next(error); }
  });
  router.delete(`/${path}/:id`, async (request, response, next) => {
    try {
      const { id } = idParam.parse(request.params);
      if (table === 'clientes') throw new AppError(409, 'USE_INACTIVATION', 'Clientes devem ser inativados, não excluídos');
      const { error } = await getSupabaseAdmin().from(table).delete().eq('id', id);
      if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
      response.status(204).send();
    } catch (error) { next(error); }
  });
}

createCrud('clientes', 'clientes', customerSchema);
createCrud('servicos', 'servicos', serviceSchema);
createCrud('despesas', 'despesas', expenseSchema);
createCrud('materiais', 'materiais', materialSchema);
createCrud('metas', 'metas', goalSchema);

export default router;
