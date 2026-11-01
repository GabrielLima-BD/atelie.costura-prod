import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Orders } from './pages/Orders';
import { Clients } from './pages/Clients';
import { Finance } from './pages/Finance';
import { Materials } from './pages/Materials';
import { Services } from './pages/Services';
import { Goals } from './pages/Goals';
import { StateMessage } from './components/StateMessage';
import { Settings } from './pages/Settings';

function ProtectedRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (!ready) return <StateMessage title="Carregando..." loading />;
  if (!session) return <Login />;
  return <Routes><Route element={<AppShell />}><Route index element={<Dashboard />} /><Route path="pedidos" element={<Orders />} /><Route path="clientes" element={<Clients />} /><Route path="financeiro" element={<Finance />} /><Route path="materiais" element={<Materials />} /><Route path="servicos" element={<Services />} /><Route path="metas" element={<Goals />} /><Route path="configuracoes" element={<Settings />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

export function App() { return <ProtectedRoutes />; }
