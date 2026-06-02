import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  FileText, Search, Calendar, ChevronDown, ChevronRight,
  ShieldCheck, CheckCircle2, AlertTriangle, Clock, Download
} from 'lucide-react';

interface ReporteFinal {
  id: number;
  fecha: string;
  usuario: string;
  cargo: string;
  maquinista: string;
  ayudante: string;
  resumen_texto: string;
  reporte_detallado?: string;
  hash_simple: string;
  hash_detallado?: string;
  justificacion_cierre: string;
  creado_en: string;
}

const ROLES_JEFATURA = new Set([
  'ADMIN', 'GERENTE', 'GERENCIA', 'IL', 'INSPECTOR DE LINEA',
  'SL', 'SUPERVISOR DE LINEA', 'JEFE DE OPERACIONES',
  'JEFE SERVICIO', 'JEFE DE SERVICIO',
]);

export default function VisorBitacoras() {
  const { user } = useAuth();
  const rol = (user?.cargo || '').toUpperCase();
  const esJefatura = ROLES_JEFATURA.has(rol);

  const [reportes, setReportes] = useState<ReporteFinal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);
  const [tabActiva, setTabActiva] = useState<'simple' | 'detallado'>('simple');

  useEffect(() => {
    setCargando(true);
    const params: Record<string, string> = {};
    if (filtroFecha) params['fecha'] = filtroFecha;
    client.get('/bitacora/reportes-finales/', { params })
      .then(res => {
        const lista: ReporteFinal[] = res.data.results ?? res.data;
        setReportes(lista);
        setError('');
      })
      .catch(() => setError('No se pudieron cargar los reportes.'))
      .finally(() => setCargando(false));
  }, [filtroFecha]);

  const reportesFiltrados = reportes.filter(r => {
    if (!filtroUsuario) return true;
    const q = filtroUsuario.toLowerCase();
    return r.maquinista?.toLowerCase().includes(q) ||
           r.ayudante?.toLowerCase().includes(q) ||
           r.usuario?.toLowerCase().includes(q);
  });

  const inputCls = 'rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-azul focus:ring-2 focus:ring-azul/30';

  const descargarTexto = (texto: string, nombre: string) => {
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">

      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-azul flex items-center gap-2">
            <FileText className="h-6 w-6" /> Visor de Bitácoras
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Reportes firmados con SHA-256 · Solo lectura
          </p>
        </div>
        {esJefatura && (
          <button
            onClick={async () => {
              try {
                const params = filtroFecha ? { fecha: filtroFecha } : {};
                const res = await client.get('/bitacora/reportes-finales/exportar_excel/', {
                  params, responseType: 'blob'
                });
                const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bitacoras${filtroFecha ? '_' + filtroFecha : ''}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              } catch { alert('Error al descargar el Excel.'); }
            }}
            className="flex items-center gap-2 rounded-lg border border-azul px-4 py-2 text-xs font-bold text-azul hover:bg-azul/5"
          >
            <Download className="h-4 w-4" /> Exportar Excel
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar por usuario..."
            value={filtroUsuario}
            onChange={e => setFiltroUsuario(e.target.value)}
            className={inputCls + ' w-52'}
          />
        </div>
        {(filtroFecha || filtroUsuario) && (
          <button
            onClick={() => { setFiltroFecha(''); setFiltroUsuario(''); }}
            className="text-xs font-semibold text-gray-400 hover:text-rojo"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Estado */}
      {cargando && (
        <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
          <Clock className="h-4 w-4 animate-spin" /> Cargando reportes...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-rojo">
          <AlertTriangle className="inline h-4 w-4 mr-1" /> {error}
        </div>
      )}

      {/* Lista */}
      {!cargando && !error && reportesFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="font-bold text-azul">No hay reportes para los filtros aplicados.</p>
        </div>
      )}

      <div className="space-y-3">
        {reportesFiltrados.map(rep => {
          const abierto = expandido === rep.id;
          const tieneDetallado = esJefatura && !!rep.reporte_detallado;

          return (
            <div key={rep.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

              {/* Cabecera — click para expandir */}
              <button
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => { setExpandido(abierto ? null : rep.id); setTabActiva('simple'); }}
              >
                <div className="flex items-center gap-4">
                  {abierto
                    ? <ChevronDown className="h-4 w-4 text-azul flex-shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  <div>
                    <span className="font-bold text-azul text-sm">{rep.fecha}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    {rep.maquinista ? (
                      <span className="text-sm text-gray-700 font-medium">
                        {rep.maquinista}
                        {rep.ayudante && <span className="text-gray-400"> / {rep.ayudante}</span>}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-700 font-medium">{rep.usuario}</span>
                    )}
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-xs text-gray-400">{rep.cargo}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rep.hash_simple && (
                    <span className="hidden sm:flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700 font-mono" title={`SHA-256: ${rep.hash_simple}`}>
                      <ShieldCheck className="h-3 w-3" /> {rep.hash_simple.slice(0, 12)}…
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(rep.creado_en).toLocaleString('es-CL')}
                  </span>
                </div>
              </button>

              {/* Contenido expandido */}
              {abierto && (
                <div className="border-t border-gray-100 px-6 pb-6 pt-4">

                  {/* Tabs simple / detallado */}
                  {tieneDetallado && (
                    <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
                      <button
                        onClick={() => setTabActiva('simple')}
                        className={`rounded-md px-4 py-1.5 text-xs font-bold transition-colors ${tabActiva === 'simple' ? 'bg-white text-azul shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Reporte Operativo
                      </button>
                      <button
                        onClick={() => setTabActiva('detallado')}
                        className={`rounded-md px-4 py-1.5 text-xs font-bold transition-colors ${tabActiva === 'detallado' ? 'bg-white text-rojo shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Auditoría
                      </button>
                    </div>
                  )}

                  {/* Reporte simple */}
                  {(tabActiva === 'simple' || !tieneDetallado) && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-azul">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Reporte de Turno
                          <span className="rounded-full bg-azul/10 px-2 py-0.5 text-[10px]">OPERATIVO</span>
                        </span>
                        <button
                          onClick={() => descargarTexto(rep.resumen_texto, `bitacora_${rep.fecha}_${rep.usuario}.txt`)}
                          className="flex items-center gap-1 text-[10px] font-bold text-azul hover:underline"
                        >
                          <Download className="h-3 w-3" /> Descargar
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={rep.resumen_texto || '(Sin contenido)'}
                        className="w-full min-h-[180px] resize-none rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700 cursor-default"
                      />
                      {rep.hash_simple && (
                        <p className="mt-1.5 text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-500" /> SHA-256: {rep.hash_simple}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reporte detallado — solo jefatura */}
                  {tabActiva === 'detallado' && tieneDetallado && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rojo">
                          <ShieldCheck className="h-3.5 w-3.5" /> Reporte Detallado
                          <span className="rounded-full bg-rojo/10 px-2 py-0.5 text-[10px]">AUDITORÍA</span>
                        </span>
                        <button
                          onClick={() => descargarTexto(rep.reporte_detallado!, `auditoria_${rep.fecha}_${rep.usuario}.txt`)}
                          className="flex items-center gap-1 text-[10px] font-bold text-rojo hover:underline"
                        >
                          <Download className="h-3 w-3" /> Descargar
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={rep.reporte_detallado || '(Sin contenido)'}
                        className="w-full min-h-[220px] resize-none rounded-lg border border-red-100 bg-red-50/30 p-4 font-mono text-xs text-gray-700 cursor-default"
                      />
                      {rep.hash_detallado && (
                        <p className="mt-1.5 text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-500" /> SHA-256: {rep.hash_detallado}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
