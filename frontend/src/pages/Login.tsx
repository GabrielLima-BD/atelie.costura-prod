import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const client = supabase;
  if (!client) return <div className="login-page"><div className="login-card"><h1>Configure o Supabase</h1><p>Preencha as variáveis do arquivo .env para entrar no painel.</p></div></div>;
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    if (!client) return;
    const result = await client.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) setError('E-mail ou senha inválidos.');
    else navigate('/');
  }
  return <div className="login-page"><div className="login-card"><div className="brand login-brand"><img className="brand-logo" src="/logo.png" alt="Logo da Mabie" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><span className="brand-mark brand-logo-fallback">M</span><span>Mabie</span></div><p className="eyebrow">Gestão de confecção e uniformes</p><h1>Bem-vinda de volta</h1><form onSubmit={submit}><label>E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no painel'}</button></form></div></div>;
}
