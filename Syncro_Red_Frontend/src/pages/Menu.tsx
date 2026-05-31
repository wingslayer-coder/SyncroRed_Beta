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
} from 'lucide-react';

export default function Menu() {
  const { user, logout } = useAuth();
  const rol = (user?.cargo || '').toUpperCase();
  const esGerencia = rol === 'GERENTE' || rol === 'GERENCIA';
  const esAdmin = rol === 'ADMIN';
  const esJefeServicio = rol === 'JEFE SERVICIO' || rol === 'JEFE DE SERVICIO';
  const esJefatura = esAdmin || rol === 'IL' || rol === 'INSPECTOR DE LINEA' || rol === 'JEFE DE OPERACIONES' || rol === 'SL' || rol === 'SUPERVISOR DE LINEA';

  const card = (to: string, label: string, icon: React.ReactNode, primary = false) => (
    <Link
      key={to}
      to={to}
      className={`menu-card ${primary ? 'primary' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h2>SyncroRed EFE Sur</h2>
        <p>
          Bienvenido: {user?.nombre} {user?.apellido} | {rol}
        </p>
      </div>

      <div className="menu-grid">
        {(esGerencia || esAdmin) && card('/dashboard', 'Dashboard Gerencial', <LayoutDashboard size={40} />, true)}

        {card('/pauta-diaria', 'Pauta Diaria', <ClipboardList size={40} />, esJefatura && !esJefeServicio)}

        {!esGerencia && (
          <>
            {esJefeServicio ? (
              <>
                {card('/jefe-servicio', 'Consola de Control de Tráfico', <TrainFront size={40} />, true)}
                {card('/historicos', 'Históricos y Reportes', <BookOpen size={40} />)}
              </>
            ) : (
              <>
                {card('/bitacora', 'Servicios en curso', <TrainFront size={40} />, true)}
                {card('/mapa-ferroviario', 'Mapa Ferroviario', <Map size={40} />)}
                {card('/asistencia', 'Asistencia y alistación', <UserCheck size={40} />, !esAdmin)}
                {card('/turnos', 'Gráfico Tripulación', <Users size={40} />)}
              </>
            )}
          </>
        )}

        {esJefatura && !esJefeServicio && (
          <>
            {card('/visor-bd', 'Base de Datos', <Database size={40} />, true)}
            {card('/personal-operativo', 'Personal Operativo', <Users size={40} />)}
            {card('/gestion-bajas', 'Gestión de Bajas', <AlertTriangle size={40} />)}
          </>
        )}

        {esAdmin && (
          <>
            {card('/georreferencia-admin', 'Georreferencia de Hitos', <Map size={40} />)}
            {card('/carga-tripulacion', 'Cargar Tripulación CSV', <Upload size={40} />, true)}
          </>
        )}
      </div>

      <button onClick={logout} className="menu-logout-btn">
        <LogOut size={18} />
        Cerrar Sesión
      </button>
    </div>
  );
}
