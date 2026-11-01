import { supabase } from '../lib/supabase';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  const response = await fetch(`${apiUrl ?? '/api/v1'}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? 'Não foi possível concluir a operação');
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}
