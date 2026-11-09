import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ResourceList } from '../components/ResourceList';
import { Modal } from '../components/Modal';

type Order = {
  id: string;
  codigo: string;
  cliente_id: string;
  data_entrada: string;
  prazo_entrega: string;
  status: string;
  tipo_venda: string;
  desconto: number;
  observacoes?: string | null;
  valor_total: number;
  clientes?: { nome: string };
  pedido_itens?: Array<{
    servico_id: string;
    descricao_peca: string;
    quantidade: number;
    valor_unitario: number;
    medidas_observacoes?: string | null;
  }>;
};

type OrderForm = {
  cliente_id: string;
  servico_id: string;
  descricao_peca: string;
  data_entrada: string;
  prazo_entrega: string;
  status: string;
  tipo_venda: string;
  desconto: string;
  valor_unitario: string;
  quantidade: string;
  medidas_observacoes: string;
  observacoes: string;
};

type OrderFilters = {
  status: string;
  dataDe: string;
  dataAte: string;
  entregaDe: string;
  entregaAte: string;
  valorMin: string;
  valorMax: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): OrderForm => ({
  cliente_id: '',
  servico_id: '',
  descricao_peca: '',
  data_entrada: today(),
  prazo_entrega: '',
  status: 'orcamento',
  tipo_venda: 'atacado',
  desconto: '0',
  valor_unitario: '',
  quantidade: '1',
  medidas_observacoes: '',
  observacoes: '',
});
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const emptyFilters = (): OrderFilters => ({
  status: '',
  dataDe: '',
  dataAte: '',
  entregaDe: '',
  entregaAte: '',
  valorMin: '',
  valorMax: '',
});

function formFromOrder(order: Order): OrderForm {
  const item = order.pedido_itens?.[0];
  return {
    cliente_id: order.cliente_id,
    servico_id: item?.servico_id ?? '',
    descricao_peca: item?.descricao_peca ?? '',
    data_entrada: order.data_entrada,
    prazo_entrega: order.prazo_entrega,
    status: order.status,
    tipo_venda: order.tipo_venda,
    desconto: String(order.desconto ?? 0),
    valor_unitario: String(item?.valor_unitario ?? ''),
    quantidade: String(item?.quantidade ?? 1),
    medidas_observacoes: item?.medidas_observacoes ?? '',
    observacoes: order.observacoes ?? '',
  };
}

export function Orders() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'new' | 'historical' | 'edit'>('new');
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderForm>(emptyForm());
  const [filters, setFilters] = useState<OrderFilters>(emptyFilters());
  const [searchParams] = useSearchParams();
  const client = useQueryClient();
  const orderQuery = new URLSearchParams({ limit: '100' });
  if (filters.status) orderQuery.set('status', filters.status);
  if (filters.dataDe) orderQuery.set('de', filters.dataDe);
  if (filters.dataAte) orderQuery.set('ate', filters.dataAte);
  if (filters.entregaDe) orderQuery.set('entrega_de', filters.entregaDe);
  if (filters.entregaAte) orderQuery.set('entrega_ate', filters.entregaAte);
  if (filters.valorMin) orderQuery.set('valor_min', filters.valorMin);
  if (filters.valorMax) orderQuery.set('valor_max', filters.valorMax);
  const query = useQuery({ queryKey: ['orders', filters], queryFn: () => api<{ data: Order[] }>(`/pedidos?${orderQuery.toString()}`) });
  const clients = useQuery({ queryKey: ['clients'], queryFn: () => api<{ data: { id: string; nome: string }[] }>('/clientes?limit=100') });
  const services = useQuery({ queryKey: ['services'], queryFn: () => api<{ data: { id: string; nome: string; preco_varejo: number; preco_atacado?: number }[] }>('/servicos?limit=100') });

  useEffect(() => {
    if (searchParams.get('novo') === '1') {
      setMode('new');
      setForm(emptyForm());
      setOpen(true);
    }
  }, [searchParams]);

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };
  const openCreate = (kind: 'new' | 'historical') => {
    setMode(kind);
    setForm(emptyForm());
    setOpen(true);
  };
  const openEdit = async (order: Order) => {
    const result = await api<{ data: Order }>(`/pedidos/${order.id}`);
    setEditing(result.data);
    setMode('edit');
    setForm(formFromOrder(result.data));
    setOpen(true);
  };
  const payload = () => ({
    cliente_id: form.cliente_id,
    data_entrada: form.data_entrada,
    prazo_entrega: form.prazo_entrega,
    status: form.status,
    tipo_venda: form.tipo_venda,
    desconto: Number(form.desconto),
    observacoes: form.observacoes || null,
    itens: [{
      servico_id: form.servico_id,
      descricao_peca: form.descricao_peca,
      quantidade: Number(form.quantidade),
      valor_unitario: Number(form.valor_unitario),
      medidas_observacoes: form.medidas_observacoes || null,
    }],
  });
  const mutation = useMutation({
    mutationFn: () => api(mode === 'edit' && editing ? `/pedidos/${editing.id}` : '/pedidos', {
      method: mode === 'edit' && editing ? 'PATCH' : 'POST',
      body: JSON.stringify(payload()),
    }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['orders'] }); close(); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api(`/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (_, variables) => {
      client.setQueriesData<{ data: Order[] }>({ queryKey: ['orders'] }, (current) => current ? {
        ...current,
        data: current.data.map((order) => order.id === variables.id ? { ...order, status: variables.status } : order),
      } : current);
      void client.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  const title = mode === 'edit' ? 'Editar pedido' : mode === 'historical' ? 'Registrar pedido já feito' : 'Novo pedido';
  const submitLabel = mode === 'edit' ? 'Salvar alterações' : mode === 'historical' ? 'Registrar pedido' : 'Criar pedido';
  return <div className="page-stack">
    <div className="page-heading">
      <div><span className="eyebrow">Produção e prazos</span><h2>Pedidos</h2></div>
      <div className="button-row">
        <button className="secondary-button" onClick={() => openCreate('historical')}>Registrar pedido</button>
        <button className="primary-button" onClick={() => openCreate('new')}>Novo pedido</button>
      </div>
    </div>
    <Modal title={title} description={mode === 'historical' ? 'Informe as datas reais do pedido já realizado.' : 'Registre ou edite a peça, o cliente e todos os dados do pedido.'} open={open} onClose={close} onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} submitLabel={submitLabel} pending={mutation.isPending}>
      <div className="form-grid">
        <label>Cliente<select required value={form.cliente_id} onChange={(event) => setForm({ ...form, cliente_id: event.target.value })}><option value="">Selecione</option>{clients.data?.data.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Serviço<select required value={form.servico_id} onChange={(event) => { const service = services.data?.data.find((item) => item.id === event.target.value); setForm({ ...form, servico_id: event.target.value, valor_unitario: String(form.tipo_venda === 'atacado' ? (service?.preco_atacado ?? service?.preco_varejo ?? '') : (service?.preco_varejo ?? '')) }); }}><option value="">Selecione</option>{services.data?.data.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Data do pedido<input required type="date" readOnly={mode === 'new'} value={form.data_entrada} onChange={(event) => setForm({ ...form, data_entrada: event.target.value })} /></label>
        <label>Prazo de entrega<input required min={mode === 'new' ? today() : undefined} type="date" value={form.prazo_entrega} onChange={(event) => setForm({ ...form, prazo_entrega: event.target.value })} /></label>
        <label>Descrição da peça<input required value={form.descricao_peca} onChange={(event) => setForm({ ...form, descricao_peca: event.target.value })} /></label>
        <label>Quantidade<input required min="0.01" step="0.01" type="number" value={form.quantidade} onChange={(event) => setForm({ ...form, quantidade: event.target.value })} /></label>
        <label>Preço unitário<input required min="0" step="0.01" type="number" value={form.valor_unitario} onChange={(event) => setForm({ ...form, valor_unitario: event.target.value })} /></label>
        <label>Modalidade<select value={form.tipo_venda} onChange={(event) => setForm({ ...form, tipo_venda: event.target.value })}><option value="atacado">Atacado</option><option value="varejo">Varejo</option></select></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="orcamento">Orçamento</option><option value="aprovado">Aprovado</option><option value="em_producao">Em produção</option><option value="pronto">Pronto</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select></label>
        <label>Desconto<input min="0" step="0.01" type="number" value={form.desconto} onChange={(event) => setForm({ ...form, desconto: event.target.value })} /></label>
        <label>Medidas e observações da peça<input value={form.medidas_observacoes} onChange={(event) => setForm({ ...form, medidas_observacoes: event.target.value })} /></label>
        <label className="field-wide">Observações do pedido<textarea value={form.observacoes} onChange={(event) => setForm({ ...form, observacoes: event.target.value })} /></label>
      </div>
    </Modal>
    <section className="panel order-filters">
      <div className="order-filters-grid">
        <label>Status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option><option value="orcamento">Orçamento</option><option value="aprovado">Aprovado</option><option value="em_producao">Em produção</option><option value="pronto">Pronto</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select></label>
        <label>Pedido desde<input type="date" value={filters.dataDe} onChange={(event) => setFilters({ ...filters, dataDe: event.target.value })} /></label>
        <label>Pedido até<input type="date" value={filters.dataAte} onChange={(event) => setFilters({ ...filters, dataAte: event.target.value })} /></label>
        <label>Entrega desde<input type="date" value={filters.entregaDe} onChange={(event) => setFilters({ ...filters, entregaDe: event.target.value })} /></label>
        <label>Entrega até<input type="date" value={filters.entregaAte} onChange={(event) => setFilters({ ...filters, entregaAte: event.target.value })} /></label>
        <label>Preço mínimo<input min="0" step="0.01" type="number" value={filters.valorMin} onChange={(event) => setFilters({ ...filters, valorMin: event.target.value })} /></label>
        <label>Preço máximo<input min="0" step="0.01" type="number" value={filters.valorMax} onChange={(event) => setFilters({ ...filters, valorMax: event.target.value })} /></label>
        <button className="secondary-button filter-clear" type="button" onClick={() => setFilters(emptyFilters())}>Limpar filtros</button>
      </div>
    </section>
    <ResourceList title="Pedidos" items={query.data?.data} loading={query.isLoading} error={query.error} search={(item, term) => `${item.codigo} ${item.clientes?.nome ?? ''}`.toLowerCase().includes(term)} render={(item) => <article className="resource-row order-row" key={item.id} onDoubleClick={() => void openEdit(item)}>
      <div><strong>{item.codigo}</strong><span>{item.clientes?.nome ?? 'Cliente não informado'}</span></div>
      <select className="status-select" value={item.status} onChange={(event) => statusMutation.mutate({ id: item.id, status: event.target.value })}><option value="orcamento">Orçamento</option><option value="aprovado">Aprovado</option><option value="em_producao">Em produção</option><option value="pronto">Pronto</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select>
      <span className="order-due-date">{new Date(`${item.prazo_entrega}T12:00:00`).toLocaleDateString('pt-BR')}</span>
      <strong className="order-total">{money.format(item.valor_total)}</strong><button className="secondary-button" onClick={() => void openEdit(item)}>Editar</button>
    </article>} />
  </div>;
}
