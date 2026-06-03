import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Radio, BookOpen, ClipboardList, TrainFront, Map, UserCheck,
  FileText, CalendarDays, Database, Users, UserMinus, TrainTrack, MapPin, Upload,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  desc: string;
  section: 'Gerencia' | 'Operaciones' | 'Administración' | 'Sistema';
  Icon: LucideIcon;
  primary?: boolean;
}

export const SECTION_ORDER: NavItem['section'][] = ['Gerencia', 'Operaciones', 'Administración', 'Sistema'];

/**
 * Fuente única de los módulos visibles por rol.
 * El sidebar y el menú principal se construyen a partir de esto, así siempre coinciden.
 */
export function getNavItems(cargo: string | undefined): NavItem[] {
  const rol = (cargo || '').toUpperCase();
  const esGerencia = rol === 'GERENTE' || rol === 'GERENCIA';
  const esAdmin = rol === 'ADMIN';
  const esJefeServicio = rol === 'JEFE SERVICIO' || rol === 'JEFE DE SERVICIO';
  const esJefeOperaciones = rol === 'JEFE DE OPERACIONES' || rol === 'JO';
  const esJefatura = rol === 'IL' || rol === 'INSPECTOR DE LINEA' || rol === 'SL' ||
    rol === 'SUPERVISOR DE LINEA' || esJefeOperaciones;
  const esTripulacion = rol === 'MAQUINISTA' || rol === 'AYUDANTE';

  const defs: (NavItem & { show: boolean })[] = [
    { to: '/dashboard', label: 'Dashboard Gerencial', desc: 'Indicadores y métricas operacionales', section: 'Gerencia', Icon: LayoutDashboard, primary: true, show: esGerencia || esAdmin || esJefeOperaciones },

    { to: '/jefe-servicio', label: 'Consola de Tráfico', desc: 'Monitoreo de servicios en tiempo real', section: 'Operaciones', Icon: Radio, primary: true, show: esJefeServicio || esAdmin },
    { to: '/historicos', label: 'Históricos', desc: 'Consulta de registros y exportación', section: 'Operaciones', Icon: BookOpen, show: esJefeServicio || esAdmin },
    { to: '/pauta-diaria', label: 'Pauta Diaria', desc: 'Planificación y asignación del día', section: 'Operaciones', Icon: ClipboardList, show: esTripulacion || esJefatura || esJefeServicio || esAdmin },
    { to: '/bitacora', label: 'Servicios en curso', desc: 'Bitácora operativa de turno', section: 'Operaciones', Icon: TrainFront, show: esTripulacion || esAdmin },
    { to: '/mapa-ferroviario', label: 'Mapa Ferroviario', desc: 'Eventos y trazado de la red en vivo', section: 'Operaciones', Icon: Map, show: esTripulacion || esJefatura || esJefeServicio || esGerencia || esAdmin },
    { to: '/asistencia', label: 'Asistencia', desc: 'Apertura y cierre de tu turno', section: 'Operaciones', Icon: UserCheck, show: esTripulacion || esAdmin },
    { to: '/alistacion', label: 'Mi Alistación', desc: 'Tus horas trabajadas y notificaciones', section: 'Operaciones', Icon: FileText, show: esTripulacion || esAdmin },
    { to: '/turnos', label: 'Gráfico Tripulación', desc: 'Programación mensual de turnos', section: 'Operaciones', Icon: CalendarDays, show: esTripulacion || esJefatura || esAdmin },

    { to: '/visor-bitacoras', label: 'Visor de Bitácoras', desc: 'Reportes firmados de turno y auditoría', section: 'Administración', Icon: BookOpen, show: esAdmin },
    { to: '/visor-bd', label: 'Base de Datos', desc: 'Visor de datos del sistema', section: 'Administración', Icon: Database, show: esJefatura || esAdmin },
    { to: '/personal-operativo', label: 'Personal Operativo', desc: 'Directorio de tripulación', section: 'Administración', Icon: Users, show: esJefatura || esGerencia || esAdmin },
    { to: '/gestion-bajas', label: 'Gestión de Bajas', desc: 'Licencias, permisos y ausencias', section: 'Administración', Icon: UserMinus, show: esJefatura || esAdmin },
    { to: '/prevenciones', label: 'Prevenciones de Vía', desc: 'Carga de boletines de faenas', section: 'Administración', Icon: TrainTrack, show: esJefatura || esAdmin },
  ];

  return defs.filter((d) => d.show).map(({ show: _show, ...rest }) => rest);
}
