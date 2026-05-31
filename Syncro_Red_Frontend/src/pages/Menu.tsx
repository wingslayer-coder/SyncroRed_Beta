import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export default function Menu() {
  const { user } = useAuth();
  const rol = (user?.cargo || '').toUpperCase();
  const esGerencia = rol === 'GERENTE' || rol === 'GERENCIA';
  const esAdmin = rol === 'ADMIN';
  const esJefeServicio = rol === 'JEFE SERVICIO' || rol === 'JEFE DE SERVICIO';
  const esJefatura = esAdmin || rol === 'IL' || rol === 'INSPECTOR DE LINEA' || rol === 'JEFE DE OPERACIONES' || rol === 'SL' || rol === 'SUPERVISOR DE LINEA';

  const btn = (to: string, label: string, icon: React.ReactNode, primary = false) => (
    <Link
      key={to}
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
        primary
          ? 'bg-azul text-white hover:bg-azul-2 shadow-md'
          : 'bg-white text-azul border border-gray-200 hover:border-azul-2 hover:shadow-sm'
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-azul">SyncroRed EFE Sur</h2>
        <p className="text-gray-500">
          Bienvenido: {user?.nombre} {user?.apellido} | {rol}
        </p>
      </div>

      <div className="space-y-3">
        {(esGerencia || esAdmin) && btn('/dashboard', 'Dashboard Gerencial', <LayoutDashboard className="w-5 h-5" />, true)}

        {btn('/pauta-diaria', 'Pauta Diaria', <ClipboardList className="w-5 h-5" />, esJefatura && !esJefeServicio)}

        {!esGerencia && (
          <>
            {esJefeServicio ? (
              <>
                {btn('/jefe-servicio', 'Consola de Control de Tráfico', <TrainFront className="w-5 h-5" />, true)}
                {btn('/historicos', 'Históricos y Reportes', <BookOpen className="w-5 h-5" />)}
              </>
            ) : (
              <>
                {btn('/bitacora', 'Servicios en curso', <TrainFront className="w-5 h-5" />, true)}
                {btn('/mapa-ferroviario', 'Mapa Ferroviario', <Map className="w-5 h-5" />)}
                {btn('/asistencia', 'Asistencia y alistación', <UserCheck className="w-5 h-5" />, !esAdmin)}
                {btn('/turnos', 'Gráfico Tripulación', <Users className="w-5 h-5" />)}
              </>
            )}
          </>
        )}

        {esJefatura && !esJefeServicio && (
          <>
            {btn('/visor-bd', 'Base de Datos', <Database className="w-5 h-5" />, true)}
            {btn('/personal-operativo', 'Personal Operativo', <Users className="w-5 h-5" />)}
            {btn('/gestion-bajas', 'Gestión de Bajas', <AlertTriangle className="w-5 h-5" />)}
          </>
        )}

        {esAdmin && (
          <>
            {btn('/georreferencia-admin', 'Georreferencia de Hitos', <Map className="w-5 h-5" />)}
            {btn('/carga-tripulacion', 'Cargar Tripulación CSV', <Upload className="w-5 h-5" />, true)}
          </>
        )}
      </div>
    </div>
  );
}
