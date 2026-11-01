import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type SettingsValue = { storeName: string; logo: string; dark: boolean; notifications: boolean };
const defaultSettings: SettingsValue = { storeName: 'Mabie', logo: 'M', dark: false, notifications: true };

function readSettings(): SettingsValue {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem('mabie-settings') ?? '{}') as Partial<SettingsValue> }; } catch { return defaultSettings; }
}

export function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(readSettings);
  useEffect(() => { document.documentElement.dataset.theme = settings.dark ? 'dark' : 'light'; }, [settings.dark]);
  function update(patch: Partial<SettingsValue>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem('mabie-settings', JSON.stringify(next));
    window.dispatchEvent(new Event('mabie-settings-change'));
  }
  async function logout() { await supabase?.auth.signOut(); navigate('/'); }
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">Preferências</span><h2>Configurações</h2></div></div><section className="settings-list"><div className="settings-card"><div><strong>Identidade da loja</strong><span>Personalize o nome e a marca exibidos no painel.</span></div><label>Nome da loja<input value={settings.storeName} onChange={(event) => update({ storeName: event.target.value })} /></label><label>Logo / inicial<input maxLength={2} value={settings.logo} onChange={(event) => update({ logo: event.target.value })} /></label></div><div className="settings-card"><div><strong>Experiência</strong><span>Escolha como o painel deve se comportar.</span></div><label className="switch-row"><span>Notificações</span><input type="checkbox" checked={settings.notifications} onChange={(event) => update({ notifications: event.target.checked })} /></label><label className="switch-row"><span>Tema escuro</span><input type="checkbox" checked={settings.dark} onChange={(event) => update({ dark: event.target.checked })} /></label></div><div className="settings-card danger-card"><div><strong>Sessão</strong><span>Encerre o acesso ao painel neste dispositivo.</span></div><button className="secondary-button" onClick={logout}>Fazer logout</button></div></section></div>;
}
