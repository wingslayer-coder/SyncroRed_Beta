import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, Bell, FileText, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface MiRegistro {
  id: number;
  fecha: string;
  lugar_apertura: string;
  hora_apertura: string;
  inicio_servicio: string;
  hora_cierre: string;
  fecha_cierre: string | null;
  horas_extras: number;
  horas_manejo: number;
  horas_nocturnas: number;
  horas_menos_reposo: number;
  estado: string;
  observacion_il: string;
  modificado_por: string | null;
  fecha_modificacion: string | null;
}

interface Notificacion {
  id: number;
  tipo: 'modificacion_horas' | 'autorizacion' | 'rechazo';
  mensaje: string;
  fecha: string;
  leida: boolean;
  datos: {
    horas_extras_anterior?: number;
    horas_extras_nueva?: number;
    horas_manejo_anterior?: number;
    horas_manejo_nueva?: number;
    modificado_por?: string;
    fecha_modificacion?: string;
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Alistacion() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<MiRegistro[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState((new Date().getMonth() + 1).toString());
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString());
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  // Calcular fechas
  const fechaDesde = `${filtroAnio}-${filtroMes.padStart(2, '0')}-01`;
  const fechaHasta = `${filtroAnio}-${filtroMes.padStart(2, '0')}-${new Date(parseInt(filtroAnio), parseInt(filtroMes), 0).getDate()}`;

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('desde', fechaDesde);
      params.set('hasta', fechaHasta);
      
      // Obtener mis registros de asistencia
      const r = await client.get(`/usuarios/asistencia/mi-historial/?${params}`);
      setRegistros(r.data);
      
      // Obtener notificaciones
      const n = await client.get('/usuarios/asistencia/notificaciones/');
      setNotificaciones(n.data);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // Polling cada 30 segundos para verificar nuevas notificaciones
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [filtroMes, filtroAnio]);

  const marcarNotificacionLeida = async (id: number) => {
    try {
      await client.post(`/usuarios/asistencia/notificaciones/${id}/leer/`);
      setNotificaciones(prev => prev.map(n => n.id === id ? {...n, leida: true} : n));
    } catch (e) {
      console.error('Error marcando notificación:', e);
    }
  };

  // Calcular totales
  const totales = registros.reduce((acc, r) => ({
    horas_extras: acc.horas_extras + (r.horas_extras || 0),
    horas_manejo: acc.horas_manejo + (r.horas_manejo || 0),
    horas_nocturnas: acc.horas_nocturnas + (r.horas_nocturnas || 0),
    horas_menos_reposo: acc.horas_menos_reposo + (r.horas_menos_reposo || 0),
  }), {
    horas_extras: 0, horas_manejo: 0, horas_nocturnas: 0, horas_menos_reposo: 0,
  });

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-azul to-azul/80 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Mi Alistación
              </h1>
              <p className="text-white/80 mt-1">{user?.nombre} {user?.apellido} · {user?.cargo}</p>
            </div>
            
            {/* Botón de notificaciones */}
            <button 
              onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
              className="relative bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all"
            >
              <Bell className="h-6 w-6" />
              {notificacionesNoLeidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-rojo text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {notificacionesNoLeidas}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Panel de Notificaciones */}
        {mostrarNotificaciones && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-azul text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notificaciones
              </h3>
              <button onClick={() => setMostrarNotificaciones(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  No tienes notificaciones pendientes
                </div>
              ) : (
                notificaciones.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-gray-100 ${n.leida ? 'bg-gray-50' : 'bg-amber-50 border-l-4 border-l-amber-400'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${n.leida ? 'text-gray-400' : 'text-amber-500'}`}>
                        {n.tipo === 'modificacion_horas' ? <AlertCircle className="h-5 w-5" /> : 
                         n.tipo === 'autorizacion' ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${n.leida ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                          {n.mensaje}
                        </p>
                        {n.datos?.modificado_por && (
                          <p className="text-xs text-gray-500 mt-1">
                            Modificado por: {n.datos.modificado_por} · {new Date(n.fecha).toLocaleString()}
                          </p>
                        )}
                        {!n.leida && (
                          <button 
                            onClick={() => marcarNotificacionLeida(n.id)}
                            className="text-xs text-azul font-bold mt-2 hover:underline"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end justify-center">
          <div className="flex gap-3 items-end bg-azul/5 rounded-lg p-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-azul">📅 Mes</label>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30 w-36 bg-white">
                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                  <option key={i} value={(i + 1).toString()}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-azul">Año</label>
              <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
                className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30 w-24 bg-white">
                {[2024, 2025, 2026, 2027, 2028].map(a => (
                  <option key={a} value={a.toString()}>{a}</option>
                ))}
              </select>
            </div>
            <button onClick={cargarDatos}
              className="rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all">
              🔍 Buscar
            </button>
          </div>
        </div>

        {/* Totales */}
        {registros.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-azul/20 p-4 mb-6">
            <h4 className="text-sm font-bold text-azul mb-3">
              📊 Mis Totales del período ({registros.length} días trabajados)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                <div className="text-amber-600 font-bold text-xs uppercase">H.Extras Total</div>
                <div className="font-bold text-rojo text-xl">{totales.horas_extras.toFixed(1)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                <div className="text-blue-600 font-bold text-xs uppercase">H.Manejo</div>
                <div className="font-bold text-azul text-xl">{totales.horas_manejo.toFixed(1)}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
                <div className="text-indigo-600 font-bold text-xs uppercase">H.Nocturnas</div>
                <div className="font-bold text-indigo-600 text-xl">{totales.horas_nocturnas.toFixed(1)}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                <div className="text-red-600 font-bold text-xs uppercase">H.Menos Reposo</div>
                <div className="font-bold text-rojo text-xl">{totales.horas_menos_reposo.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Registros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-azul" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-azul text-white">
                    <th className="px-3 py-3 text-left font-bold text-xs">Fecha</th>
                    <th className="px-3 py-3 text-left font-bold text-xs">Lugar</th>
                    <th className="px-3 py-3 text-left font-bold text-xs">Apertura EZ</th>
                    <th className="px-3 py-3 text-left font-bold text-xs">Presentación</th>
                    <th className="px-3 py-3 text-left font-bold text-xs">Cierre</th>
                    <th className="px-3 py-3 text-center font-bold text-xs bg-amber-500/30">Extras</th>
                    <th className="px-3 py-3 text-center font-bold text-xs bg-blue-500/30">Manejo</th>
                    <th className="px-3 py-3 text-center font-bold text-xs bg-indigo-500/30">Noct.</th>
                    <th className="px-3 py-3 text-center font-bold text-xs bg-red-500/30">Reposo</th>
                    <th className="px-3 py-3 text-left font-bold text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registros.length === 0 ? (
                    <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      No tienes registros para este período
                    </td></tr>
                  ) : (
                    registros.map(r => (
                      <tr key={r.id} className={`hover:bg-gray-50 ${r.modificado_por ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          <div className="font-medium">{r.fecha}</div>
                          {r.modificado_por && (
                            <div className="text-amber-600 text-[10px] flex items-center gap-1 mt-0.5">
                              <AlertCircle className="h-3 w-3" /> Modificado
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.lugar_apertura}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.hora_apertura}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.inicio_servicio}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {r.fecha_cierre ? `${r.fecha_cierre} ` : ''}{r.hora_cierre || '—'}
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-rojo text-center">{r.horas_extras?.toFixed(1) || '0.0'}</td>
                        <td className="px-3 py-2 text-xs font-bold text-azul text-center">{r.horas_manejo?.toFixed(1) || '0.0'}</td>
                        <td className="px-3 py-2 text-xs font-bold text-indigo-600 text-center">{r.horas_nocturnas?.toFixed(1) || '0.0'}</td>
                        <td className="px-3 py-2 text-xs font-bold text-rojo text-center">{r.horas_menos_reposo?.toFixed(1) || '0.0'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.estado === 'CONFIRMADO' ? 'bg-green-100 text-green-700' :
                            r.estado === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                            r.estado === 'PENDIENTE_AUTORIZACION' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {r.estado?.replace('_', ' ') || 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded"></div>
            <span>Registro modificado por IL/Jefatura</span>
          </div>
          <div className="flex items-center gap-1">
            <Bell className="h-3 w-3 text-rojo" />
            <span>Recibirás notificación cuando modifiquen tus horas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
