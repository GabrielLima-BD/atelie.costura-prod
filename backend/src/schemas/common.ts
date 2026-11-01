import { z } from 'zod';

export const uuid = z.string().uuid();
export const idParam = z.object({ id: uuid });
export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const customerSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(8).max(30),
  email: z.string().email().nullable().optional(),
  tipo: z.enum(['pessoa', 'empresa']).default('empresa'),
  endereco: z.string().max(500).nullable().optional(),
  observacoes: z.string().max(1000).nullable().optional(),
  ativo: z.boolean().default(true),
});

export const serviceSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().max(500).nullable().optional(),
  preco_varejo: z.number().nonnegative(),
  preco_atacado: z.number().nonnegative(),
  tempo_medio_dias: z.number().int().min(0).max(365),
  ativo: z.boolean().default(true),
});

export const materialSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  unidade: z.enum(['un', 'm', 'kg', 'l', 'rolo', 'caixa']),
  quantidade_atual: z.number().nonnegative(),
  estoque_minimo: z.number().nonnegative(),
  custo_unitario: z.number().nonnegative(),
  ativo: z.boolean().default(true),
});

export const expenseSchema = z.object({
  descricao: z.string().trim().min(2).max(200),
  categoria: z.enum(['material', 'equipamento', 'contas', 'transporte', 'outros']),
  valor: z.number().positive(),
  data_despesa: z.string().date(),
  fornecedor: z.string().max(200).nullable().optional(),
  pedido_id: uuid.nullable().optional(),
});

export const goalSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2020).max(2200),
  meta_faturamento: z.number().nonnegative(),
  meta_pedidos: z.number().int().nonnegative(),
  meta_lucro: z.number().nonnegative(),
});
