import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Clock, UserCheck, MapPin, Moon, Truck, TimerReset, Plus,
  FileText, Train, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Loader2, Edit3, Save, Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Registro {
  id: number; fecha: string; rut_trabajador: string;
  lugar_apertura: string; hora_apertura: string; inicio_servicio: string;
  hora_cierre: string; horas_extras: number; horas_menos_reposo: number;
  horas_nocturnas: number; horas_manejo: number; estado: string; observacion_il: string;
}
interface MiTurno {
  turno: string; tipo_dia: string; servicios: string;
  apertura_hora: string; apertura_lugar: string;
  presentacion_hora: string; presentacion_lugar: string;
  cierre_hora: string; cierre_lugar: string;
}
interface Pendiente {
  id: number; fecha: string; rut: string; nombre: string; cargo: string;
  lugar_apertura: string; hora_apertura: string; inicio_servicio: string;
  hora_cierre: string; observacion: string;
  horas_extras: number; horas_nocturnas: number; horas_manejo: number; horas_menos_reposo: number;
}
interface Consolidado {
  id: number; fecha: string; rut: string; nombre: string; cargo: string;
  lugar_apertura: string; hora_apertura: string; inicio_servicio: string;
  hora_cierre: string; horas_extras: number; horas_manejo: number;
  horas_nocturnas: number; horas_menos_reposo: number; estado: string; observacion: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LUGARES = ['CW','CC','OH','HQ','LM','GU','EZ','LJ'];

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      <input type="time" value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 focus:border-azul focus:ring-2 focus:ring-azul/30" />
    </div>
  );
}

function Badge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    ABIERTO: 'bg-blue-100 text-blue-700',
    CONFIRMADO: 'bg-green-100 text-green-700',
    PENDIENTE_AUTORIZACION: 'bg-amber-100 text-amber-700',
    RECHAZADO: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${map[estado] || 'bg-gray-100 text-gray-600'}`}>{estado.replace('_', ' ')}</span>;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Asistencia() {
  const { user } = useAuth();
  const cargo = (user?.cargo || '').toUpperCase();
  const esTripulacion = cargo === 'MAQUINISTA' || cargo === 'AYUDANTE';
  const esMaquinista  = cargo === 'MAQUINISTA';
  const esJefatura    = ['IL','INSPECTOR DE LINEA','SL','SUPERVISOR DE LINEA',
                         'JEFE DE OPERACIONES','ADMIN','GERENTE','GERENCIA'].includes(cargo);

  const hoy = new Date().toISOString().split('T')[0];
  const fechaLegible = new Date(hoy + 'T00:00:00').toLocaleDateString('es-CL',
    { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const iniciales = `${user?.nombre?.[0]??''}${user?.apellido?.[0]??''}`.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-azul via-azul to-azul/85 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rojo" />
        <div className="pointer-events-none absolute right-16 bottom-0 h-32 w-32 rounded-full bg-rojo/20 blur-2xl" />
        <div className="relative px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Train className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">EFE · Control Operativo</p>
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <UserCheck className="h-5 w-5 text-rojo" /> Asistencia y Alistación
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20">
            <Clock className="h-4 w-4 text-white/70" /> {fechaLegible}
          </span>
        </div>
      </div>

      {/* Worker card */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azul to-rojo font-extrabold text-white shadow-inner">
          {iniciales}
        </div>
        <div>
          <p className="font-bold text-azul">{user?.nombre} {user?.apellido}</p>
          <p className="text-sm text-gray-500">{user?.cargo} · RUT {user?.rut}</p>
        </div>
      </div>

      {/* Route to correct panel */}
      {esTripulacion && <PanelTripulacion hoy={hoy} esMaquinista={esMaquinista} />}
      {esJefatura && <PanelJefatura />}
      {!esTripulacion && !esJefatura && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-400 shadow-sm">
          <Eye className="h-10 w-10 mx-auto mb-3 text-gray-200" />
          <p className="font-semibold">Su perfil no tiene acceso al módulo de asistencia.</p>
        </div>
      )}
    </div>
  );
}

// ─── PANEL TRIPULACIÓN ───────────────────────────────────────────────────────
function PanelTripulacion({ hoy, esMaquinista }: { hoy: string; esMaquinista: boolean }) {
  type Fase = 'apertura' | 'cierre' | 'fin';
  const [fase, setFase] = useState<Fase>('apertura');
  const [turnoAbierto, setTurnoAbierto] = useState<Registro | null>(null);
  const [miTurno, setMiTurno] = useState<MiTurno | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [err, setErr] = useState('');

  // ── Apertura
  const [lugar, setLugar] = useState('EZ');
  const [coincideAp, setCoincideAp] = useState(true);
  const [horaPresManual, setHoraPresManual] = useState('');   // solo si no coincide
  const [motivoAp, setMotivoAp] = useState('');
  const [savingAp, setSavingAp] = useState(false);

  // ── Cierre
  const [coincideCi, setCoincideCi] = useState(true);
  const [horaCiManual, setHoraCiManual] = useState('');
  const [motivoCi, setMotivoCi] = useState('');
  const [iniManejo, setIniManejo] = useState('');
  const [finManejo, setFinManejo] = useState('');
  const [savingCi, setSavingCi] = useState(false);
  const [resumenCierre, setResumenCierre] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    Promise.all([
      client.get(`/usuarios/asistencia/mi-registro/?fecha=${hoy}`).catch(() => ({ data: null })),
      client.get(`/operaciones/mi-turno/?fecha=${hoy}`).catch(() => ({ data: null })),
    ]).then(([regRes, turnoRes]) => {
      if (regRes.data?.id) {
        setTurnoAbierto(regRes.data);
        setFase(regRes.data.hora_cierre ? 'fin' : 'cierre');
      }
      if (turnoRes.data?.turno) {
        const t = turnoRes.data as MiTurno;
        setMiTurno(t);
        setLugar(t.apertura_lugar || 'EZ');
      }
    }).finally(() => setLoadingInit(false));
  }, [hoy]);

  // ── Apertura: el trabajador elige lugar y si no coincide pone su hora de presentación.
  //    El backend calcula la hora de apertura EZ.
  const abrirTurno = async () => {
    setErr(''); setSavingAp(true);
    try {
      const horaPres = coincideAp && miTurno
        ? miTurno.presentacion_hora
        : horaPresManual;

      if (!horaPres) { setErr('Ingrese su hora de presentación'); setSavingAp(false); return; }
      if (!coincideAp && !motivoAp) { setErr('Ingrese el motivo del cambio para que el IL autorice'); setSavingAp(false); return; }

      const res = await client.post('/usuarios/asistencia/abrir/', {
        lugar_apertura: lugar,
        hora_presentacion: horaPres,
        coincide: coincideAp && !!miTurno,
        motivo: motivoAp,
      });

      setTurnoAbierto({ id: res.data.id, fecha: hoy, rut_trabajador: '', lugar_apertura: lugar,
        hora_apertura: res.data.hora_apertura_ez, inicio_servicio: res.data.hora_presentacion,
        hora_cierre: '', horas_extras: 0, horas_menos_reposo: 0, horas_nocturnas: 0,
        horas_manejo: 0, estado: res.data.estado, observacion_il: '' });
      setFase('cierre');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Error al abrir turno');
    } finally { setSavingAp(false); }
  };

  // ── Cierre: hora de término + horas de manejo para maquinista
  const cerrarTurno = async () => {
    setErr(''); setSavingCi(true);
    try {
      const horaCierre = coincideCi && miTurno ? miTurno.cierre_hora : horaCiManual;
      if (!horaCierre) { setErr('Ingrese la hora de término'); setSavingCi(false); return; }
      if (!coincideCi && !motivoCi) { setErr('Ingrese el motivo del cambio'); setSavingCi(false); return; }
      if (esMaquinista && (!iniManejo || !finManejo)) {
        setErr('Indique el inicio y fin de conducción'); setSavingCi(false); return;
      }

      const res = await client.post('/usuarios/asistencia/cerrar/', {
        hora_cierre: horaCierre,
        coincide_cierre: coincideCi && !!miTurno,
        motivo_cierre: motivoCi,
        inicio_manejo: iniManejo,
        fin_manejo: finManejo,
      });
      setResumenCierre(res.data);
      setFase('fin');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Error al cerrar turno');
    } finally { setSavingCi(false); }
  };

  if (loadingInit) return (
    <div className="flex items-center justify-center py-20 gap-3 text-azul">
      <Loader2 className="h-6 w-6 animate-spin" /><span className="font-semibold">Consultando estado...</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 shadow-sm">
        {(['apertura','cierre','fin'] as Fase[]).map((f, i) => (
          <div key={f} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              fase === f ? 'bg-azul text-white'
              : (f === 'apertura' && (fase === 'cierre' || fase === 'fin')) || (f === 'cierre' && fase === 'fin')
                ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>{i + 1}</div>
            <span className={`text-xs font-semibold ${fase === f ? 'text-azul' : 'text-gray-400'}`}>
              {f === 'apertura' ? 'Apertura' : f === 'cierre' ? 'Cierre' : 'Finalizado'}
            </span>
            {i < 2 && <ChevronRight className="h-4 w-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {err}
        </div>
      )}

      {/* ═══════════════ FASE: APERTURA ═══════════════ */}
      {fase === 'apertura' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-azul flex items-center gap-2">
            <Clock className="h-5 w-5 text-rojo" /> Apertura de Turno
          </h3>

          {/* Info turno del gráfico */}
          {miTurno ? (
            <div className="rounded-xl bg-azul/5 border border-azul/20 px-4 py-3 text-sm space-y-0.5">
              <p className="font-bold text-azul">📅 Turno {miTurno.turno} — {miTurno.tipo_dia}</p>
              <p className="text-gray-600">
                Presentación según gráfico: <strong>{miTurno.presentacion_hora}</strong> en <strong>{miTurno.presentacion_lugar}</strong>
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Sin turno asignado en el gráfico mensual. El ingreso manual requiere autorización del IL.</span>
            </div>
          )}

          {/* Lugar de presentación */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-rojo" /> ¿Dónde se presenta?
            </label>
            <select value={lugar} onChange={e => setLugar(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm font-semibold focus:border-azul focus:ring-2 focus:ring-azul/30">
              {LUGARES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* ¿Coincide? — solo si tiene turno asignado */}
          {miTurno && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">¿Su presentación coincide con el gráfico?</p>
              <div className="flex gap-3">
                <button onClick={() => { setCoincideAp(true); setHoraPresManual(''); setMotivoAp(''); }}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-all ${coincideAp ? 'border-azul bg-azul text-white shadow-sm' : 'border-gray-200 text-gray-500 hover:border-azul'}`}>
                  ✔ Sí, según gráfico
                </button>
                <button onClick={() => setCoincideAp(false)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-all ${!coincideAp ? 'border-rojo bg-rojo text-white shadow-sm' : 'border-gray-200 text-gray-500 hover:border-rojo'}`}>
                  ✗ No, hora diferente
                </button>
              </div>
            </div>
          )}

          {/* Hora manual + motivo (si no coincide o sin turno) */}
          {(!coincideAp || !miTurno) && (
            <div className="space-y-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
              <TimeInput
                label="¿A qué hora se presentó?"
                value={horaPresManual}
                onChange={setHoraPresManual}
              />
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-amber-500" />
                  Motivo — se solicitará autorización al IL
                </label>
                <textarea
                  value={motivoAp}
                  onChange={e => setMotivoAp(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  placeholder="Ej: Relevo de emergencia, turno extra solicitado por jefatura..." />
              </div>
            </div>
          )}

          {/* Confirmación cuando sí coincide */}
          {coincideAp && miTurno && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 font-medium">
              ✔ Se registrará presentación a las <strong>{miTurno.presentacion_hora}</strong>.
              La hora de apertura EZ la calculará el sistema automáticamente.
            </div>
          )}

          <button onClick={abrirTurno} disabled={savingAp}
            className="w-full rounded-xl bg-azul py-3.5 font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
            {savingAp
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando apertura...</>
              : <><CheckCircle2 className="h-4 w-4" /> Abrir Turno de Trabajo</>}
          </button>
        </div>
      )}

      {/* ═══════════════ FASE: CIERRE ═══════════════ */}
      {fase === 'cierre' && turnoAbierto && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-azul flex items-center gap-2">
            <Clock className="h-5 w-5 text-rojo" /> Cierre de Turno
          </h3>

          {/* Resumen apertura */}
          <div className="rounded-xl bg-azul/5 border border-azul/20 px-4 py-3 text-sm space-y-0.5">
            <p className="font-bold text-azul">📍 Turno en curso</p>
            <p className="text-gray-600">
              Apertura EZ: <strong>{turnoAbierto.hora_apertura}</strong> ·
              Presentación: <strong>{turnoAbierto.inicio_servicio}</strong> en <strong>{turnoAbierto.lugar_apertura}</strong>
            </p>
            {miTurno && (
              <p className="text-gray-500 text-xs">
                Cierre según gráfico: <strong>{miTurno.cierre_hora}</strong> en {miTurno.cierre_lugar}
              </p>
            )}
          </div>

          {/* ¿Coincide cierre? */}
          {miTurno && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">¿Su término coincide con el gráfico?</p>
              <div className="flex gap-3">
                <button onClick={() => { setCoincideCi(true); setHoraCiManual(''); setMotivoCi(''); }}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-all ${coincideCi ? 'border-azul bg-azul text-white shadow-sm' : 'border-gray-200 text-gray-500 hover:border-azul'}`}>
                  ✔ Sí, según gráfico
                </button>
                <button onClick={() => setCoincideCi(false)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-all ${!coincideCi ? 'border-rojo bg-rojo text-white shadow-sm' : 'border-gray-200 text-gray-500 hover:border-rojo'}`}>
                  ✗ No, hora diferente
                </button>
              </div>
            </div>
          )}

          {/* Hora manual cierre */}
          {(!coincideCi || !miTurno) && (
            <div className="space-y-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
              <TimeInput label="¿A qué hora terminó su turno?" value={horaCiManual} onChange={setHoraCiManual} />
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-amber-500" /> Motivo del cambio
                </label>
                <textarea value={motivoCi} onChange={e => setMotivoCi(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  placeholder="Ej: Relevo tardío, servicio extendido..." />
              </div>
            </div>
          )}

          {coincideCi && miTurno && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 font-medium">
              ✔ Se registrará término a las <strong>{miTurno.cierre_hora}</strong>.
            </div>
          )}

          {/* Horas de manejo — SOLO MAQUINISTA, al final del cierre */}
          {esMaquinista && (
            <div className="rounded-xl border border-azul/20 bg-azul/5 p-4 space-y-4">
              <p className="text-sm font-bold text-azul flex items-center gap-2">
                <Truck className="h-4 w-4" /> Registro de Conducción
              </p>
              <p className="text-xs text-gray-500">Indique el rango horario en que condujo el tren durante esta jornada.</p>
              <div className="grid grid-cols-2 gap-4">
                <TimeInput label="Inicio de conducción" value={iniManejo} onChange={setIniManejo} />
                <TimeInput label="Fin de conducción" value={finManejo} onChange={setFinManejo} />
              </div>
            </div>
          )}

          <button onClick={cerrarTurno} disabled={savingCi}
            className="w-full rounded-xl bg-rojo py-3.5 font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
            {savingCi
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Calculando horas...</>
              : <><XCircle className="h-4 w-4" /> Cerrar Jornada y Calcular Horas</>}
          </button>
        </div>
      )}

      {/* FASE: Fin */}
      {fase === 'fin' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm space-y-4">
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
          <h3 className="text-xl font-extrabold text-green-800">¡Jornada registrada exitosamente!</h3>
          <p className="text-green-600 text-sm">Los datos han sido guardados en el Libro de Asistencia.</p>
          {resumenCierre && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label:'H. Extras', val: resumenCierre.horas_extras, icon: Plus, color:'text-rojo' },
                { label:'H. Nocturnas', val: resumenCierre.horas_nocturnas, icon: Moon, color:'text-azul' },
                { label:'H. Manejo', val: resumenCierre.horas_manejo, icon: Truck, color:'text-azul' },
                { label:'H. Menos Reposo', val: resumenCierre.horas_menos_reposo, icon: TimerReset, color:'text-rojo' },
              ].map(({ label, val, icon: Icon, color }) => (
                <div key={label} className="rounded-xl bg-white border border-gray-200 p-3 text-center shadow-sm">
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                  <p className="text-xs text-gray-500 font-semibold">{label}</p>
                  <p className="text-lg font-extrabold text-azul">{val?.toFixed(1)}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Mañana podrá registrar su próxima jornada.</p>
        </div>
      )}
    </div>
  );
}

// ─── PANEL JEFATURA ──────────────────────────────────────────────────────────
function PanelJefatura() {
  const [tab, setTab] = useState<'pendientes'|'consolidado'>('pendientes');
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [consolidado, setConsolidado] = useState<Consolidado[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [editData, setEditData] = useState<Partial<Consolidado>>({});
  const [filtroRut, setFiltroRut] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const cargarPendientes = async () => {
    try { const r = await client.get('/usuarios/asistencia/pendientes/'); setPendientes(r.data); }
    catch { setPendientes([]); }
  };

  const cargarConsolidado = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroDesde) params.set('desde', filtroDesde);
      if (filtroHasta) params.set('hasta', filtroHasta);
      if (filtroRut)   params.set('rut', filtroRut);
      const r = await client.get(`/usuarios/asistencia/consolidado/?${params}`);
      setConsolidado(r.data);
    } catch { setConsolidado([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarPendientes(); cargarConsolidado(); }, []);

  const accionPendiente = async (id: number, accion: 'autorizar'|'rechazar') => {
    await client.post('/usuarios/asistencia/pendientes/', { id, accion });
    cargarPendientes(); cargarConsolidado();
  };

  const guardarEdicion = async () => {
    if (!editId) return;
    await client.patch(`/usuarios/asistencia/editar/${editId}/`, editData);
    setEditId(null); setEditData({});
    cargarConsolidado();
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm w-fit">
        {(['pendientes','consolidado'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab===t ? 'bg-azul text-white shadow' : 'text-gray-500 hover:text-azul'}`}>
            {t === 'pendientes' ? `⚠ Solicitudes (${pendientes.length})` : '📋 Consolidado'}
          </button>
        ))}
      </div>

      {/* Pendientes */}
      {tab === 'pendientes' && (
        <div className="space-y-3">
          {pendientes.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-6 text-center text-green-700 font-semibold shadow-sm">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
              No hay solicitudes pendientes de autorización.
            </div>
          ) : pendientes.map(p => (
            <div key={p.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="font-bold text-gray-800">{p.nombre} <span className="text-gray-400 font-normal text-xs">({p.rut})</span></p>
                  <p className="text-xs text-gray-500">{p.fecha} · {p.cargo}</p>
                </div>
                <Badge estado="PENDIENTE_AUTORIZACION" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                <span><MapPin className="h-3 w-3 inline text-rojo mr-1" />{p.lugar_apertura}</span>
                <span><Clock className="h-3 w-3 inline text-azul mr-1" />Apertura: {p.hora_apertura}</span>
                <span><Clock className="h-3 w-3 inline text-azul mr-1" />Presentación: {p.inicio_servicio}</span>
                <span><Clock className="h-3 w-3 inline text-rojo mr-1" />Cierre: {p.hora_cierre || '—'}</span>
              </div>
              {p.observacion && (
                <div className="rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <FileText className="h-3 w-3 inline mr-1" /> {p.observacion}
                </div>
              )}
              <div className="flex gap-2">
                  <button onClick={() => accionPendiente(p.id, 'autorizar')}
                    className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-bold text-white hover:brightness-110 transition-all flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Autorizar
                  </button>
                  <button onClick={() => accionPendiente(p.id, 'rechazar')}
                    className="flex-1 rounded-lg bg-rojo py-2 text-sm font-bold text-white hover:brightness-110 transition-all flex items-center justify-center gap-1">
                    <XCircle className="h-4 w-4" /> Rechazar
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Consolidado */}
      {tab === 'consolidado' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Desde</label>
              <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
                className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">Hasta</label>
              <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
                className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">RUT Trabajador</label>
              <input value={filtroRut} onChange={e => setFiltroRut(e.target.value)}
                className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
                placeholder="Ej: 20516668-8" />
            </div>
            <button onClick={cargarConsolidado}
              className="rounded-xl bg-azul px-5 py-2 text-sm font-bold text-white hover:brightness-110 transition-all">
              Filtrar
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-azul" /></div>
            ) : (
              <table className="w-full border-collapse table-fixed text-sm">
                <thead>
                  <tr className="bg-azul text-white text-xs">
                    {['Fecha','Nombre','Lugar','Apertura','Presentación','Cierre','H.Extras','H.Manejo','H.Noct.','H.Reposo','Estado',''].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consolidado.length === 0 && (
                    <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400">Sin registros para los filtros seleccionados.</td></tr>
                  )}
                  {consolidado.map(r => (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${editId === r.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{r.fecha}</td>
                      <td className="px-3 py-2 font-semibold text-gray-800 truncate">{r.nombre}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{r.lugar_apertura}</td>
                      <td className="px-3 py-2 text-xs">{r.hora_apertura}</td>
                      <td className="px-3 py-2 text-xs">{r.inicio_servicio}</td>
                      <td className="px-3 py-2 text-xs">{r.hora_cierre || '—'}</td>
                      {editId === r.id ? (
                        <>
                          {(['horas_extras','horas_manejo','horas_nocturnas','horas_menos_reposo'] as const).map(f => (
                            <td key={f} className="px-1 py-1">
                              <input type="number" step="0.5" min="0"
                                value={(editData as any)[f] ?? r[f]}
                                onChange={e => setEditData(d => ({...d, [f]: parseFloat(e.target.value)}))}
                                className="w-16 rounded border border-azul p-1 text-xs text-center font-bold" />
                            </td>
                          ))}
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-xs font-bold text-rojo">{r.horas_extras.toFixed(1)}</td>
                          <td className="px-3 py-2 text-xs font-bold text-azul">{r.horas_manejo.toFixed(1)}</td>
                          <td className="px-3 py-2 text-xs font-bold text-azul">{r.horas_nocturnas.toFixed(1)}</td>
                          <td className="px-3 py-2 text-xs font-bold text-rojo">{r.horas_menos_reposo.toFixed(1)}</td>
                        </>
                      )}
                      <td className="px-3 py-2"><Badge estado={r.estado} /></td>
                      <td className="px-2 py-2">
                          {editId === r.id ? (
                            <button onClick={guardarEdicion}
                              className="rounded bg-green-600 px-2 py-1 text-[10px] font-bold text-white hover:brightness-110">
                              <Save className="h-3 w-3 inline" /> Guardar
                            </button>
                          ) : (
                            <button onClick={() => { setEditId(r.id); setEditData({}); }}
                              className="rounded bg-azul/10 px-2 py-1 text-[10px] font-bold text-azul hover:bg-azul hover:text-white transition-all">
                              <Edit3 className="h-3 w-3 inline" /> Editar
                            </button>
                          )}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
