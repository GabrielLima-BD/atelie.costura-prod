import type { FormEvent, ReactNode } from 'react';
import { Modal } from './Modal';

type EditModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  pending?: boolean;
};

export function EditModal({ title, open, onClose, onSubmit, children, pending }: EditModalProps) {
  return <Modal title={title} description="As alterações serão salvas no banco de dados." open={open} onClose={onClose} onSubmit={onSubmit} submitLabel="Salvar alterações" pending={pending}>{children}</Modal>;
}
