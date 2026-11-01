import { ArrowUpRight, CircleAlert, Clock3, DollarSign, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { StateMessage } from '../components/StateMessage';
import { useNavigate } from 'react-router-dom';

type Summary = { a_receber: number; faturamento_mes: number; lucro_mes: number; pedidos_abertos: number; materiais_baixo_estoque: number };
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function Dashboard() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['dashboard'], queryFn: () => api<{ data: Summary }>('/dashboard/resumo') });
  if (query.isLoading) return <StateMessage title="Carregando seu resumo..." loading />;
  if (query.isError) return <StateMessage title="Não foi possível carregar o painel" description={query.error.message} />;
  const summary = query.data?.data;
  if (!summary) return <StateMessage title="Resumo vazio" description="Ainda não há dados para exibir." />;
  const cards = [{ label: 'A receber', value: currency.format(summary.a_receber), icon: DollarSign }, { label: 'Faturamento no mês', value: currency.format(summary.faturamento_mes), icon: ArrowUpRight }, { label: 'Pedidos em aberto', value: summary.pedidos_abertos.toString(), icon: ShoppingBag }, { label: 'Atenção', value: `${summary.materiais_baixo_estoque} itens`, icon: CircleAlert }];
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">Resumo da Mabie</span><h2>Visão geral</h2></div><button className="primary-button" onClick={() => navigate('/pedidos?novo=1')}>Novo pedido</button></div><div className="metric-grid">{cards.map(({ label, value, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{value}</strong></article>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Acompanhe os prazos</span><h3>Próximas entregas</h3></div><Clock3 size={20} /></div><StateMessage title="Nenhuma entrega carregada" description="Os próximos pedidos aparecerão aqui." /></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Objetivos do mês</span><h3>Metas</h3></div></div><StateMessage title="Defina sua primeira meta" description="Acompanhe faturamento, pedidos e lucro." /></section></div></div>;
}
