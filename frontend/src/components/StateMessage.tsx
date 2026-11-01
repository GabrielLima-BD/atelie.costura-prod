type StateMessageProps = { title: string; description?: string; loading?: boolean };

export function StateMessage({ title, description, loading = false }: StateMessageProps) {
  return <div className={`state-message${loading ? ' is-loading' : ''}`} role={loading ? 'status' : undefined}>
    <strong>{title}</strong>{description && <span>{description}</span>}
  </div>;
}
