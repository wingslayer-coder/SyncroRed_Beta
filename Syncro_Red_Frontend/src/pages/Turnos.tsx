import { useState, useEffect } from 'react';
import client from '../api/client';
import { Calendar,  RefreshCw } from 'lucide-react';

interface GraficoMensual {
  id?: number;
  fecha: string;
  rut: string | any;
  num_turno: string;
}

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
      const filtrados = all.filter(g => {
        const date = new Date(g.fecha);
        return (date.getMonth() + 1) === mes && date.getFullYear() === anio;
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
  const porUsuario: Record<string, { nombre: string, turnos: Record<number, string> }> = {};
  graficos.forEach(g => {
    const r = typeof g.rut === 'object' ? g.rut.rut : g.rut;
    const nombre = typeof g.rut === 'object' ? `${g.rut.nombre} ${g.rut.apellido}` : r;
    
    if (!porUsuario[r]) {
      porUsuario[r] = { nombre, turnos: {} };
    }
    const day = parseInt(g.fecha.split('-')[2], 10);
    porUsuario[r].turnos[day] = g.num_turno;
  });

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <Calendar className="w-6 h-6 text-rojo" />
          Gráfico Mensual de Turnos
        </h2>
        <div className="flex gap-4 items-center">
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="p-2 border rounded">
            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Mes {i+1}</option>)}
          </select>
          <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} className="p-2 border rounded">
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={cargarGraficos} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        {loading ? (
           <div className="text-center py-10 text-gray-400">Cargando turnos...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 border-b border-r text-left sticky left-0 bg-gray-50 z-10 w-48">Trabajador</th>
                {dias.map(d => (
                  <th key={d} className="px-2 py-2 border-b border-r text-center w-10">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(porUsuario).length === 0 ? (
                <tr>
                  <td colSpan={dias.length + 1} className="py-8 text-center text-gray-500">
                    No hay turnos asignados para {mes}/{anio}.
                  </td>
                </tr>
              ) : (
                Object.keys(porUsuario).map(rut => (
                  <tr key={rut} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b border-r font-medium text-xs sticky left-0 bg-white truncate" title={porUsuario[rut].nombre}>
                      {porUsuario[rut].nombre}
                    </td>
                    {dias.map(d => {
                      const t = porUsuario[rut].turnos[d] || '';
                      return (
                        <td key={d} className="px-1 py-2 border-b border-r text-center text-xs font-bold text-gray-700">
                          {t}
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
