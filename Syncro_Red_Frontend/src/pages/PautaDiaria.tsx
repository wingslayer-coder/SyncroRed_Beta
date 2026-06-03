import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { PautaDiariaItem, DisponibleItem } from '../types';
import './PautaDiaria.css';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  X,
  Clock,
  Info,
  TrendingUp,
  UserCheck,
  UserX,
  Loader2,
  ArrowLeft,
  Train,
  AlertCircle,
  Moon,
} from 'lucide-react';

interface DescansoItem {
  nombre: string;
  rut: string;
  cargo: string;
}

interface MiTurno {
  turno: string;
  tipo_dia: string;
  servicios: string;
  presentacion_hora: string;
  presentacion_lugar: string;
  cierre_hora: string;
  cierre_lugar: string;
}

export default function PautaDiaria() {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [turnos, setTurnos] = useState<PautaDiariaItem[]>([]);
  const [descansos, setDescansos] = useState<DescansoItem[]>([]);
  const [tipoDia, setTipoDia] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ turno: string; campo: 'mq' | 'ay' } | null>(null);
  const [disponibles, setDisponibles] = useState<DisponibleItem[]>([]);
  const [miTurno, setMiTurno] = useState<MiTurno | null>(null);
  const [miTurnoLoading, setMiTurnoLoading] = useState(false);

  const esTripulacion = ['MAQUINISTA', 'AYUDANTE'].includes((user?.cargo || '').toUpperCase());
  const cargo = (user?.cargo || '').toUpperCase();
  const puedeAsignar = ['IL', 'INSPECTOR DE LINEA', 'SL', 'SUPERVISOR DE LINEA',
    'JEFE DE OPERACIONES', 'ADMIN', 'GERENTE', 'GERENCIA'].includes(cargo);

  const fetchPauta = () => {
    setLoading(true);
    client.get(`/operaciones/pauta-diaria/?fecha=${fecha}`)
      .then((res) => {
        setTurnos(res.data.turnos);
        setDescansos(res.data.descansos || []);
        setTipoDia(res.data.tipo_dia);
      })
      .catch(() => {
        setTurnos([]);
        setDescansos([]);
        setTipoDia('');
      })
      .finally(() => setLoading(false));
  };

  const fetchMiTurno = () => {
    if (!esTripulacion) return;
    setMiTurnoLoading(true);
    client.get(`/operaciones/mi-turno/?fecha=${fecha}`)
      .then((res) => setMiTurno(res.data.turno ? res.data : null))
      .catch(() => setMiTurno(null))
      .finally(() => setMiTurnoLoading(false));
  };

  useEffect(() => {
    fetchPauta();
    fetchMiTurno();
  }, [fecha]);

  const openModal = (turno: string, campo: 'mq' | 'ay') => {
    setModal({ turno, campo });
    const cargo = campo === 'mq' ? 'MAQUINISTA' : 'AYUDANTE';
    client.get(`/operaciones/tripulacion-disponible/?fecha=${fecha}&cargo=${cargo}`)
      .then((res) => setDisponibles(res.data.disponibles))
      .catch(() => setDisponibles([]));
  };

  const assignTripulacion = async (rut: string) => {
    if (!modal) return;
    try {
      await client.post('/operaciones/pauta-diaria/', {
        fecha,
        rut,
        num_turno: modal.turno,
      });
      setModal(null);
      fetchPauta();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al asignar');
    }
  };

  const cambiarFecha = (dias: number) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    setFecha(d.toISOString().split('T')[0]);
  };

  // Helper to format date in Spanish
  const obtenerFechaFormateada = (fechaStr: string) => {
    try {
      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      };
      return new Date(fechaStr).toLocaleDateString('es-CL', opciones);
    } catch {
      return fechaStr;
    }
  };

  // Helper to get initials
  const obtenerIniciales = (nombreCompleto: string) => {
    if (!nombreCompleto) return '—';
    const partes = nombreCompleto.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0][0].toUpperCase();
  };

  // Compute quick metrics
  const totalTurnos = turnos.length;
  const maqAsignados = turnos.filter(t => t.mq_nombre).length;
  const ayAsignados = turnos.filter(t => t.ay_nombre).length;
  const totalAsignacionesPosibles = totalTurnos * 2;
  const totalAsignados = maqAsignados + ayAsignados;
  const pendientes = totalAsignacionesPosibles - totalAsignados;

  return (
    <div className="pauta-container">
      {/* Back to Menu Link */}
      <div className="flex justify-start mb-4">
        <Link
          to="/menu"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-azul bg-azul/5 hover:text-rojo hover:bg-rojo/5 transition-all shadow-sm border border-azul/5"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú Principal
        </Link>
      </div>

      {/* HEADER SECTION */}
      <div className="pauta-header">
        <h2>Pauta Diaria Operativa</h2>
        <p className="capitalize">
          {obtenerFechaFormateada(fecha)}
        </p>
      </div>

      {/* BANNER MI TURNO — solo para maquinistas y ayudantes */}
      {esTripulacion && (
        <div className="mb-6">
          {miTurnoLoading ? (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
              <Loader2 className="w-5 h-5 text-azul animate-spin" />
              <span className="text-sm text-gray-500 font-medium">Consultando tu turno...</span>
            </div>
          ) : miTurno ? (
            <div className="bg-gradient-to-r from-azul via-azul to-[#003a8c] rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icono + título */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                    <Train className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Tu turno hoy</p>
                    <p className="text-white text-2xl font-black leading-tight">Turno {miTurno.turno}</p>
                  </div>
                </div>

                <div className="h-px sm:h-10 sm:w-px bg-white/20 flex-shrink-0" />

                {/* Servicios */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Servicios asignados</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(miTurno.servicios || '').split(/[\s,;]+/).filter(Boolean).map((srv, i) => (
                      <span key={i} className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-white/20 text-white border border-white/10">
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="h-px sm:h-10 sm:w-px bg-white/20 flex-shrink-0" />

                {/* Presentación */}
                <div className="flex-shrink-0 text-sm">
                  <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    <Clock className="h-3.5 w-3.5" /> Presentación
                  </div>
                  <p className="text-white font-bold">{miTurno.presentacion_hora}</p>
                  <p className="text-white/60 text-xs">{miTurno.presentacion_lugar}</p>
                </div>

                <div className="h-px sm:h-10 sm:w-px bg-white/20 flex-shrink-0" />

                {/* Cierre */}
                <div className="flex-shrink-0 text-sm">
                  <div className="flex items-center gap-1.5 text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    <Clock className="h-3.5 w-3.5" /> Cierre
                  </div>
                  <p className="text-white font-bold">{miTurno.cierre_hora}</p>
                  <p className="text-white/60 text-xs">{miTurno.cierre_lugar}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Sin turno asignado para esta fecha</p>
                <p className="text-xs text-amber-600">Contacta a tu jefatura si crees que hay un error.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date controller centered */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-azul transition-all active:scale-95"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-azul" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-azul cursor-pointer"
            />
          </div>
          <button
            onClick={() => cambiarFecha(1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-azul transition-all active:scale-95"
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tipo de día */}
        <div className="bg-gradient-to-r from-azul to-[#003380] text-white p-5 rounded-2xl shadow-sm border border-azul/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-white/70 font-semibold tracking-wider uppercase">Tipo de Jornada</span>
            <h3 className="text-lg font-bold mt-1 tracking-tight truncate max-w-[200px]">
              {tipoDia || 'Sin registro'}
            </h3>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-rojo" />
          </div>
        </div>

        {/* Card 2: Total turnos */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Total Turnos</span>
            <h3 className="text-2xl font-black text-azul mt-1">{totalTurnos}</h3>
          </div>
          <div className="p-3 bg-azul/5 rounded-xl">
            <Clock className="w-6 h-6 text-azul" />
          </div>
        </div>

        {/* Card 3: Asignaciones realizadas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Asignados</span>
            <h3 className="text-2xl font-black text-green-600 mt-1">
              {totalAsignados} <span className="text-xs text-gray-400 font-medium">/ {totalAsignacionesPosibles}</span>
            </h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Card 4: Pendientes */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Faltantes</span>
            <h3 className="text-2xl font-black text-amber-500 mt-1">{pendientes}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <UserX className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* PAUTA TABLE SECTION */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl shadow-sm border border-gray-100 gap-4">
          <Loader2 className="w-10 h-10 text-rojo animate-spin" />
          <span className="text-sm font-semibold text-azul">Cargando pauta operativa...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
          <div>
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col style={{width:'6%'}} />
                <col style={{width:'20%'}} />
                <col style={{width:'20%'}} />
                <col style={{width:'18%'}} />
                <col style={{width:'12%'}} />
                <col style={{width:'12%'}} />
                <col style={{width:'12%'}} />
              </colgroup>
              <thead>
                <tr className="bg-azul text-white border-b border-azul/20">
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Turno</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Maquinista</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Ayudante</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Servicios</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Apertura EZ</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Presentación</th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-center">Cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Info className="w-8 h-8 text-gray-300" />
                        <span className="text-gray-400 font-medium text-sm">Sin turnos registrados para esta fecha en PostgreSQL</span>
                      </div>
                    </td>
                  </tr>
                )}
                {turnos.map((t) => (
                  <tr
                    key={t.turno}
                    className={`transition-colors ${
                      miTurno && t.turno === miTurno.turno
                        ? 'bg-azul/5 border-l-4 border-l-azul'
                        : 'hover:bg-gray-50/70'
                    }`}
                  >
                    {/* Turno Badge */}
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-azul/10 text-azul border border-azul/5">
                        {t.turno}
                      </span>
                    </td>

                    {/* Maquinista Cell */}
                    <td className="px-3 py-3 text-center">
                      {t.mq_nombre ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-7 h-7 rounded-full bg-azul text-white flex items-center justify-center font-bold text-[10px] shadow-sm flex-shrink-0">
                            {obtenerIniciales(t.mq_nombre)}
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-gray-800 leading-tight truncate">{t.mq_nombre}</div>
                            <div className="text-[10px] text-gray-400">{t.mq_rut || '—'}</div>
                          </div>
                        </div>
                      ) : t.mq_ausente ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-400 line-through">{t.mq_ausente.nombre}</span>
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">{t.mq_ausente.tipo}</span>
                          {puedeAsignar && (
                            <button onClick={() => openModal(t.turno, 'mq')} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-rojo/40 text-[10px] font-bold text-rojo hover:bg-rojo/5">
                              <UserPlus className="w-3 h-3" /> Reemplazar
                            </button>
                          )}
                        </div>
                      ) : puedeAsignar ? (
                        <div className="flex justify-center">
                          <button
                            onClick={() => openModal(t.turno, 'mq')}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-azul/30 hover:border-rojo text-[10px] font-bold text-azul hover:text-rojo hover:bg-rojo/5 transition-all"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Asignar</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>

                    {/* Ayudante Cell */}
                    <td className="px-3 py-3 text-center">
                      {t.ay_nombre ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-7 h-7 rounded-full bg-rojo text-white flex items-center justify-center font-bold text-[10px] shadow-sm flex-shrink-0">
                            {obtenerIniciales(t.ay_nombre)}
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-gray-800 leading-tight truncate">{t.ay_nombre}</div>
                            <div className="text-[10px] text-gray-400">{t.ay_rut || '—'}</div>
                          </div>
                        </div>
                      ) : t.ay_ausente ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-400 line-through">{t.ay_ausente.nombre}</span>
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">{t.ay_ausente.tipo}</span>
                          {puedeAsignar && (
                            <button onClick={() => openModal(t.turno, 'ay')} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-rojo/40 text-[10px] font-bold text-rojo hover:bg-rojo/5">
                              <UserPlus className="w-3 h-3" /> Reemplazar
                            </button>
                          )}
                        </div>
                      ) : puedeAsignar ? (
                        <div className="flex justify-center">
                          <button
                            onClick={() => openModal(t.turno, 'ay')}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-azul/30 hover:border-rojo text-[10px] font-bold text-azul hover:text-rojo hover:bg-rojo/5 transition-all"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Asignar</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>

                    {/* Services Chips */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(t.servicios || '').split(/[\s,;]+/).filter(Boolean).map((srv, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-azul/10 text-azul border border-azul/15 whitespace-nowrap"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Apertura Cell */}
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col gap-0.5 items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-bold text-azul">
                          <Clock className="w-3 h-3" />
                          <span>{t.apertura_hora || '—'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium">{t.apertura_lugar || '—'}</div>
                      </div>
                    </td>

                    {/* Presentacion Cell */}
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col gap-0.5 items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <Clock className="w-3 h-3 text-rojo" />
                          <span>{t.presentacion_hora || '—'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium">{t.presentacion_lugar || '—'}</div>
                      </div>
                    </td>

                    {/* Cierre Cell */}
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col gap-0.5 items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <Clock className="w-3 h-3 text-rojo" />
                          <span>{t.cierre_hora || '—'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium">{t.cierre_lugar || '—'}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EN DESCANSO — tripulación que descansa este día */}
      {!loading && descansos.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-100 to-white px-5 py-3 border-b border-gray-100">
            <Moon className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">En Descanso</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{descansos.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-gray-50 sm:divide-y-0">
            {descansos.map((d) => {
              const esMq = (d.cargo || '').toUpperCase().includes('MAQUINISTA');
              return (
                <div key={d.rut} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-sm flex-shrink-0 ${esMq ? 'bg-azul' : 'bg-rojo'}`}>
                    {obtenerIniciales(d.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-gray-800 leading-tight truncate">{d.nombre}</div>
                    <div className="text-[10px] text-gray-400">{d.rut}</div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${esMq ? 'bg-azul/10 text-azul' : 'bg-rojo/10 text-rojo'}`}>
                    {esMq ? 'MQ' : 'AY'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[85vh] flex flex-col border border-gray-100 overflow-hidden transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-azul">
                  Asignar {modal.campo === 'mq' ? 'Maquinista' : 'Ayudante'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Turno: {modal.turno} | Fecha: {fecha}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {disponibles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <UserX className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-400 font-semibold text-center">
                    No hay {modal.campo === 'mq' ? 'maquinistas' : 'ayudantes'} disponibles para hoy
                  </p>
                </div>
              )}
              {disponibles.map((d) => (
                <button
                  key={d.rut}
                  onClick={() => assignTripulacion(d.rut)}
                  className="w-full flex items-center justify-between p-3.5 border border-gray-150 rounded-xl hover:border-rojo hover:bg-rojo/5 transition-all text-left group hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-azul text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-rojo transition-all">
                      {obtenerIniciales(d.nombre)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-azul group-hover:text-rojo transition-all leading-tight">
                        {d.nombre}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">RUT: {d.rut}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-all ${
                    (d.estado || '').includes('Recibidor') ? 'text-verde' : 'text-gray-400 group-hover:text-rojo/70'
                  }`}>
                    {d.estado || 'Disponible'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
