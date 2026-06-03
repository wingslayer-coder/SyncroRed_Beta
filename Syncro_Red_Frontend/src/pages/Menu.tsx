import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Menu.css';
import {
  LayoutDashboard,
  ClipboardList,
  TrainFront,
  BookOpen,
  Map,
  Users,
  UserCheck,
  AlertTriangle,
  Database,
  Upload,
  LogOut,
  ChevronRight,
  FileText,
} from 'lucide-react';

export default function Menu() {
  const { user, logout } = useAuth();
  const rol = (user?.cargo || '').toUpperCase();
  const esGerencia = rol === 'GERENTE' || rol === 'GERENCIA';
  const esAdmin = rol === 'ADMIN';
  const esJefeServicio = rol === 'JEFE SERVICIO' || rol === 'JEFE DE SERVICIO';
  const esJefatura = esAdmin || rol === 'IL' || rol === 'INSPECTOR DE LINEA' || rol === 'JEFE DE OPERACIONES' || rol === 'SL' || rol === 'SUPERVISOR DE LINEA';

  const iniciales = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase().trim();

  const card = (
    to: string,
    label: string,
    descripcion: string,
    icon: React.ReactNode,
    primary = false
  ) => (
    <Link key={to} to={to} className={`menu-card ${primary ? 'primary' : ''}`}>
      <span className="menu-card-icon">{icon}</span>
      <span className="menu-card-body">
        <span className="menu-card-title">{label}</span>
        <span className="menu-card-desc">{descripcion}</span>
      </span>
      <ChevronRight className="menu-card-arrow" size={18} />
    </Link>
  );

  return (
    <div className="menu-page">
      {/* ===== Fondo animado SVG ===== */}
      <svg className="menu-bg-svg" aria-hidden="true" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f4f8" />
            <stop offset="100%" stopColor="#e8edf5" />
          </linearGradient>
        </defs>

        {/* ════ LADO IZQUIERDO ════ */}

        {/* Azul marino — baja desde abajo, diagonal hacia arriba-izquierda off-screen */}
        <path className="deco-path"
          d="M 0 900 L 0 480 L -180 180"
          fill="none" stroke="#002A5C" strokeWidth="52" strokeLinejoin="round" strokeLinecap="round" opacity="0.13" />

        {/* Azul claro — paralela, offset */}
        <path className="deco-path"
          d="M 58 900 L 58 500 L -130 180"
          fill="none" stroke="#4a7fc1" strokeWidth="28" strokeLinejoin="round" strokeLinecap="round" opacity="0.14" />

        {/* Rojo — desde arriba, diagonal hacia abajo-izquierda off-screen */}
        <path className="deco-path"
          d="M 120 -10 L 120 420 L -80 700"
          fill="none" stroke="#E31837" strokeWidth="38" strokeLinejoin="round" strokeLinecap="round" opacity="0.17" />

        {/* Celeste fino — diagonal pura, cruza el rojo */}
        <path className="deco-path"
          d="M 80 -10 L 80 380 L -110 640"
          fill="none" stroke="#5ba8d4" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity="0.16" />

        {/* ════ LADO DERECHO ════ */}

        {/* Azul marino — baja desde abajo, diagonal hacia arriba-derecha off-screen */}
        <path className="deco-path"
          d="M 1440 900 L 1440 480 L 1620 180"
          fill="none" stroke="#002A5C" strokeWidth="52" strokeLinejoin="round" strokeLinecap="round" opacity="0.13" />

        {/* Azul claro — paralela */}
        <path className="deco-path"
          d="M 1382 900 L 1382 500 L 1570 180"
          fill="none" stroke="#4a7fc1" strokeWidth="28" strokeLinejoin="round" strokeLinecap="round" opacity="0.14" />

        {/* Rojo — desde arriba, diagonal hacia abajo-derecha off-screen */}
        <path className="deco-path"
          d="M 1320 -10 L 1320 420 L 1520 700"
          fill="none" stroke="#E31837" strokeWidth="38" strokeLinejoin="round" strokeLinecap="round" opacity="0.17" />

        {/* Celeste fino */}
        <path className="deco-path"
          d="M 1360 -10 L 1360 380 L 1550 640"
          fill="none" stroke="#5ba8d4" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity="0.16" />


      </svg>
      {/* ===== Barra superior ===== */}
      <header className="menu-topbar">
        <div className="menu-brand">
          <div className="menu-brand-mark">
            <TrainFront size={22} />
          </div>
          <div className="menu-brand-text">
            <h1>SyncroRed <span>EFE Sur</span></h1>
            <p>Control Operativo de Redes</p>
          </div>
        </div>

        <div className="menu-user">
          <div className="menu-user-info">
            <span className="menu-user-name">{user?.nombre} {user?.apellido}</span>
            <span className="menu-user-role">{rol}</span>
          </div>
          <div className="menu-user-avatar">{iniciales || <UserCheck size={18} />}</div>
          <button onClick={logout} className="menu-logout-btn" title="Cerrar sesión">
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* ===== Bienvenida ===== */}
      <div className="menu-welcome">
        <h2>Bienvenido, {user?.nombre}</h2>
        <p>Selecciona un módulo para comenzar tu jornada.</p>
      </div>

      {/* ===== Módulos ===== */}
      <div className="menu-grid">
        {/* GERENCIA — solo dashboard */}
        {esGerencia &&
          card('/dashboard', 'Dashboard Gerencial', 'Indicadores y métricas operacionales', <LayoutDashboard size={24} />, true)}

        {/* ADMIN */}
        {esAdmin &&
          card('/dashboard', 'Dashboard Gerencial', 'Indicadores y métricas operacionales', <LayoutDashboard size={24} />, true)}

        {/* JEFE SERVICIO */}
        {esJefeServicio && (
          <>
            {card('/jefe-servicio', 'Consola de Control de Tráfico', 'Monitoreo de servicios en tiempo real', <TrainFront size={24} />, true)}
            {card('/historicos', 'Históricos y Reportes', 'Consulta de registros y exportación', <BookOpen size={24} />)}
          </>
        )}

        {/* TRIPULACIÓN (maquinista / ayudante) */}
        {!esGerencia && !esJefeServicio && !esJefatura && !esAdmin && (
          <>
            {card('/bitacora',        'Servicios en curso',     'Bitácora operativa de tu turno',        <TrainFront size={24} />, true)}
            {card('/mapa-ferroviario','Mapa Ferroviario',        'Eventos y trazado de la red en vivo',   <Map size={24} />)}
            {card('/pauta-diaria',    'Pauta Diaria',            'Planificación y asignación del día',    <ClipboardList size={24} />)}
            {card('/asistencia',      'Asistencia',              'Apertura y cierre de tu turno',         <UserCheck size={24} />)}
            {card('/alistacion',      'Mi Alistación',           'Tus horas trabajadas y notificaciones',  <FileText size={24} />)}
            {card('/turnos',          'Gráfico Tripulación',     'Programación mensual de turnos',        <Users size={24} />)}
          </>
        )}

        {/* JEFATURA (IL, SL, JO) */}
        {esJefatura && !esJefeServicio && (
          <>
            {card('/pauta-diaria',     'Pauta Diaria',            'Planificación y asignación del día',        <ClipboardList size={24} />, true)}
            {card('/visor-bitacoras',  'Visor de Bitácoras',      'Reportes firmados de turno y auditoría',    <BookOpen size={24} />, true)}
            {card('/visor-bd',         'Base de Datos',           'Visor de datos del sistema',                <Database size={24} />, true)}
            {card('/personal-operativo','Personal Operativo',     'Directorio de tripulación',                 <Users size={24} />)}
            {card('/gestion-bajas',    'Gestión de Bajas',        'Licencias, permisos y ausencias',           <AlertTriangle size={24} />)}
            {card('/mapa-ferroviario', 'Mapa Ferroviario',        'Eventos y trazado de la red en vivo',       <Map size={24} />)}
          </>
        )}

        {/* ADMIN extras */}
        {esAdmin && (
          <>
            {card('/pauta-diaria',        'Pauta Diaria',            'Planificación y asignación del día',    <ClipboardList size={24} />)}
            {card('/visor-bitacoras',     'Visor de Bitácoras',      'Reportes firmados de turno y auditoría',<BookOpen size={24} />, true)}
            {card('/visor-bd',            'Base de Datos',           'Visor de datos del sistema',            <Database size={24} />, true)}
            {card('/personal-operativo',  'Personal Operativo',      'Directorio de tripulación',             <Users size={24} />)}
            {card('/gestion-bajas',       'Gestión de Bajas',        'Licencias, permisos y ausencias',       <AlertTriangle size={24} />)}
            {card('/georreferencia-admin','Georreferencia de Hitos', 'Administración de puntos geográficos',  <Map size={24} />)}
            {card('/carga-tripulacion',   'Cargar Tripulación CSV',  'Importación masiva de personal',        <Upload size={24} />, true)}
          </>
        )}
      </div>
    </div>
  );
}
