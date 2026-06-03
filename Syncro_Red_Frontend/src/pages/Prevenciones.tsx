import { useEffect, useState } from 'react';
import client from '../api/client';
import { TrainTrack, Upload, RefreshCw, Loader2 } from 'lucide-react';

interface Prevencion {
  id: number;
  linea: string;
  bloque_afectado: string;
  via: string;
  km_inicio: string;
  km_fin: string;
  tipo_restriccion: string;
  velocidad_restriccion: string;
  descripcion_trabajo: string;
  hora_inicio: string;
  hora_termino: string;
}

export default function Prevenciones() {
  const [prevenciones, setPrevenciones] = useState<Prevencion[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = () => {
    setLoading(true);
    client.get('/prevenciones/prevenciones/')
      .then(r => setPrevenciones(r.data.results || r.data))
      .catch(() => setPrevenciones([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const subir = async (file: File) => {
    setSubiendo(true);
    const fd = new FormData();
    fd.append('archivo', file);
    try {
      const res = await client.post('/prevenciones/prevenciones/cargar_excel/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const r = res.data;
      alert(`Prevenciones cargadas: ${r.creadas} (L1: ${r.por_linea.L1}, L2: ${r.por_linea.L2}).` +
        (r.advertencias?.length ? `\n\nAvisos:\n${r.advertencias.join('\n')}` : ''));
      cargar();
    } catch (err: any) {
      alert('Error al cargar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <TrainTrack className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Prevenciones de Vía</h2>
            <p className="text-sm text-gray-400">Carga de notificaciones de faenas (Excel)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm hover:bg-gray-50" title="Recargar">
            <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-azul px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-azul/90">
            {subiendo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {subiendo ? 'Procesando…' : 'Cargar Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" disabled={subiendo}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); (e.target as HTMLInputElement).value = ''; }} />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Cargando…</div>
          ) : prevenciones.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No hay prevenciones cargadas. Sube el Excel de faenas.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-azul">
                <tr>
                  <th className="border-b px-3 py-3 text-left">Línea</th>
                  <th className="border-b px-3 py-3 text-left">Bloque</th>
                  <th className="border-b px-3 py-3 text-left">Vía</th>
                  <th className="border-b px-3 py-3 text-left">KM</th>
                  <th className="border-b px-3 py-3 text-left">Restricción</th>
                  <th className="border-b px-3 py-3 text-left">Trabajo</th>
                  <th className="border-b px-3 py-3 text-left">Horario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prevenciones.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2"><span className="rounded bg-azul/10 px-2 py-0.5 text-xs font-bold text-azul">{p.linea || '—'}</span></td>
                    <td className="px-3 py-2 font-semibold text-gray-800">{p.bloque_afectado || '—'}</td>
                    <td className="px-3 py-2">{p.via || '—'}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{p.km_inicio} {p.km_fin ? `– ${p.km_fin}` : ''}</td>
                    <td className="px-3 py-2 text-xs font-bold text-rojo">{p.tipo_restriccion || p.velocidad_restriccion || '—'}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-gray-600" title={p.descripcion_trabajo}>{p.descripcion_trabajo || '—'}</td>
                    <td className="px-3 py-2 text-xs font-bold text-gray-700">{p.hora_inicio || '—'} – {p.hora_termino || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
