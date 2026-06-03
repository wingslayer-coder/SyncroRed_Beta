import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Database, RefreshCw, Search, ShieldAlert, AlertCircle, Wrench,
  FileText, ClipboardList, TrainFront, UserMinus, TrainTrack, Users, Trash2, X,
} from 'lucide-react';

interface Col { key: string; label: string; trunc?: boolean }
interface Seccion {
  key: string;
  label: string;
  endpoint: string;
  icon: React.ReactNode;
  color: string;
  cols: Col[];
}

const SECCIONES: Seccion[] = [
  {
    key: 'emergencias', label: 'Emergencias', endpoint: '/alertas/emergencias/',
    icon: <ShieldAlert className="h-4 w-4" />, color: 'text-rojo',
    cols: [
      { key: 'fecha_hora', label: 'Fecha/Hora' }, { key: 'tren_num', label: 'Tren' },
      { key: 'equipo', label: 'Equipo' }, { key: 'tipo_evento', label: 'Tipo' },
      { key: 'ubicacion', label: 'Ubicación', trunc: true }, { key: 'nombre_reporta', label: 'Notificó' },
      { key: 'estado_alerta', label: 'Estado' }, { key: 'latitud', label: 'Lat' }, { key: 'longitud', label: 'Lon' },
    ],
  },
  {
    key: 'incidencias', label: 'Incidencias', endpoint: '/alertas/incidencias/',
    icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-500',
    cols: [
      { key: 'fecha_hora', label: 'Fecha/Hora' }, { key: 'tren_num', label: 'Tren' },
      { key: 'equipo', label: 'Equipo' }, { key: 'tipo_incidencia', label: 'Tipo' },
      { key: 'detalle', label: 'Detalle', trunc: true }, { key: 'ubicacion', label: 'Ubicación', trunc: true },
      { key: 'nombre_reporta', label: 'Notificó' }, { key: 'estado', label: 'Estado' },
    ],
  },
  {
    key: 'fallas', label: 'Fallas de Equipo', endpoint: '/alertas/fallas-equipo/',
    icon: <Wrench className="h-4 w-4" />, color: 'text-orange-600',
    cols: [
      { key: 'fecha_hora', label: 'Fecha/Hora' }, { key: 'tren_num', label: 'Tren' },
      { key: 'equipo', label: 'Equipo' }, { key: 'sistema_afectado', label: 'Sistema' },
      { key: 'detalle', label: 'Detalle', trunc: true }, { key: 'nombre_reporta', label: 'Notificó' },
      { key: 'estado', label: 'Estado' },
    ],
  },
  {
    key: 'reportes', label: 'Reportes de Turno', endpoint: '/bitacora/reportes-finales/',
    icon: <FileText className="h-4 w-4" />, color: 'text-azul',
    cols: [
      { key: 'fecha', label: 'Fecha' }, { key: 'usuario', label: 'Usuario' }, { key: 'cargo', label: 'Cargo' },
      { key: 'maquinista', label: 'Maquinista' }, { key: 'ayudante', label: 'Ayudante' },
      { key: 'creado_en', label: 'Creado' },
    ],
  },
  {
    key: 'novedades', label: 'Novedades Operativas', endpoint: '/bitacora/novedades/',
    icon: <ClipboardList className="h-4 w-4" />, color: 'text-indigo-600',
    cols: [
      { key: 'fecha', label: 'Fecha' }, { key: 'tren_num', label: 'Tren' }, { key: 'estacion', label: 'Estación' },
      { key: 'tipo', label: 'Tipo' }, { key: 'minutos', label: 'Min' }, { key: 'categoria', label: 'Categoría' },
      { key: 'detalle', label: 'Detalle', trunc: true },
    ],
  },
  {
    key: 'servicios', label: 'Servicios', endpoint: '/operaciones/servicios-activos/',
    icon: <TrainFront className="h-4 w-4" />, color: 'text-azul',
    cols: [
      { key: 'fecha', label: 'Fecha' }, { key: 'tren_num', label: 'Tren' }, { key: 'equipo_id', label: 'Equipo' },
      { key: 'maquinista', label: 'Maquinista' }, { key: 'ayudante', label: 'Ayudante' }, { key: 'estado', label: 'Estado' },
    ],
  },
  {
    key: 'ausencias', label: 'Ausencias', endpoint: '/usuarios/ausencias/',
    icon: <UserMinus className="h-4 w-4" />, color: 'text-rojo',
    cols: [
      { key: 'fecha', label: 'Fecha' }, { key: 'rut', label: 'RUT' }, { key: 'tipo', label: 'Tipo' },
      { key: 'dias', label: 'Días' }, { key: 'motivo', label: 'Motivo', trunc: true }, { key: 'registrado_por', label: 'Registró' },
    ],
  },
  {
    key: 'prevenciones', label: 'Prevenciones de Vía', endpoint: '/prevenciones/prevenciones/',
    icon: <TrainTrack className="h-4 w-4" />, color: 'text-orange-600',
    cols: [
      { key: 'linea', label: 'Línea' }, { key: 'bloque_afectado', label: 'Bloque' }, { key: 'via', label: 'Vía' },
      { key: 'km_inicio', label: 'KM ini' }, { key: 'km_fin', label: 'KM fin' },
      { key: 'tipo_restriccion', label: 'Restricción', trunc: true },
      { key: 'hora_inicio', label: 'Inicio' }, { key: 'hora_termino', label: 'Término' },
    ],
  },
  {
    key: 'usuarios', label: 'Tripulación / Usuarios', endpoint: '/usuarios/usuarios/',
    icon: <Users className="h-4 w-4" />, color: 'text-azul',
    cols: [
      { key: 'rut', label: 'RUT' }, { key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' },
      { key: 'cargo', label: 'Cargo' }, { key: 'is_active', label: 'Activo' },
    ],
  },
];

function fmt(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'object') return v.rut || JSON.stringify(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleString('es-CL');
  return s;
}

export default function VisorBaseDatos() {
  const { user } = useAuth();
  const esAdmin = (user?.cargo || '').toUpperCase() === 'ADMIN';
  const [activa, setActiva] = useState<Seccion>(SECCIONES[0]);
  const [datos, setDatos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('');
  const [showWipe, setShowWipe] = useState(false);
  const [confirmTxt, setConfirmTxt] = useState('');
  const [wiping, setWiping] = useState(false);

  const cargar = (sec: Seccion) => {
    setLoading(true);
    setError('');
    setFiltro('');
    client.get(sec.endpoint)
      .then((res) => {
        const arr = res.data.results ?? res.data;
        setDatos(Array.isArray(arr) ? arr : []);
        setTotal(res.data.count ?? (Array.isArray(arr) ? arr.length : 0));
      })
      .catch((e) => { setError(e.response?.data?.error || 'No se pudo cargar la tabla'); setDatos([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(activa); /* eslint-disable-next-line */ }, [activa.key]);

  const vaciarBD = async () => {
    setWiping(true);
    try {
      const res = await client.post('/usuarios/admin/vaciar-bd/', { confirm: 'ELIMINAR' });
      alert(`Base de datos vaciada. Registros eliminados: ${res.data.total_eliminados}.\n` +
        `Se conservaron: ${res.data.preservados.join(', ')}.`);
      setShowWipe(false);
      setConfirmTxt('');
      cargar(activa);
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setWiping(false);
    }
  };

  const filtrados = useMemo(() => {
    if (!filtro.trim()) return datos;
    const q = filtro.toLowerCase();
    return datos.filter((row) => activa.cols.some((c) => fmt(row[c.key]).toLowerCase().includes(q)));
  }, [datos, filtro, activa]);

  return (
    <div className="space-y-5 max-w-full mx-auto">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <Database className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Visor de Base de Datos</h2>
            <p className="text-sm text-gray-400">Información operativa segmentada por categoría</p>
          </div>
        </div>
        {esAdmin && (
          <button
            onClick={() => setShowWipe(true)}
            className="flex items-center gap-2 rounded-lg border border-rojo/30 bg-rojo/5 px-3 py-2 text-sm font-bold text-rojo transition-colors hover:bg-rojo hover:text-white"
          >
            <Trash2 className="h-4 w-4" /> Vaciar base de datos
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap gap-2">
        {SECCIONES.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiva(s)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
              activa.key === s.key
                ? 'border-azul bg-azul text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-azul/40 hover:text-azul'
            }`}
          >
            <span className={activa.key === s.key ? 'text-white' : s.color}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Barra de tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={activa.color}>{activa.icon}</span>
            <h3 className="font-bold text-azul">{activa.label}</h3>
            <span className="rounded-full bg-azul/10 px-2 py-0.5 text-xs font-bold text-azul">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar…"
                className="rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
              />
            </div>
            <button onClick={() => cargar(activa)} className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50" title="Recargar">
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Cargando…</div>
          ) : error ? (
            <div className="py-12 text-center text-rojo">{error}</div>
          ) : filtrados.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Sin registros{filtro ? ' para el filtro' : ''}.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-azul">
                <tr>
                  {activa.cols.map((c) => (
                    <th key={c.key} className="whitespace-nowrap border-b border-gray-200 px-3 py-2.5 text-left">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-gray-50/70">
                    {activa.cols.map((c) => (
                      <td
                        key={c.key}
                        className={`px-3 py-2 ${c.trunc ? 'max-w-xs truncate' : 'whitespace-nowrap'} text-gray-700`}
                        title={c.trunc ? fmt(row[c.key]) : undefined}
                      >
                        {fmt(row[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > datos.length && (
          <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
            Mostrando {datos.length} de {total} registros (primera página).
          </div>
        )}
      </div>

      {/* MODAL VACIAR BASE DE DATOS (solo admin) */}
      {showWipe && esAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-rojo px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <h3 className="font-extrabold uppercase tracking-wide">Vaciar base de datos</h3>
              </div>
              <button onClick={() => { setShowWipe(false); setConfirmTxt(''); }} className="rounded-md p-1 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <p className="text-sm text-gray-700">
                Esto <b className="text-rojo">elimina permanentemente</b> todos los datos operativos:
                emergencias, incidencias, fallas, reportes de turno, novedades, servicios, registros,
                gráficos, parejas, prevenciones, ausencias y asistencia.
              </p>
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                Se <b>conservan</b>: usuarios (para no perder el acceso), maestro de turnos e itinerarios.
              </p>
              <p className="text-xs font-bold text-gray-500">Esta acción no se puede deshacer.</p>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Escribe ELIMINAR para confirmar</label>
                <input
                  value={confirmTxt}
                  onChange={(e) => setConfirmTxt(e.target.value)}
                  placeholder="ELIMINAR"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-rojo focus:ring-2 focus:ring-rojo/30"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowWipe(false); setConfirmTxt(''); }} className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={vaciarBD}
                  disabled={confirmTxt !== 'ELIMINAR' || wiping}
                  className="flex-1 rounded-lg bg-rojo px-4 py-2 text-sm font-bold text-white hover:bg-rojo/90 disabled:opacity-40"
                >
                  {wiping ? 'Eliminando…' : 'Eliminar todo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
