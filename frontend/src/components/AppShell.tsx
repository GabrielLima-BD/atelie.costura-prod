import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, CalendarDays, LayoutDashboard, LogOut, Menu, Package, Settings, Users, WalletCards, Scissors, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motivationPhrases } from '../lib/motivation';

const navigation = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/pedidos', label: 'Pedidos', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/financeiro', label: 'Financeiro', icon: WalletCards },
  { to: '/materiais', label: 'Materiais', icon: Package },
  { to: '/servicos', label: 'Serviços', icon: Scissors },
  { to: '/metas', label: 'Metas', icon: Target },
];

export function AppShell() {
  const [identity, setIdentity] = useState({ storeName: 'Mabie', logo: 'M' });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const read = () => { try { const value = JSON.parse(localStorage.getItem('mabie-settings') ?? '{}') as { storeName?: string; logo?: string }; setIdentity({ storeName: value.storeName || 'Mabie', logo: value.logo || 'M' }); } catch { /* use defaults */ } };
    read(); window.addEventListener('mabie-settings-change', read); return () => window.removeEventListener('mabie-settings-change', read);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const dayNumber = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000);
  const phrase = motivationPhrases[((dayNumber % motivationPhrases.length) + motivationPhrases.length) % motivationPhrases.length];
  const formattedDate = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formattedTime = now.toLocaleTimeString('pt-BR');
  async function logout() { await supabase?.auth.signOut(); }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img className="brand-logo" src="/logo.png" alt="Logo da Mabie" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><span className="brand-mark brand-logo-fallback">{identity.logo}</span><span>{identity.storeName}</span></div>
      <nav aria-label="Navegação principal">{navigation.map(({ to, label, icon: Icon }) =>
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Icon size={18} strokeWidth={1.8} />{label}
        </NavLink>)}</nav>
      <div className="sidebar-footer">
        <NavLink to="/configuracoes" className="nav-item"><Settings size={18} />Configurações</NavLink>
        <button className="nav-item button-link" onClick={logout}><LogOut size={18} />Sair</button>
      </div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu"><Menu size={21} /></button><div className="topbar-message"><span className="eyebrow">{formattedDate} · {formattedTime}</span><h1>{phrase}</h1></div><button className="icon-button" aria-label="Notificações"><Bell size={19} /></button></header>
      <section className="content"><Outlet /></section>
    </main>
  </div>;
}
