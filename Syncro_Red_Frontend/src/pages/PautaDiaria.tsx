import { useEffect, useState } from 'react';
import client from '../api/client';
import type { PautaDiariaItem, DisponibleItem } from '../types';
import { Calendar, ChevronLeft, ChevronRight, UserPlus, X } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-azul">Pauta Diaria</h2>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <button onClick={() => cambiarFecha(-1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Calendar className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border-none outline-none text-sm"
          />
          <button onClick={() => cambiarFecha(1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Tipo de día: <span className="font-semibold text-azul">{tipoDia || '—'}</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-azul text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Turno</th>
                <th className="px-4 py-3 text-left font-semibold">Servicios</th>
                <th className="px-4 py-3 text-left font-semibold">Maquinista</th>
                <th className="px-4 py-3 text-left font-semibold">Ayudante</th>
                <th className="px-4 py-3 text-left font-semibold">Presentación</th>
                <th className="px-4 py-3 text-left font-semibold">Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {turnos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Sin turnos registrados para esta fecha
                  </td>
                </tr>
              )}
              {turnos.map((t) => (
                <tr key={t.turno} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-azul">{t.turno}</td>
                  <td className="px-4 py-3 text-gray-600">{t.servicios}</td>
                  <td className="px-4 py-3">
                    {t.mq_nombre ? (
                      <span className="text-gray-800">{t.mq_nombre}</span>
                    ) : (
                      <button
                        onClick={() => openModal(t.turno, 'mq')}
                        className="flex items-center gap-1 text-xs text-azul-2 hover:underline"
                      >
                        <UserPlus className="w-3 h-3" /> Asignar MQ
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.ay_nombre ? (
                      <span className="text-gray-800">{t.ay_nombre}</span>
                    ) : (
                      <button
                        onClick={() => openModal(t.turno, 'ay')}
                        className="flex items-center gap-1 text-xs text-azul-2 hover:underline"
                      >
                        <UserPlus className="w-3 h-3" /> Asignar AY
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {t.presentacion_hora} — {t.presentacion_lugar}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {t.cierre_hora} — {t.cierre_lugar}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-azul">
                Asignar {modal.campo === 'mq' ? 'Maquinista' : 'Ayudante'} — Turno {modal.turno}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              {disponibles.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay {modal.campo === 'mq' ? 'maquinistas' : 'ayudantes'} disponibles
                </p>
              )}
              {disponibles.map((d) => (
                <button
                  key={d.rut}
                  onClick={() => assignTripulacion(d.rut)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-azul-2 hover:bg-azul-2/5 transition-colors text-left"
                >
                  <div>
                    <div className="font-semibold text-sm text-azul">{d.nombre}</div>
                    <div className="text-xs text-gray-500">{d.rut}</div>
                  </div>
                  <div className="text-xs text-gray-400">{d.cargo}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
