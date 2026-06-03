import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserMinus, Save, RefreshCw, Sparkles, Clock, Award, X, Moon, ArrowRight } from 'lucide-react';

interface Ausencia {
  id?: number;
  fecha: string;
  rut: string;
  tipo: string;
  motivo: string;
  dias: number;
  registrado_por: string;
}

interface Candidato {
  rut: string;
  nombre: string;
  cargo: string;
  estado: string;
  tipo: string;            // 'RECIBIDOR' | 'EN_TURNO'
  es_recibidor: boolean;
  es_interrupcion: boolean;
  horas_extra: number;
  horas_nocturnas: number;
  horas_descanso: number;
  regla: string;
  detalle: string;
  score: number;
}

interface RecoDia {
  fecha: string;
  tipo_dia: string;
  turno: string;
  servicios: string;
  req_entrada: string;
  req_salida: string;
  tiene_recibidor?: boolean;
  principal: Candidato | null;
  alternativa: Candidato | null;
  candidatos: Candidato[];
}

interface Recomendacion {
  rut: string;
  nombre: string;
  cargo: string;
  recomendaciones: RecoDia[];
  mensaje?: string;
}

export default function GestionBajas() {
  const { user } = useAuth();
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [usuarios, setUsuarios] = useState<{ rut: string; nombre: string; apellido: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reco, setReco] = useState<Recomendacion | null>(null);
  const [recomendando, setRecomendando] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Ausencia>({
    fecha: hoy,
    rut: '',
    tipo: 'LICENCIA',
    motivo: '',
    dias: 1,
    registrado_por: `${user?.nombre} ${user?.apellido}`,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resAus, resUsu] = await Promise.all([
        client.get('/usuarios/ausencias/'),
        client.get('/usuarios/usuarios/'),
      ]);
      setAusencias(resAus.data.results || resAus.data);
      setUsuarios(resUsu.data.results || resUsu.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sugerirReemplazo = async (rut: string, fecha: string, dias: number) => {
    setRecomendando(true);
    setReco(null);
    try {
      const res = await client.post('/usuarios/recomendar-reemplazo/', { rut, fecha, dias });
      setReco(res.data);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar la recomendación de reemplazo.');
    } finally {
      setRecomendando(false);
    }
  };

  const asignarReemplazo = async (fecha: string, turno: string, rut: string, nombre: string) => {
    if (!confirm(`¿Asignar a ${nombre} al turno ${turno} del ${fecha}?`)) return;
    try {
      await client.post('/operaciones/pauta-diaria/', { fecha, rut, num_turno: turno });
      alert(`${nombre} asignado al turno ${turno} (${fecha}).`);
    } catch (err: any) {
      alert('Error al asignar: ' + (err.response?.data?.error || err.message));
    }
  };

  const renderCandidato = (c: Candidato, principal: boolean, fecha: string, turno: string) => (
    <div className={`rounded-xl border p-4 ${principal ? 'border-verde/40 bg-verde/5' : 'border-gray-200 bg-gray-50/50'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${principal ? 'text-verde' : 'text-gray-500'}`}>
          {principal ? <Award className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          {principal ? 'Recomendación principal' : 'Alternativa'}
        </span>
        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-bold text-gray-500">{c.estado}</span>
      </div>
      <div className="text-base font-extrabold text-azul">{c.nombre}</div>
      <div className="mb-2 text-xs text-gray-400">{c.rut} · {c.cargo}</div>
      <div className="mb-2 flex flex-wrap gap-2">
        {c.es_recibidor ? (
          <span className="rounded-md bg-verde/10 px-2 py-1 text-xs font-bold text-verde">Recibidor (disponible)</span>
        ) : (
          <span className="rounded-md bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">En turno — interrupción</span>
        )}
        <span className="rounded-md bg-azul/10 px-2 py-1 text-xs font-bold text-azul">+{c.horas_extra} h extra</span>
        {c.horas_nocturnas > 0 && <span className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600"><Moon className="h-3 w-3" /> {c.horas_nocturnas} h noct.</span>}
        {c.horas_descanso > 0 && <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{c.horas_descanso} h descanso</span>}
      </div>
      <p className="mb-3 text-xs text-gray-600"><b>{c.regla}.</b> {c.detalle}</p>
      <button
        onClick={() => asignarReemplazo(fecha, turno, c.rut, c.nombre)}
        className="w-full rounded-lg bg-azul px-4 py-2 text-xs font-bold text-white hover:bg-azul/90"
      >
        Asignar al turno {turno}
      </button>
    </div>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rut) return alert('Seleccione un trabajador');
    setSaving(true);
    try {
      await client.post('/usuarios/ausencias/', form);
      const { rut, fecha, dias } = form;
      cargarDatos();
      setForm({ ...form, rut: '', motivo: '', dias: 1 });
      // Sugerir automáticamente el reemplazo para los turnos afectados
      sugerirReemplazo(rut, fecha, dias);
    } catch (err) {
      console.error(err);
      alert('Error al registrar ausencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <UserMinus className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Gestión de Bajas y Licencias</h2>
            <p className="text-sm text-gray-400">Registro de ausencias, permisos y bajas médicas</p>
          </div>
        </div>
        <button
          onClick={cargarDatos}
          className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50"
          title="Recargar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario */}
        <div className="h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <h3 className="font-bold text-azul">Nueva Ausencia</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4 p-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Trabajador</label>
              <select
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
              >
                <option value="">Seleccione trabajador...</option>
                {usuarios.map((u) => (
                  <option key={u.rut} value={u.rut}>{u.nombre} {u.apellido} ({u.rut})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Fecha Inicial</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
                >
                  <option value="LICENCIA">Licencia</option>
                  <option value="PERMISO">Permiso</option>
                  <option value="BAJA">Baja Médica</option>
                  <option value="VACACIONES">Vacaciones</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Días</label>
                <input
                  type="number"
                  min="1"
                  value={form.dias}
                  onChange={(e) => setForm({ ...form, dias: parseInt(e.target.value) })}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Motivo / Observación</label>
              <textarea
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
                placeholder="Detalle de la ausencia..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-verde py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-verde/90 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Guardando...' : 'Registrar Ausencia'}
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <h3 className="font-bold text-azul">Registro Histórico de Ausencias</h3>
          </div>
          <div className="overflow-x-auto p-0">
            {loading ? (
              <div className="py-12 text-center text-gray-400">Cargando registros...</div>
            ) : ausencias.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No hay ausencias registradas.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-bold uppercase tracking-wide text-azul">
                    <th className="border-b border-gray-200 px-4 py-3 text-left">Fecha</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left">Trabajador</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left">Tipo</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-center">Días</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left">Motivo</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-center">Reemplazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ausencias.map((a) => {
                    const usr = typeof a.rut === 'object' ? (a.rut as any) : usuarios.find((u) => u.rut === a.rut);
                    const usrName = usr ? `${usr.nombre} ${usr.apellido}` : a.rut;

                    return (
                      <tr key={a.id} className="transition-colors hover:bg-gray-50/70">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.fecha}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{usrName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                              a.tipo === 'VACACIONES'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : a.tipo === 'LICENCIA'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-orange-200 bg-orange-50 text-orange-700'
                            }`}
                          >
                            {a.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-azul">{a.dias}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-600" title={a.motivo}>
                          {a.motivo || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => sugerirReemplazo(usr?.rut ?? (a.rut as string), a.fecha, a.dias)}
                            className="inline-flex items-center gap-1 rounded-lg border border-azul/20 bg-azul/5 px-2.5 py-1.5 text-xs font-bold text-azul transition-colors hover:bg-azul/10"
                            title="Sugerir reemplazo"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Sugerir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Panel de recomendación de reemplazo ── */}
      {(recomendando || reco) && (
        <div className="overflow-hidden rounded-2xl border border-azul/20 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-azul/5 to-white px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-azul" />
              <h3 className="font-bold text-azul">Recomendación de Reemplazo{reco ? ` — ${reco.nombre}` : ''}</h3>
            </div>
            {reco && (
              <button onClick={() => setReco(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100" title="Cerrar">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="p-6">
            {recomendando ? (
              <div className="py-8 text-center text-gray-400">Analizando candidatos…</div>
            ) : reco && reco.recomendaciones.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {reco.mensaje || 'El trabajador no tiene turnos asignados en esas fechas; no requiere reemplazo.'}
              </div>
            ) : (
              <div className="space-y-6">
                {reco?.recomendaciones.map((d) => (
                  <div key={d.fecha} className="rounded-xl border border-gray-200">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-sm">
                      <span className="font-bold text-azul">{d.fecha}</span>
                      <span className="text-gray-500">Turno <b className="text-gray-700">{d.turno}</b> ({d.tipo_dia})</span>
                      <span className="flex items-center gap-1 text-gray-500"><Clock className="h-3.5 w-3.5" /> Apertura {d.req_entrada} – Cierre {d.req_salida}</span>
                      {d.servicios && <span className="max-w-md truncate text-gray-400" title={d.servicios}>Servicios: {d.servicios}</span>}
                    </div>
                    {d.principal && !d.tiene_recibidor && (
                      <div className="mx-5 mt-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                        No hay recibidor disponible este día. Se sugiere interrumpir un turno como último recurso (no se puede llamar a personal en descanso).
                      </div>
                    )}
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                      {d.principal ? renderCandidato(d.principal, true, d.fecha, d.turno) : (
                        <div className="text-sm text-gray-500">Sin candidatos disponibles para cubrir este turno.</div>
                      )}
                      {d.alternativa && renderCandidato(d.alternativa, false, d.fecha, d.turno)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
