import { useAuth } from '../context/AuthContext';
import CambiarPasswordModal from './CambiarPasswordModal';
import {
  LogOut, Train, LayoutDashboard, ChevronLeft, Bell, KeyRound,
  ShieldAlert, X
} from 'lucide-react';
import { useState, useRef, useEffect, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAlertas } from '../context/AlertasContext';
import client from '../api/client';
import type { EventoMapa } from '../types';
import { getNavItems, SECTION_ORDER } from '../navItems';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { eventos, nuevasAlertas, limpiarNuevasAlertas } = useAlertas();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCambiarPwd, setShowCambiarPwd] = useState(false);
  const [toasts, setToasts] = useState<{id: string, alerta: any}[]>([]);
  const [emergencias, setEmergencias] = useState<EventoMapa[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const rolUpper = (user?.cargo || '').toUpperCase();
  const esTripulacion = rolUpper === 'MAQUINISTA' || rolUpper === 'AYUDANTE';
  const navItemsRol = getNavItems(user?.cargo);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (nuevasAlertas.length > 0) {
      // Las emergencias tienen prioridad máxima: van a una cola dedicada (modal/banner).
      // El resto (incidencias / fallas) se muestran como toasts efímeros.
      const emgs = nuevasAlertas.filter(a => a.tipo === 'Emergencia');
      const otras = nuevasAlertas.filter(a => a.tipo !== 'Emergencia');

      if (emgs.length > 0) {
        setEmergencias(prev => {
          const idsPrev = new Set(prev.map(e => e.id));
          const nuevas = emgs.filter(e => !idsPrev.has(e.id));
          return [...prev, ...nuevas];
        });
      }

      if (otras.length > 0) {
        const newToasts = otras.map(alerta => ({
          id: Math.random().toString(36).substring(7),
          alerta
        }));
        setToasts(prev => [...prev, ...newToasts]);
        newToasts.forEach(t => {
          setTimeout(() => {
            setToasts(prev => prev.filter(x => x.id !== t.id));
          }, 8000);
        });
      }

      limpiarNuevasAlertas();
    }
  }, [nuevasAlertas, limpiarNuevasAlertas]);

  const descartarEmergencia = (id?: string) =>
    setEmergencias(prev => prev.filter(e => e.id !== id));

  // Jefatura marca la emergencia como CONTROLADA → sale del mapa y de las alertas activas.
  const marcarControlada = async (em: EventoMapa) => {
    const pk = (em.id || '').replace('em_', '');
    try {
      if (pk) await client.post(`/alertas/emergencias/${pk}/resolver/`);
      descartarEmergencia(em.id);
    } catch {
      alert('No se pudo marcar la emergencia como controlada.');
    }
  };

  const navItem = (path: string, label: string, icon: React.ReactNode) => {
    const active = location.pathname === path;
    return (
      <Link
        key={path}
        to={path}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
          active
            ? 'bg-white/15 text-white shadow-sm shadow-black/10'
            : 'text-white/60 hover:bg-white/8 hover:text-white'
        }`}
      >
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
          active ? 'bg-rojo text-white' : 'bg-white/8 text-white/50 group-hover:bg-white/15 group-hover:text-white/80'
        }`}>
          {icon}
        </span>
        <span className={sidebarOpen ? 'block truncate' : 'hidden'}>{label}</span>
        {active && sidebarOpen && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rojo animate-pulse" />
        )}
      </Link>
    );
  };

  const sectionLabel = (text: string) => (
    sidebarOpen ? (
      <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">{text}</div>
    ) : <div className="mt-4 mb-2 border-t border-white/10" />
  );

  const isMenuPage = location.pathname === '/menu';

  // Iniciales para avatar
  const initials = user ? `${(user.nombre || '')[0] || ''}${(user.apellido || '')[0] || ''}`.toUpperCase() : 'U';

  return (
    <div className="flex min-h-screen bg-gris-bg">
      {!isMenuPage && (
        <aside
          className={`${sidebarOpen ? 'w-[280px]' : 'w-[72px]'} flex-shrink-0 overflow-hidden bg-gradient-to-b from-azul via-azul to-[#001a42] flex flex-col transition-all duration-300 relative`}
          style={{ boxShadow: '4px 0 24px rgba(0, 42, 92, 0.15)' }}
        >
          {/* ── Brand header ── */}
          <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${!sidebarOpen ? 'justify-center' : ''}`}>
            {/* Tren: botón de expandir cuando está colapsado, decorativo cuando está abierto */}
            <button
              onClick={() => !sidebarOpen && setSidebarOpen(true)}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 ring-1 ring-white/10 transition-all
                ${!sidebarOpen ? 'hover:from-white/25 hover:to-white/15 hover:ring-white/30 cursor-pointer' : 'cursor-default'}`}
              title={!sidebarOpen ? 'Expandir menú' : undefined}
            >
              <Train className="h-5 w-5 text-white" />
            </button>

            {sidebarOpen && (
              <>
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-white leading-tight tracking-tight">
                    Syncro<span className="text-rojo">Red</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">EFE Sur</div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* ── Navigation (misma fuente que el menú principal) ── */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
            {sectionLabel('Principal')}
            {navItem('/menu', 'Menú Principal', <LayoutDashboard className="h-4 w-4" />)}

            {SECTION_ORDER.map((sec) => {
              const its = navItemsRol.filter((i) => i.section === sec);
              if (its.length === 0) return null;
              return (
                <Fragment key={sec}>
                  {sectionLabel(sec)}
                  {its.map((i) => navItem(i.to, i.label, <i.Icon className="h-4 w-4" />))}
                </Fragment>
              );
            })}
          </nav>

          {/* ── User section ── */}
          <div className="border-t border-white/8 p-3">
            {sidebarOpen && user && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rojo to-rojo-oscuro text-xs font-bold text-white ring-2 ring-white/20">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{user.nombre} {user.apellido}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">{user.cargo}</div>
                </div>
              </div>
            )}
            {!sidebarOpen && user && (
              <div className="mb-3 flex justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rojo to-rojo-oscuro text-xs font-bold text-white ring-2 ring-white/20">
                  {initials}
                </div>
              </div>
            )}
            {sidebarOpen && (
              <div className="mb-3 flex justify-center">
                <img
                  src="/logo_efe.png"
                  alt="EFE Trenes de Chile"
                  className="h-7 w-auto opacity-25 brightness-200"
                />
              </div>
            )}
            <button
              onClick={logout}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white rounded-xl transition-all ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        {!isMenuPage && (
          <header className="relative h-16 bg-white flex items-center justify-between px-6" style={{ boxShadow: '0 2px 12px rgba(0,42,92,0.06)' }}>
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #002A5C 0%, #002A5C 70%, #E31837 70%, #E31837 100%)' }} />

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-azul">
                <Train className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-azul leading-tight">
                  Syncro<span className="text-rojo">Red</span> <span className="font-semibold text-gray-400">EFE Sur</span>
                </h1>
              </div>
            </div>

            {/* Logo EFE centrado */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <img
                src="/logo_efe.png"
                alt="EFE Trenes de Chile"
                className="h-8 w-auto opacity-70"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-azul transition-colors">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rojo text-[9px] font-bold text-white">
                  {eventos.filter(e => ['ACTIVA', 'REGISTRADA', 'PENDIENTE'].includes(e.estado)).length}
                </span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-gray-100 transition-colors"
                >
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800 leading-tight">
                      {user?.nombre} {user?.apellido}
                    </div>
                    <div className="text-[11px] font-bold text-azul leading-tight">
                      {user?.cargo}
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-azul to-azul/70 text-xs font-bold text-white shadow-sm">
                    {initials}
                  </div>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-azul/5 border-b border-gray-100">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azul to-azul/70 text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{user?.nombre} {user?.apellido}</div>
                        <div className="text-[11px] font-bold text-azul">{user?.cargo}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowCambiarPwd(true); setShowProfileMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <KeyRound className="h-4 w-4 text-azul flex-shrink-0" />
                      <span>Cambiar contraseña</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs font-medium text-gray-400">
                {new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </header>
        )}
        <div className={`flex-1 overflow-auto ${isMenuPage ? 'flex flex-col items-center pt-10 px-4 pb-10' : 'p-6'}`}>{children}</div>
      </main>
      {user?.must_change_password && <CambiarPasswordModal />}
      {showCambiarPwd && !user?.must_change_password && <CambiarPasswordModal onClose={() => setShowCambiarPwd(false)} />}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className="w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 animate-in slide-in-from-right-8 fade-in">
            <div className="flex items-start p-4">
              <div className="flex-shrink-0 pt-0.5">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  t.alerta.tipo === 'Emergencia' ? 'bg-rojo/10 text-rojo' : 
                  t.alerta.tipo === 'Falla de Equipo' ? 'bg-orange-100 text-orange-600' : 
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {t.alerta.tipo} - Tren {t.alerta.tren}
                </p>
                <p className="mt-1 text-xs text-gray-500 font-medium line-clamp-2">
                  {t.alerta.evento}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-azul focus:ring-offset-2"
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={`h-1 w-full ${
              t.alerta.tipo === 'Emergencia' ? 'bg-rojo' :
              t.alerta.tipo === 'Falla de Equipo' ? 'bg-orange-500' :
              'bg-yellow-400'
            }`} />
          </div>
        ))}
      </div>

      {/* ── EMERGENCIAS — prioridad máxima ──
          Tripulación: banner superior no-obstructivo (para no tapar la bitácora).
          Resto de roles: modal emergente que exige reconocimiento. */}
      {emergencias.length > 0 && esTripulacion && (
        <div className="fixed top-0 inset-x-0 z-[10000] flex flex-col">
          {emergencias.map(em => (
            <div key={em.id} className="flex items-center gap-3 bg-rojo px-5 py-2.5 text-white shadow-lg animate-in slide-in-from-top-4">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 animate-pulse" />
              <div className="flex-1 text-sm leading-tight">
                <span className="font-extrabold uppercase tracking-wide">Emergencia</span>
                <span className="mx-2 opacity-60">·</span>
                <span className="font-semibold">{em.evento || 'Evento'}</span>
                {em.tren && <span className="opacity-90"> — Servicio {em.tren}</span>}
                {(em.ubicacion || em.notificado_por) && (
                  <span className="opacity-90">
                    {em.ubicacion ? ` — ${em.ubicacion}` : ''}
                    {em.notificado_por ? ` — notificó ${em.notificado_por}` : ''}
                  </span>
                )}
              </div>
              <button onClick={() => descartarEmergencia(em.id)} className="rounded-md p-1 hover:bg-white/20" title="Descartar">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {emergencias.length > 0 && !esTripulacion && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in">
            <div className="flex items-center gap-3 bg-rojo px-6 py-4 text-white">
              <ShieldAlert className="h-7 w-7 animate-pulse" />
              <div>
                <div className="text-lg font-extrabold uppercase tracking-wide leading-tight">Emergencia Activa</div>
                <div className="text-xs text-white/80">Notificación simultánea a todos los roles</div>
              </div>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
              {emergencias.map(em => (
                <div key={em.id} className="rounded-xl border border-rojo/20 bg-rojo/5 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2"><span className="font-bold text-azul">Evento:</span> {em.evento || '—'}</div>
                    <div><span className="font-bold text-azul">Notificado por:</span> {em.notificado_por || '—'}</div>
                    <div><span className="font-bold text-azul">Equipo:</span> {em.equipo || '—'}</div>
                    <div><span className="font-bold text-azul">Servicio:</span> {em.tren || '—'}</div>
                    <div className="col-span-2"><span className="font-bold text-azul">Ubicación:</span> {em.ubicacion || (em.lat != null && em.lon != null ? `${em.lat.toFixed(5)}, ${em.lon.toFixed(5)}` : 'Pendiente de GPS')}</div>
                    <div className="col-span-2 text-xs text-gray-500">{em.fecha_hora ? new Date(em.fecha_hora).toLocaleString('es-CL') : ''}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => descartarEmergencia(em.id)}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                      Entendido
                    </button>
                    <button
                      onClick={() => marcarControlada(em)}
                      className="flex-1 rounded-lg bg-verde px-4 py-2 text-sm font-bold text-white hover:bg-verde/90"
                    >
                      Marcar controlada
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
