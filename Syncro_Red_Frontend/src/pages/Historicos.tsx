import { useState, useEffect } from 'react';
import client from '../api/client';
import { Search, Download, FileText, FileDown } from 'lucide-react';

interface ReporteFinal {
  id: number;
  fecha: string;
  usuario: string;
  cargo: string;
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

  const descargarExcel = () => {
    const url = fechaBuscada 
      ? `http://localhost:8000/api/bitacora/reportes-finales/exportar_excel/?fecha=${fechaBuscada}`
      : `http://localhost:8000/api/bitacora/reportes-finales/exportar_excel/`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <FileText className="w-6 h-6 text-rojo" />
          Históricos y Reportes Finales
        </h2>
        
        <div className="flex gap-2 items-center">
          <input 
            type="date" 
            value={fechaBuscada}
            onChange={(e) => setFechaBuscada(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-azul"
          />
          <button 
            onClick={buscarReportes}
            className="bg-azul text-white px-4 py-2 rounded-md hover:bg-azul/90 flex items-center gap-2 text-sm font-bold"
          >
            <Search className="w-4 h-4" /> Buscar
          </button>
          <button 
            onClick={descargarExcel}
            className="bg-verde text-white px-4 py-2 rounded-md hover:bg-verde/90 flex items-center gap-2 text-sm font-bold"
          >
            <FileDown className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando reportes históricos...</div>
        ) : reportes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 border-b">
            No se encontraron reportes para los criterios de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left border-b font-bold">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left border-b font-bold">Autor</th>
                  <th className="px-4 py-3 text-left border-b font-bold">Resumen de Novedades</th>
                  <th className="px-4 py-3 text-left border-b font-bold w-32">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportes.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-azul">{rep.fecha}</div>
                      <div className="text-xs text-gray-500">{new Date(rep.creado_en).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{rep.usuario}</div>
                      <div className="text-xs text-gray-500">{rep.cargo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="whitespace-pre-wrap font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-48 overflow-y-auto border border-gray-100">
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
                        className="text-azul hover:text-azul/80 flex items-center gap-1 text-xs font-bold"
                      >
                        <Download className="w-3 h-3" /> Descargar TXT
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
