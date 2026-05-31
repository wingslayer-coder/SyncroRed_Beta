import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import type { PautaDiariaItem, DisponibleItem } from '../types';
import './PautaDiaria.css';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  X,
  Clock,
  MapPin,
  
  Info,
  TrendingUp,
  UserCheck,
  UserX,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

export default function PautaDiaria() {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [turnos, setTurnos] = useState<PautaDiariaItem[]>([]);
  const [tipoDia, setTipoDia] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ turno: string; campo: 'mq' | 'ay' } | null>(null);
  const [disponibles, setDisponibles] = useState<DisponibleItem[]>([]);

  const fetchPauta = () => {
    setLoading(true);
    client.get(`/operaciones/pauta-diaria/?fecha=${fecha}`)
      .then((res) => {
        setTurnos(res.data.turnos);
        setTipoDia(res.data.tipo_dia);
      })
      .catch(() => {
        setTurnos([]);
        setTipoDia('');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPauta();
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-azul text-white border-b border-azul/20">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Turno</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Servicios (Trenes)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Maquinista (MQ)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Ayudante (AY)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Lugar & Hora Presentación</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Lugar & Hora Cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Info className="w-8 h-8 text-gray-300" />
                        <span className="text-gray-400 font-medium text-sm">Sin turnos registrados para esta fecha en PostgreSQL</span>
                      </div>
                    </td>
                  </tr>
                )}
                {turnos.map((t) => (
                  <tr key={t.turno} className="hover:bg-gray-50/70 transition-colors">
                    {/* Turno Badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-azul/10 text-azul border border-azul/5">
                        {t.turno}
                      </span>
                    </td>

                    {/* Services Chips */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[220px] mx-auto">
                        {(t.servicios || '').split(/[\s,;]+/).filter(Boolean).map((srv, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Maquinista Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {t.mq_nombre ? (
                        <div className="flex items-center gap-2.5 justify-center">
                          <div className="w-8 h-8 rounded-full bg-azul text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {obtenerIniciales(t.mq_nombre)}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-gray-800 leading-tight">{t.mq_nombre}</div>
                            <div className="text-[10px] text-gray-400">RUT: {t.mq_rut || '—'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <button
                            onClick={() => openModal(t.turno, 'mq')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-azul/30 hover:border-rojo text-xs font-bold text-azul hover:text-rojo hover:bg-rojo/5 transition-all shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Asignar MQ</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Ayudante Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {t.ay_nombre ? (
                        <div className="flex items-center gap-2.5 justify-center">
                          <div className="w-8 h-8 rounded-full bg-rojo text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {obtenerIniciales(t.ay_nombre)}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-bold text-gray-800 leading-tight">{t.ay_nombre}</div>
                            <div className="text-[10px] text-gray-400">RUT: {t.ay_rut || '—'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <button
                            onClick={() => openModal(t.turno, 'ay')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-azul/30 hover:border-rojo text-xs font-bold text-azul hover:text-rojo hover:bg-rojo/5 transition-all shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Asignar AY</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Presentacion Cell */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-0.5 items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-rojo" />
                          <span>{t.presentacion_hora || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{t.presentacion_lugar || '—'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cierre Cell */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-0.5 items-center justify-center">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-rojo" />
                          <span>{t.cierre_hora || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{t.cierre_lugar || '—'}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-rojo/70 transition-all">
                    Disponible
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
