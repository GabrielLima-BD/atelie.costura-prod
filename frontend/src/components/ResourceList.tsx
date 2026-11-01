import { useState } from 'react';
import { Search } from 'lucide-react';
import { StateMessage } from './StateMessage';
import type { ReactNode } from 'react';

type ResourceListProps<T> = {
  title: string;
  items: T[] | undefined;
  loading: boolean;
  error?: Error | null;
  search: (item: T, value: string) => boolean;
  render: (item: T) => ReactNode;
};

export function ResourceList<T>({ title, items, loading, error, search, render }: ResourceListProps<T>) {
  const [term, setTerm] = useState('');
  if (loading) return <StateMessage title={`Carregando ${title.toLowerCase()}...`} loading />;
  if (error) return <StateMessage title={`Não foi possível carregar ${title.toLowerCase()}`} description={error.message} />;
  const filtered = (items ?? []).filter((item) => search(item, term.toLowerCase()));
  return <section className="panel resource-panel"><div className="toolbar"><div className="search-field"><Search size={17} /><input placeholder={`Buscar ${title.toLowerCase()}`} value={term} onChange={(event) => setTerm(event.target.value)} /></div></div>{filtered.length ? <div className="resource-list">{filtered.map(render)}</div> : <StateMessage title={`Nenhum registro em ${title.toLowerCase()}`} description="Os dados cadastrados aparecerão aqui." />}</section>;
}
