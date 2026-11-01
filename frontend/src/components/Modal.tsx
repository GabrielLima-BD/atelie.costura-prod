import type { FormEvent, ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  submitLabel: string;
  pending?: boolean;
};

export function Modal({ title, description, open, onClose, onSubmit, children, submitLabel, pending = false }: ModalProps) {
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="modal-card" onSubmit={onSubmit} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}><X size={20} /></button></div>
      <div className="modal-body">{children}</div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={pending}>{pending ? 'Salvando...' : submitLabel}</button></div>
    </form>
  </div>;
}
