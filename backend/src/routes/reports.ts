import { Router } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { AppError } from '../middlewares/errors.js';
import { idParam } from '../schemas/common.js';

const router = Router();

async function view(viewName: string) {
  const { data, error } = await getSupabaseAdmin().from(viewName).select('*');
  if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
  return data;
}

router.get('/dashboard/resumo', async (_request, response, next) => {
  try {
    const [orders, receivable, profit, lowStock] = await Promise.all([
      view('pedidos'),
      view('vw_saldo_a_receber'),
      view('vw_lucro_mensal'),
      view('vw_materiais_abaixo_minimo'),
    ]);
    const month = new Date().toISOString().slice(0, 7);
    const monthProfit = profit.find((row) => String(row.mes).startsWith(month));
    response.json({
      data: {
        a_receber: receivable.reduce((sum, row) => sum + Number(row.saldo ?? 0), 0),
        faturamento_mes: orders.filter((row) => String(row.data_entrada).startsWith(month) && row.status !== 'cancelado')
          .reduce((sum, row) => sum + Number(row.valor_total ?? 0), 0),
        lucro_mes: Number(monthProfit?.lucro ?? 0),
        pedidos_abertos: orders.filter((row) => !['entregue', 'cancelado'].includes(String(row.status))).length,
        materiais_baixo_estoque: lowStock.length,
      },
    });
  } catch (error) { next(error); }
});

router.get('/dashboard/faturamento-mensal', async (_request, response, next) => {
  try { response.json({ data: await view('vw_faturamento_mensal') }); } catch (error) { next(error); }
});
router.get('/dashboard/prazos', async (_request, response, next) => {
  try { response.json({ data: await view('vw_pedidos_atrasados') }); } catch (error) { next(error); }
});
router.get('/relatorios/financeiro', async (_request, response, next) => {
  try { response.json({ data: await view('vw_lucro_mensal') }); } catch (error) { next(error); }
});
router.get('/relatorios/clientes/:id/saldo', async (request, response, next) => {
  try {
    const { id } = idParam.parse(request.params);
    const { data, error } = await getSupabaseAdmin().from('vw_saldo_a_receber').select('*').eq('cliente_id', id);
    if (error) throw new AppError(400, 'DATABASE_ERROR', error.message);
    response.json({ data });
  } catch (error) { next(error); }
});
router.get('/metas/progresso', async (_request, response, next) => {
  try {
    const [goals, billing, profit] = await Promise.all([view('metas'), view('vw_faturamento_mensal'), view('vw_lucro_mensal')]);
    response.json({ data: { metas: goals, faturamento: billing, lucro: profit } });
  } catch (error) { next(error); }
});

export default router;
