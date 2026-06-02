import { useAuth } from '../context/AuthContext';
import CambiarPasswordModal from './CambiarPasswordModal';
import {
  LogOut, Train, LayoutDashboard, ClipboardList,
  Radio, BookOpen, Map, UserCheck, CalendarDays, Database,
  Users, UserMinus, MapPin, Upload, ChevronLeft, Bell, KeyRound
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCambiarPwd, setShowCambiarPwd] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rol = (user?.cargo || '').toUpperCase();
  const esGerencia = rol === 'GERENTE' || rol === 'GERENCIA';
  const esAdmin = rol === 'ADMIN';
  const esJefeServicio = rol === 'JEFE SERVICIO' || rol === 'JEFE DE SERVICIO';
  const esJefatura = esAdmin || rol === 'IL' || rol === 'INSPECTOR DE LINEA' || rol === 'JEFE DE OPERACIONES' || rol === 'SL' || rol === 'SUPERVISOR DE LINEA';

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

          {/* ── Navigation ── */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
            {sectionLabel('Principal')}
            {navItem('/menu', 'Menú Principal', <LayoutDashboard className="h-4 w-4" />)}

            {(esGerencia || esAdmin) && (
              <>
                {sectionLabel('Gerencia')}
                {navItem('/dashboard', 'Dashboard Gerencial', <LayoutDashboard className="h-4 w-4" />)}
              </>
            )}

            {!esGerencia && sectionLabel('Operaciones')}
            {!esGerencia && navItem('/pauta-diaria', 'Pauta Diaria', <ClipboardList className="h-4 w-4" />)}
            {esJefeServicio && navItem('/jefe-servicio', 'Consola de Tráfico', <Radio className="h-4 w-4" />)}
            {esJefeServicio && navItem('/historicos', 'Históricos', <BookOpen className="h-4 w-4" />)}

            {!esGerencia && !esJefeServicio && (
              <>
                {navItem('/bitacora', 'Servicios en curso', <BookOpen className="h-4 w-4" />)}
                {navItem('/mapa-ferroviario', 'Mapa Ferroviario', <Map className="h-4 w-4" />)}
                {navItem('/asistencia', 'Asistencia y alistación', <UserCheck className="h-4 w-4" />)}
                {navItem('/turnos', 'Gráfico Tripulación', <CalendarDays className="h-4 w-4" />)}
              </>
            )}

            {esJefatura && !esJefeServicio && (
              <>
                {sectionLabel('Administración')}
                {navItem('/visor-bd', 'Base de Datos', <Database className="h-4 w-4" />)}
                {navItem('/personal-operativo', 'Personal Operativo', <Users className="h-4 w-4" />)}
                {navItem('/gestion-bajas', 'Gestión de Bajas', <UserMinus className="h-4 w-4" />)}
              </>
            )}

            {esAdmin && (
              <>
                {sectionLabel('Sistema')}
                {navItem('/georreferencia-admin', 'Georreferencia Hitos', <MapPin className="h-4 w-4" />)}
                {navItem('/carga-tripulacion', 'Cargar Tripulación', <Upload className="h-4 w-4" />)}
              </>
            )}
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
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rojo text-[9px] font-bold text-white">0</span>
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
    </div>
  );
}
