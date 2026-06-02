import { useState, useEffect } from 'react';
import client from '../api/client';
import { Calendar, RefreshCw } from 'lucide-react';

interface GraficoMensual {
  id?: number;
  fecha: string;
  rut: string | any;
  num_turno: string;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Turnos() {
  const [graficos, setGraficos] = useState<GraficoMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    cargarGraficos();
  }, [mes, anio]);

  const cargarGraficos = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/operaciones/grafico-mensual/`);
      const all: GraficoMensual[] = res.data.results || res.data;
      const filtrados = all.filter((g) => {
        const date = new Date(g.fecha);
        return date.getMonth() + 1 === mes && date.getFullYear() === anio;
      });
      setGraficos(filtrados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate();
  const diasMes = getDaysInMonth(mes, anio);
  const dias = Array.from({ length: diasMes }, (_, i) => i + 1);

  // Agrupar por rut
  const porUsuario: Record<string, { nombre: string; turnos: Record<number, string> }> = {};
  graficos.forEach((g) => {
    const r = typeof g.rut === 'object' ? g.rut.rut : g.rut;
    const nombre = typeof g.rut === 'object' ? `${g.rut.nombre} ${g.rut.apellido}` : r;

    if (!porUsuario[r]) {
      porUsuario[r] = { nombre, turnos: {} };
    }
    const day = parseInt(g.fecha.split('-')[2], 10);
    porUsuario[r].turnos[day] = g.num_turno;
  });

  const esFinDeSemana = (dia: number) => {
    const d = new Date(anio, mes - 1, dia).getDay();
    return d === 0 || d === 6;
  };

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <Calendar className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Gráfico Mensual de Turnos</h2>
            <p className="text-sm text-gray-400">Programación de tripulación por día</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
          >
            {MESES.map((nombre, i) => (
              <option key={i + 1} value={i + 1}>{nombre}</option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
          >
            {[2023, 2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={cargarGraficos}
            className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50"
            title="Recargar"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-400">Cargando turnos...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-azul">
                <th className="sticky left-0 z-10 w-48 border-b border-r border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide">
                  Trabajador
                </th>
                {dias.map((d) => (
                  <th
                    key={d}
                    className={`w-10 border-b border-r border-gray-200 px-2 py-2.5 text-center text-xs font-bold ${
                      esFinDeSemana(d) ? 'bg-rojo/5 text-rojo' : ''
                    }`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.keys(porUsuario).length === 0 ? (
                <tr>
                  <td colSpan={dias.length + 1} className="py-8 text-center text-gray-500">
                    No hay turnos asignados para {MESES[mes - 1]} {anio}.
                  </td>
                </tr>
              ) : (
                Object.keys(porUsuario).map((rut) => (
                  <tr key={rut} className="hover:bg-gray-50/70">
                    <td
                      className="sticky left-0 z-[1] w-48 truncate border-b border-r border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800"
                      title={porUsuario[rut].nombre}
                    >
                      {porUsuario[rut].nombre}
                    </td>
                    {dias.map((d) => {
                      const t = porUsuario[rut].turnos[d] || '';
                      return (
                        <td
                          key={d}
                          className={`border-b border-r border-gray-200 px-1 py-2 text-center ${
                            esFinDeSemana(d) ? 'bg-rojo/[0.03]' : ''
                          }`}
                        >
                          {t ? (
                            <span className="inline-flex min-w-[26px] items-center justify-center rounded-md bg-azul/10 px-1.5 py-0.5 text-xs font-bold text-azul">
                              {t}
                            </span>
                          ) : (
                            <span className="text-gray-200">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
