import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middlewares/errors.js';
import { idParam, pagination, uuid } from '../schemas/common.js';

const itemSchema = z.object({
  servico_id: uuid,
  descricao_peca: z.string().trim().min(2).max(200),
  quantidade: z.number().positive(),
  valor_unitario: z.number().nonnegative(),
  medidas_observacoes: z.string().max(1000).nullable().optional(),
});
const orderSchema = z.object({
  cliente_id: uuid,
  data_entrada: z.string().date(),
  prazo_entrega: z.string().date(),
  status: z.enum(['orcamento', 'aprovado', 'em_producao', 'pronto', 'entregue', 'cancelado']).default('orcamento'),
  tipo_venda: z.enum(['varejo', 'atacado']).default('atacado'),
  desconto: z.number().nonnegative().default(0),
  observacoes: z.string().max(1000).nullable().optional(),
  itens: z.array(itemSchema).min(1),
});
const statusSchema = z.object({
  status: z.enum(['orcamento', 'aprovado', 'em_producao', 'pronto', 'entregue', 'cancelado']),
});
const paymentSchema = z.object({
  valor: z.number().positive(),
  forma: z.enum(['pix', 'dinheiro', 'cartao', 'transferencia']),
  data_pagamento: z.string().date(),
  tipo: z.enum(['sinal', 'parcial', 'quitacao']),
  observacoes: z.string().max(500).nullable().optional(),
});

const router = Router();
router.get('/pedidos', async (request, response, next) => {
  try {
    const { page, limit } = pagination.parse(request.query);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = getSupabaseAdmin().from('pedidos').select('*, clientes(nome, telefone), pedido_itens(*)', { count: 'exact' });
    const status = typeof request.query.status === 'string' ? request.query.status : undefined;
    const cliente = typeof request.query.cliente === 'string' ? request.query.cliente : undefined;
    const de = typeof request.query.de === 'string' ? request.query.de : undefined;
    const ate = typeof request.query.ate === 'string' ? request.query.ate : undefined;
    const entregaDe = typeof request.query.entrega_de === 'string' ? request.query.entrega_de : undefined;
    const entregaAte = typeof request.query.entrega_ate === 'string' ? request.query.entrega_ate : undefined;
    const valorMin = typeof request.query.valor_min === 'string' ? Number(request.query.valor_min) : undefined;
    const valorMax = typeof request.query.valor_max === 'string' ? Number(request.query.valor_max) : undefined;
    if (status) query = query.eq('status', status);
    if (cliente) query = query.eq('cliente_id', cliente);
    if (de) query = query.gte('data_entrada', de);
    if (ate) query = query.lte('data_entrada', ate);
    if (entregaDe) query = query.gte('prazo_entrega', entregaDe);
    if (entregaAte) query = query.lte('prazo_entrega', entregaAte);
    if (valorMin !== undefined && Number.isFinite(valorMin)) query = query.gte('valor_total', valorMin);
    if (valorMax !== undefined && Number.isFinite(valorMax)) query = query.lte('valor_total', valorMax);
    if (request.query.atrasados === 'true') query = query.lt('prazo_entrega', new Date().toISOString().slice(0, 10)).not('status', 'in', '("entregue","cancelado")');
    const { data, error, count } = await query.order('prazo_entrega', { ascending: true }).range(from, to);
    if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
    response.json({ data, pagination: { page, limit, total: count ?? 0 } });
  } catch (error) { next(error); }
});

router.get('/pedidos/:id', async (request, response, next) => {
  try {
    const { id } = idParam.parse(request.params);
    const { data, error } = await getSupabaseAdmin().from('pedidos')
      .select('*, clientes(*), pedido_itens(*, servicos(*)), pagamentos(*)').eq('id', id).single();
    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Pedido não encontrado');
    response.json({ data });
  } catch (error) { next(error); }
});

router.post('/pedidos', async (request, response, next) => {
  try {
    const payload = orderSchema.parse(request.body);
    const { itens, ...order } = payload;
    const { data: created, error } = await getSupabaseAdmin().from('pedidos').insert(order).select().single();
    if (error || !created) throw new AppError(400, 'DATABASE_ERROR', error?.message ?? 'Pedido não criado');
    const { error: itemsError } = await getSupabaseAdmin().from('pedido_itens').insert(itens.map((item) => ({ ...item, pedido_id: created.id })));
    if (itemsError) {
      await getSupabaseAdmin().from('pedidos').delete().eq('id', created.id);
      throw new AppError(400, 'DATABASE_ERROR', itemsError.message);
    }
    response.status(201).json({ data: created });
  } catch (error) { next(error); }
});

router.patch('/pedidos/:id', async (request, response, next) => {
  try {
    const { id } = idParam.parse(request.params);
    const payload = orderSchema.parse(request.body);
    const { itens, ...order } = payload;
    const admin = getSupabaseAdmin();
    const { data: updated, error } = await admin.from('pedidos').update(order).eq('id', id).select().single();
    if (error || !updated) throw new AppError(404, 'NOT_FOUND', error?.message ?? 'Pedido não encontrado');
    const { error: deleteError } = await admin.from('pedido_itens').delete().eq('pedido_id', id);
    if (deleteError) throw new AppError(400, 'DATABASE_ERROR', deleteError.message);
    const { error: itemsError } = await admin.from('pedido_itens').insert(itens.map((item) => ({ ...item, pedido_id: id })));
    if (itemsError) throw new AppError(400, 'DATABASE_ERROR', itemsError.message);
    response.json({ data: updated });
  } catch (error) { next(error); }
});

router.patch('/pedidos/:id/status', async (request, response, next) => {
  try {
    const { id } = idParam.parse(request.params);
    const { status } = statusSchema.parse(request.body);
    const { data: current, error: currentError } = await getSupabaseAdmin().from('pedidos').select('status').eq('id', id).single();
    if (currentError || !current) throw new AppError(404, 'NOT_FOUND', 'Pedido não encontrado');
    const { data, error } = await getSupabaseAdmin().from('pedidos').update({ status }).eq('id', id).select().single();
    if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
    response.json({ data });
  } catch (error) { next(error); }
});

router.post('/pedidos/:id/pagamentos', async (request, response, next) => {
  try {
    const { id } = idParam.parse(request.params);
    const payload = paymentSchema.parse(request.body);
    const { data, error } = await getSupabaseAdmin().from('pagamentos').insert({ ...payload, pedido_id: id }).select().single();
    if (error) throw new AppError(400, 'PAYMENT_ERROR', error.message);
    response.status(201).json({ data });
  } catch (error) { next(error); }
});

router.get('/pagamentos', async (_request, response, next) => {
  try {
    const { data, error } = await getSupabaseAdmin().from('pagamentos').select('*, pedidos(codigo)');
    if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
    response.json({ data });
  } catch (error) { next(error); }
});

export default router;
