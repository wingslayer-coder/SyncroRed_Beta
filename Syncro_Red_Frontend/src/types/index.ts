export interface User {
  rut: string;
  nombre: string;
  apellido: string;
  cargo: string;
  is_active: boolean;
  must_change_password?: boolean;
}

export interface PautaDiariaItem {
  turno: string;
  servicios: string;
  mq_nombre: string | null;
  mq_rut: string | null;
  ay_nombre: string | null;
  ay_rut: string | null;
  apertura_hora: string;
  apertura_lugar: string;
  presentacion_hora: string;
  presentacion_lugar: string;
  cierre_hora: string;
  cierre_lugar: string;
}

export interface DisponibleItem {
  rut: string;
  nombre: string;
  cargo: string;
}

export interface DashboardKPIs {
  fecha: string;
  servicios_hoy: number;
  servicios_mes: number;
  puntualidad_otp: number;
  atraso_promedio_min: number;
  emergencias_activas: number;
  incidencias_activas: number;
  fallas_pendientes: number;
  tripulacion_total: number;
  ausencias_hoy: number;
  reportes_hoy: number;
}

export interface EventoMapa {
  tipo: string;
  color: string;
  fecha_hora: string | null;
  fecha: string | null;
  tren: string;
  equipo: string;
  maquinista: string;
  ayudante: string;
  evento: string;
  detalle: string;
  ubicacion: string;
  lat: number | null;
  lon: number | null;
  estado: string;
}
