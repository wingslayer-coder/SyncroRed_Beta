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
  hora_cierre: string; fecha_cierre: string | null;
  // Horas extras desglose
  horas_extras: number;
  horas_extras_apertura: number;
  horas_extras_cierre: number;
  horas_extras_7_5: number;
  horas_extras_descanso: number;
  horas_extras_doble_turno: number;
  horas_manejo: number;
  horas_nocturnas: number;
  horas_menos_reposo: number;
  estado: string; observacion: string;
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
        // Datos del gráfico para cálculo de horas extras
        grafico_apertura_hora: miTurno?.apertura_hora || '',
        grafico_cierre_hora: miTurno?.cierre_hora || '',
        grafico_tiene_descanso_posterior: miTurno?.tipo_dia === 'Descanso' || false,
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
        // Flag para doble turno / modificación completa (calcula totalidad del turno)
        es_doble_turno: false,  // TODO: agregar checkbox en UI para casos de modificación completa
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRegistro, setEditRegistro] = useState<Consolidado|null>(null);
  const [editForm, setEditForm] = useState({
    hora_apertura: '',
    inicio_servicio: '',
    hora_cierre: '',
    horas_extras: 0,
    horas_manejo: 0,
    horas_nocturnas: 0,
    horas_menos_reposo: 0,
    estado: '',
    observacion_il: '',
  });
  const [notificacionModal, setNotificacionModal] = useState<{show: boolean, mensaje: string, trabajador: string}>({show: false, mensaje: '', trabajador: ''});
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroMes, setFiltroMes] = useState((new Date().getMonth() + 1).toString()); // Mes actual por defecto
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString());

  // Calcular fechas de inicio y fin de mes para el backend
  const fechaDesde = `${filtroAnio}-${filtroMes.padStart(2, '0')}-01`;
  const fechaHasta = `${filtroAnio}-${filtroMes.padStart(2, '0')}-${new Date(parseInt(filtroAnio), parseInt(filtroMes), 0).getDate()}`;

  const cargarPendientes = async () => {
    try { const r = await client.get('/usuarios/asistencia/pendientes/'); setPendientes(r.data); }
    catch { setPendientes([]); }
  };

  const cargarConsolidado = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('desde', fechaDesde);
      params.set('hasta', fechaHasta);
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

  const abrirModalEdicion = (registro: Consolidado) => {
    setEditRegistro(registro);
    setEditForm({
      hora_apertura: registro.hora_apertura || '',
      inicio_servicio: registro.inicio_servicio || '',
      hora_cierre: registro.hora_cierre || '',
      horas_extras: registro.horas_extras || 0,
      horas_manejo: registro.horas_manejo || 0,
      horas_nocturnas: registro.horas_nocturnas || 0,
      horas_menos_reposo: registro.horas_menos_reposo || 0,
      estado: registro.estado || '',
      observacion_il: registro.observacion || '',
    });
    setEditModalOpen(true);
  };

  const guardarEdicion = async () => {
    if (!editRegistro) return;
    try {
      await client.patch(`/usuarios/asistencia/editar/${editRegistro.id}/`, editForm);
      
      // Mostrar notificación de éxito
      setNotificacionModal({
        show: true,
        mensaje: `Se han modificado las horas del turno del ${editRegistro.fecha}. Nuevas horas extras: ${editForm.horas_extras}h, manejo: ${editForm.horas_manejo}h, nocturnas: ${editForm.horas_nocturnas}h`,
        trabajador: editRegistro.nombre
      });
      
      setEditModalOpen(false);
      setEditRegistro(null);
      cargarConsolidado();
      
      // Cerrar notificación automáticamente después de 3 segundos
      setTimeout(() => {
        setNotificacionModal(prev => ({...prev, show: false}));
      }, 3000);
    } catch (e) {
      alert('Error al guardar los cambios');
    }
  };

  // Función para filtrar y ordenar datos
  const filteredConsolidado = consolidado.filter(r => {
    if (filtroNombre && !r.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
    return true;
  });

  // Ordenar automáticamente por fecha (1-31)
  const sortedConsolidado = [...filteredConsolidado].sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });

  // Exportar detalle por trabajador específico
  const exportarDetallePorTrabajador = async (rut: string, nombre: string) => {
    const params = new URLSearchParams();
    params.set('desde', fechaDesde);
    params.set('hasta', fechaHasta);
    params.set('rut', rut);
    params.set('modo', 'detalle');
    
    try {
      const response = await client.get(`/usuarios/asistencia/exportar-excel/?${params}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const nombreLimpio = nombre.replace(/\s+/g, '_').substring(0, 20);
      const periodo = filtroMes ? `${filtroMes.padStart(2,'0')}_${filtroAnio}` : 'periodo';
      link.setAttribute('download', `detalle_${nombreLimpio}_${periodo}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al descargar el Excel.');
    }
  };

  // Calcular totales sobre datos filtrados
  const totales = filteredConsolidado.reduce((acc, r) => ({
    horas_extras: acc.horas_extras + (r.horas_extras || 0),
    horas_extras_apertura: acc.horas_extras_apertura + (r.horas_extras_apertura || 0),
    horas_extras_cierre: acc.horas_extras_cierre + (r.horas_extras_cierre || 0),
    horas_extras_7_5: acc.horas_extras_7_5 + (r.horas_extras_7_5 || 0),
    horas_extras_descanso: acc.horas_extras_descanso + (r.horas_extras_descanso || 0),
    horas_extras_doble_turno: acc.horas_extras_doble_turno + (r.horas_extras_doble_turno || 0),
    horas_manejo: acc.horas_manejo + (r.horas_manejo || 0),
    horas_nocturnas: acc.horas_nocturnas + (r.horas_nocturnas || 0),
    horas_menos_reposo: acc.horas_menos_reposo + (r.horas_menos_reposo || 0),
  }), {
    horas_extras: 0, horas_extras_apertura: 0, horas_extras_cierre: 0,
    horas_extras_7_5: 0, horas_extras_descanso: 0, horas_extras_doble_turno: 0,
    horas_manejo: 0, horas_nocturnas: 0, horas_menos_reposo: 0,
  });

  // Exportar a Excel (usando axios para incluir JWT token)
  const exportarExcel = async (modo: 'detalle'|'resumen') => {
    const params = new URLSearchParams();
    params.set('desde', fechaDesde);
    params.set('hasta', fechaHasta);
    params.set('modo', modo);
    
    try {
      const response = await client.get(`/usuarios/asistencia/exportar-excel/?${params}`, {
        responseType: 'blob', // Importante para descargar archivos
      });
      
      // Crear URL del blob y forzar descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre del archivo
      const fechaStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `asistencia_${modo}_${fechaStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al descargar el Excel. Verifica que tengas permisos.');
    }
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
                <button onClick={async () => {
                  if (confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) {
                    await client.delete(`/usuarios/asistencia/eliminar/${p.id}/`);
                    cargarPendientes();
                  }
                }}
                  className="w-full rounded-lg bg-gray-600 py-1.5 text-xs font-bold text-white hover:brightness-110 transition-all flex items-center justify-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" /> Eliminar solicitud
                </button>
            </div>
          ))}
        </div>
      )}

      {/* Consolidado */}
      {tab === 'consolidado' && (
        <div className="space-y-4">
          {/* Filtros y Exportación */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end justify-center">
              {/* Período Mensual */}
              <div className="flex gap-3 items-end bg-azul/5 rounded-lg p-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-azul">📅 Mes</label>
                  <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                    className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30 w-36 bg-white">
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                      <option key={i} value={(i + 1).toString()}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-azul">Año</label>
                  <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
                    className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30 w-24 bg-white">
                    {[2024, 2025, 2026, 2027, 2028].map(a => (
                      <option key={a} value={a.toString()}>{a}</option>
                    ))}
                  </select>
                </div>
                <button onClick={cargarConsolidado}
                  className="rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all">
                  🔍 Buscar
                </button>
              </div>

              {/* Búsqueda por Nombre */}
              <div className="w-full max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-400">🔎 Buscar por Nombre</label>
                  <input value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)}
                    className="rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30 w-full"
                    placeholder="Ej: Bustamante, Barriga, etc." />
                </div>
              </div>
            </div>
            
            {/* Botones de Excel centrados */}
            <div className="flex gap-2 justify-center mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => exportarExcel('detalle')}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all flex items-center gap-2">
                <FileText className="h-4 w-4" /> Excel Detalle
              </button>
              <button onClick={() => exportarExcel('resumen')}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all flex items-center gap-2">
                <FileText className="h-4 w-4" /> Excel Resumen
              </button>
            </div>
          </div>

          {/* Totales */}
          {filteredConsolidado.length > 0 && (
            <div className="rounded-xl border border-azul/20 bg-azul/5 p-4">
              <h4 className="text-sm font-bold text-azul mb-3">
                📊 Totales del período ({filteredConsolidado.length} registros
                {filteredConsolidado.length !== consolidado.length && ` de ${consolidado.length} total`})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <div className="text-gray-500">H.Extras Total</div>
                  <div className="font-bold text-rojo text-lg">{totales.horas_extras.toFixed(1)}</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <div className="text-gray-500">H.Manejo</div>
                  <div className="font-bold text-azul text-lg">{totales.horas_manejo.toFixed(1)}</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <div className="text-gray-500">H.Nocturnas</div>
                  <div className="font-bold text-indigo-600 text-lg">{totales.horas_nocturnas.toFixed(1)}</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <div className="text-gray-500">H.Menos Reposo</div>
                  <div className="font-bold text-rojo text-lg">{totales.horas_menos_reposo.toFixed(1)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-azul" /></div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-azul text-white text-xs">
                    <th className="px-2 py-2 text-left font-bold">Fecha</th>
                    <th className="px-2 py-2 text-left font-bold">Nombre</th>
                    <th className="px-2 py-2 text-left font-bold">Lugar</th>
                    <th className="px-2 py-2 text-left font-bold">Apertura</th>
                    <th className="px-2 py-2 text-left font-bold">Presentación</th>
                    <th className="px-2 py-2 text-left font-bold">Cierre</th>
                    <th className="px-2 py-2 text-center font-bold bg-rojo/20">Extras</th>
                    <th className="px-2 py-2 text-center font-bold bg-blue-500/20">Manejo</th>
                    <th className="px-2 py-2 text-center font-bold bg-indigo-500/20">Noct.</th>
                    <th className="px-2 py-2 text-center font-bold bg-red-500/20">Reposo</th>
                    <th className="px-2 py-2 text-left font-bold">Estado</th>
                    <th className="px-2 py-2 text-left font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedConsolidado.length === 0 && (
                    <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400">Sin registros para los filtros seleccionados.</td></tr>
                  )}
                  {sortedConsolidado.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">{r.fecha}</td>
                      <td className="px-2 py-2 font-semibold text-gray-800 text-xs truncate max-w-[120px]">{r.nombre}</td>
                      <td className="px-2 py-2 text-xs text-gray-500">{r.lugar_apertura}</td>
                      <td className="px-2 py-2 text-xs">{r.hora_apertura}</td>
                      <td className="px-2 py-2 text-xs">{r.inicio_servicio}</td>
                      <td className="px-2 py-2 text-xs">{r.fecha_cierre ? `${r.fecha_cierre} ` : ''}{r.hora_cierre || '—'}</td>
                      <td className="px-2 py-2 text-xs font-bold text-rojo text-center">{r.horas_extras?.toFixed(1) || '0.0'}</td>
                      <td className="px-2 py-2 text-xs text-blue-700 text-center">{r.horas_manejo?.toFixed(1) || '0.0'}</td>
                      <td className="px-2 py-2 text-xs text-indigo-700 text-center">{r.horas_nocturnas?.toFixed(1) || '0.0'}</td>
                      <td className="px-2 py-2 text-xs text-red-700 text-center">{r.horas_menos_reposo?.toFixed(1) || '0.0'}</td>
                      <td className="px-2 py-2"><Badge estado={r.estado} /></td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => exportarDetallePorTrabajador(r.rut, r.nombre)}
                            className="rounded bg-green-600/20 px-2 py-1 text-[10px] font-bold text-green-700 hover:bg-green-600 hover:text-white transition-all"
                            title="Descargar detalle mensual">
                            <FileText className="h-3 w-3 inline" />
                          </button>
                          <button onClick={() => abrirModalEdicion(r)}
                            className="rounded bg-azul/10 px-2 py-1 text-[10px] font-bold text-azul hover:bg-azul hover:text-white transition-all"
                            title="Editar horas">
                            <Edit3 className="h-3 w-3 inline" />
                          </button>
                        </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editModalOpen && editRegistro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-azul">✏️ Editar Registro</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-azul/5 rounded-lg p-3 text-sm">
                <p><strong>Trabajador:</strong> {editRegistro.nombre}</p>
                <p><strong>Fecha:</strong> {editRegistro.fecha}</p>
                <p><strong>RUT:</strong> {editRegistro.rut}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Hora Apertura EZ</label>
                  <input type="time" value={editForm.hora_apertura} 
                    onChange={e => setEditForm(f => ({...f, hora_apertura: e.target.value}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Hora Presentación</label>
                  <input type="time" value={editForm.inicio_servicio}
                    onChange={e => setEditForm(f => ({...f, inicio_servicio: e.target.value}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Hora Cierre</label>
                  <input type="time" value={editForm.hora_cierre}
                    onChange={e => setEditForm(f => ({...f, hora_cierre: e.target.value}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Estado</label>
                  <select value={editForm.estado}
                    onChange={e => setEditForm(f => ({...f, estado: e.target.value}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm">
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="RECHAZADO">RECHAZADO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-rojo">H. Extras</label>
                  <input type="number" step="0.5" min="0" value={editForm.horas_extras}
                    onChange={e => setEditForm(f => ({...f, horas_extras: parseFloat(e.target.value)}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm font-bold text-rojo" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-azul">H. Manejo</label>
                  <input type="number" step="0.5" min="0" value={editForm.horas_manejo}
                    onChange={e => setEditForm(f => ({...f, horas_manejo: parseFloat(e.target.value)}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm font-bold text-azul" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-600">H. Nocturnas</label>
                  <input type="number" step="0.5" min="0" value={editForm.horas_nocturnas}
                    onChange={e => setEditForm(f => ({...f, horas_nocturnas: parseFloat(e.target.value)}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm font-bold text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-red-600">H. Menos Reposo</label>
                  <input type="number" step="0.5" min="0" value={editForm.horas_menos_reposo}
                    onChange={e => setEditForm(f => ({...f, horas_menos_reposo: parseFloat(e.target.value)}))}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm font-bold text-red-600" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Observación IL</label>
                <textarea value={editForm.observacion_il}
                  onChange={e => setEditForm(f => ({...f, observacion_il: e.target.value}))}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm h-20"
                  placeholder="Motivo de la modificación..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditModalOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={guardarEdicion}
                  className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-bold text-white hover:brightness-110 flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de modificación */}
      {notificacionModal.show && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white rounded-xl shadow-lg p-4 max-w-md z-50 animate-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Modificación Guardada</p>
              <p className="text-sm mt-1">{notificacionModal.mensaje}</p>
              <p className="text-xs mt-2 opacity-75">📧 Notificación enviada a {notificacionModal.trabajador}</p>
            </div>
            <button onClick={() => setNotificacionModal(prev => ({...prev, show: false}))}
              className="opacity-75 hover:opacity-100">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
