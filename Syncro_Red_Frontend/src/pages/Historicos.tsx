import { useState, useEffect } from 'react';
import client from '../api/client';
import { Search, Download, FileText, FileDown } from 'lucide-react';

interface ReporteFinal {
  id: number;
  fecha: string;
  usuario: string;
  cargo: string;
  maquinista: string;
  ayudante: string;
  resumen_texto: string;
  justificacion_cierre: string;
  creado_en: string;
}

export default function Historicos() {
  const [reportes, setReportes] = useState<ReporteFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaBuscada, setFechaBuscada] = useState('');

  useEffect(() => {
    buscarReportes();
  }, []);

  const buscarReportes = async () => {
    setLoading(true);
    try {
      const url = fechaBuscada ? `/bitacora/reportes-finales/?fecha=${fechaBuscada}` : `/bitacora/reportes-finales/`;
      const res = await client.get(url);
      setReportes(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const descargarExcel = async () => {
    try {
      console.log('📊 Descargando Bitácora Operativa...');
      const params = fechaBuscada ? { fecha: fechaBuscada } : {};
      console.log('📊 Parámetros:', params);
      
      const res = await client.get('/bitacora/reportes-finales/exportar_bitacora_operativa/', {
        params,
        responseType: 'blob',
      });
      
      console.log('📊 Respuesta recibida:', res.status, res.headers['content-type']);
      
      if (!res.data || res.data.size === 0) {
        throw new Error('El archivo está vacío');
      }
      
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bitacora_Operativa${fechaBuscada ? '_' + fechaBuscada : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ Bitácora descargada exitosamente');
    } catch (err: any) {
      console.error('❌ Error descargando Bitácora:', err);
      console.error('Error details:', err.response?.status, err.response?.data);
      
      if (err.response?.status === 404) {
        alert('Error: El endpoint no existe. Reinicia el servidor Django.');
      } else if (err.response?.status === 500) {
        alert('Error del servidor al generar el Excel. Contacta al administrador.');
      } else if (err.message === 'El archivo está vacío') {
        alert('No hay datos para exportar. Realiza servicios en Bitácora primero.');
      } else {
        alert('Error al descargar el Excel: ' + (err.message || 'Error desconocido'));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <FileText className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Históricos y Reportes Finales</h2>
            <p className="text-sm text-gray-400">Consulta y exportación de reportes de cierre</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fechaBuscada}
            onChange={(e) => setFechaBuscada(e.target.value)}
            className="rounded-lg border border-gray-300 p-2 text-sm transition-colors focus:border-azul focus:ring-2 focus:ring-azul/30"
          />
          <button
            onClick={buscarReportes}
            className="inline-flex items-center gap-2 rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-azul/90"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
          <button
            onClick={descargarExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-verde px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-verde/90"
          >
            <FileDown className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-14 text-center text-gray-400">Cargando reportes históricos...</div>
        ) : reportes.length === 0 ? (
          <div className="py-14 text-center text-gray-500">
            No se encontraron reportes para los criterios de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-bold uppercase tracking-wide text-azul">
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Fecha / Hora</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Autor</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Resumen de Novedades</th>
                  <th className="w-32 border-b border-gray-200 px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportes.map((rep) => (
                  <tr key={rep.id} className="align-top transition-colors hover:bg-gray-50/70">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-bold text-azul">{rep.fecha}</div>
                      <div className="text-xs text-gray-500">{new Date(rep.creado_en).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      {rep.maquinista ? (
                        <>
                          <div className="font-semibold text-gray-900">{rep.maquinista}</div>
                          <div className="text-xs text-gray-500">Maquinista</div>
                          {rep.ayudante && (
                            <>
                              <div className="mt-1 font-semibold text-gray-900">{rep.ayudante}</div>
                              <div className="text-xs text-gray-500">Ayudante</div>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-gray-900">{rep.usuario}</div>
                          <div className="text-xs font-medium text-rojo">{rep.cargo}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-2 font-mono text-xs text-gray-600">
                        {rep.resumen_texto}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const blob = new Blob([rep.resumen_texto], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Reporte_${rep.fecha}.txt`;
                          a.click();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-azul/20 bg-azul/5 px-2.5 py-1.5 text-xs font-bold text-azul transition-colors hover:bg-azul/10"
                      >
                        <Download className="h-3 w-3" /> TXT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
