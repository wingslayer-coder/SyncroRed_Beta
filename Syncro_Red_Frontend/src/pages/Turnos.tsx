import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Calendar, RefreshCw, Upload, Users, Wand2, ArrowRightLeft, Settings2, X, Loader2, CalendarDays, Trash2, Plus } from 'lucide-react';

interface GraficoMensual {
  id?: number;
  fecha: string;
  rut: string | any;
  num_turno: string;
  nombre?: string;
  apellido?: string;
}

interface ParejaTurnos {
  nombres: string;
  turnos: Record<number, string>;
  ruts: string[];
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Turnos() {
  const { user } = useAuth();
  const cargo = (user?.cargo || '').toUpperCase();
  const esJefatura = ['IL', 'INSPECTOR DE LINEA', 'SL', 'SUPERVISOR DE LINEA', 'JO', 'JEFE DE OPERACIONES', 'ADMIN', 'GERENCIA', 'GERENTE'].includes(cargo);
  
  const [graficos, setGraficos] = useState<GraficoMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [uploading, setUploading] = useState(false);
  const [nombresMap, setNombresMap] = useState<Record<string, string>>({});
  const [generando, setGenerando] = useState(false);
  const [showParejas, setShowParejas] = useState(false);
  const [parejasReg, setParejasReg] = useState<any[]>([]);
  const [swap, setSwap] = useState<{ a: string; b: string; campo: 'maquinista' | 'ayudante' }>({ a: '', b: '', campo: 'ayudante' });
  const [showFeriados, setShowFeriados] = useState(false);
  const [feriados, setFeriados] = useState<any[]>([]);
  const [nuevoFeriado, setNuevoFeriado] = useState({ fecha: '', nombre: '' });

  useEffect(() => {
    cargarGraficos();
    cargarNombresUsuarios();
  }, [mes, anio]);

  const cargarParejas = async () => {
    try {
      const res = await client.get('/operaciones/parejas-tripulacion/');
      setParejasReg(res.data.results || res.data);
    } catch (err) { console.error(err); }
  };

  const generarGrafico = async () => {
    if (!confirm(`¿Generar automáticamente el gráfico de ${MESES[mes - 1]} ${anio}? Reemplaza el gráfico existente del mes.`)) return;
    setGenerando(true);
    try {
      const res = await client.post('/operaciones/grafico-mensual/generar/', { anio, mes });
      const r = res.data;
      alert(
        `Gráfico generado:\n` +
        `• Parejas: ${r.parejas}\n` +
        `• Cobertura: ${r.cobertura_pct}% (${r.turnos_cubiertos}/${r.turnos_totales})\n` +
        `• Menos-reposo: ${r.menos_reposo}\n` +
        `• Máx. días seguidos: ${r.max_dias_seguidos} (parejas que superan 6: ${r.parejas_superan_6})\n` +
        `• Libres promedio/pareja: ${r.libres_promedio_pareja}`
      );
      cargarGraficos();
    } catch (err: any) {
      alert('Error al generar: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerando(false);
    }
  };

  const autoEmparejar = async () => {
    try {
      const res = await client.post('/operaciones/parejas-tripulacion/auto_emparejar/', {});
      alert(`Parejas creadas: ${res.data.creadas}. Total: ${res.data.total}`);
      cargarParejas();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const intercambiar = async () => {
    if (!swap.a || !swap.b || swap.a === swap.b) return alert('Selecciona dos parejas distintas.');
    try {
      await client.post('/operaciones/parejas-tripulacion/intercambiar/', {
        pareja_a: swap.a, pareja_b: swap.b, campo: swap.campo,
      });
      setSwap({ a: '', b: '', campo: swap.campo });
      cargarParejas();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const cargarFeriados = async () => {
    try {
      const res = await client.get('/operaciones/feriados/');
      setFeriados(res.data.results || res.data);
    } catch (err) { console.error(err); }
  };

  const agregarFeriado = async () => {
    if (!nuevoFeriado.fecha) return alert('Selecciona una fecha.');
    try {
      await client.post('/operaciones/feriados/', nuevoFeriado);
      setNuevoFeriado({ fecha: '', nombre: '' });
      cargarFeriados();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.fecha?.[0] || err.response?.data?.error || err.message));
    }
  };

  const eliminarFeriado = async (id: number) => {
    try {
      await client.delete(`/operaciones/feriados/${id}/`);
      cargarFeriados();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const cargarGraficos = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/operaciones/grafico-mensual/?anio=${anio}&mes=${mes}`);
      const all: GraficoMensual[] = res.data.results || res.data;
      // Filtro robusto por string (evita corrimiento de zona horaria con new Date)
      const prefijo = `${anio}-${String(mes).padStart(2, '0')}`;
      const filtrados = all.filter((g) => (g.fecha || '').startsWith(prefijo));
      setGraficos(filtrados);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarNombresUsuarios = async () => {
    try {
      const res = await client.get('/usuarios/usuarios/');
      const usuarios = res.data.results || res.data;
      const map: Record<string, string> = {};
      usuarios.forEach((u: any) => {
        const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim();
        if (u.rut && nombreCompleto) {
          map[u.rut] = nombreCompleto;
        }
      });
      setNombresMap(map);
    } catch (err) {
      console.error('Error cargando nombres:', err);
    }
  };

  const getDaysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate();
  const diasMes = getDaysInMonth(mes, anio);
  const dias = Array.from({ length: diasMes }, (_, i) => i + 1);

  // Agrupar por rut y detectar parejas con mismo turno
  const porUsuario: Record<string, { nombre: string; turnos: Record<number, string>; ruts: string[] }> = {};
  
  graficos.forEach((g) => {
    const r = typeof g.rut === 'object' ? g.rut.rut : g.rut;
    // Primero intentar obtener nombre del mapa de usuarios, luego del objeto rut, luego del grafico
    const nombreRaw = nombresMap[r] 
      || (typeof g.rut === 'object' ? `${g.rut.nombre || ''} ${g.rut.apellido || ''}`.trim() : '')
      || (g.nombre && g.apellido ? `${g.nombre} ${g.apellido}`.trim() : '');
    const nombre = nombreRaw || r;

    if (!porUsuario[r]) {
      porUsuario[r] = { nombre, turnos: {}, ruts: [r] };
    }
    const day = parseInt(g.fecha.split('-')[2], 10);
    porUsuario[r].turnos[day] = g.num_turno;
  });

  // Detectar parejas con turnos idénticos
  const parejas: ParejaTurnos[] = [];
  const usuariosProcesados = new Set<string>();
  
  const usuarios = Object.keys(porUsuario);
  for (let i = 0; i < usuarios.length; i++) {
    const rut1 = usuarios[i];
    if (usuariosProcesados.has(rut1)) continue;
    
    const user1 = porUsuario[rut1];
    const turnos1Str = JSON.stringify(user1.turnos);
    const parejaRuts = [rut1];
    const nombresPareja = [user1.nombre];
    
    for (let j = i + 1; j < usuarios.length; j++) {
      const rut2 = usuarios[j];
      if (usuariosProcesados.has(rut2)) continue;
      
      const user2 = porUsuario[rut2];
      const turnos2Str = JSON.stringify(user2.turnos);
      
      if (turnos1Str === turnos2Str) {
        parejaRuts.push(rut2);
        nombresPareja.push(user2.nombre);
        usuariosProcesados.add(rut2);
      }
    }
    
    if (parejaRuts.length > 1) {
      parejas.push({
        nombres: nombresPareja.join(' / '),
        turnos: user1.turnos,
        ruts: parejaRuts
      });
      usuariosProcesados.add(rut1);
    }
  }
  
  // Usuarios individuales (sin pareja)
  const individuales = usuarios
    .filter(rut => !usuariosProcesados.has(rut))
    .map(rut => ({
      nombres: porUsuario[rut].nombre,
      turnos: porUsuario[rut].turnos,
      ruts: [rut]
    }));
  
  const todosLosTurnos = [...parejas, ...individuales];

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
          {esJefatura && (
            <>
              <button
                onClick={generarGrafico}
                disabled={generando}
                className="flex items-center gap-2 rounded-lg bg-azul px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-azul/90 disabled:opacity-50"
                title="Generar gráfico automáticamente"
              >
                {generando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                <span className="hidden sm:inline">{generando ? 'Generando…' : 'Generar'}</span>
              </button>
              <button
                onClick={() => { setShowParejas(true); cargarParejas(); }}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-azul shadow-sm transition-colors hover:bg-gray-50"
                title="Gestionar parejas"
              >
                <Settings2 className="h-5 w-5" />
                <span className="hidden sm:inline">Parejas</span>
              </button>
              <button
                onClick={() => { setShowFeriados(true); cargarFeriados(); }}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-azul shadow-sm transition-colors hover:bg-gray-50"
                title="Gestionar feriados"
              >
                <CalendarDays className="h-5 w-5" />
                <span className="hidden sm:inline">Feriados</span>
              </button>
              <button
                onClick={() => document.getElementById('upload-grafico')?.click()}
                disabled={uploading}
                className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                title="Subir gráfico (Excel)"
              >
                <Upload className={`h-5 w-5 text-azul ${uploading ? 'animate-pulse' : ''}`} />
              </button>
            </>
          )}
          <input
            id="upload-grafico"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              setUploading(true);
              const formData = new FormData();
              formData.append('archivo', file);
              formData.append('mes', mes.toString());
              formData.append('anio', anio.toString());
              
              try {
                await client.post('/operaciones/grafico-mensual/upload/', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Gráfico subido exitosamente');
                cargarGraficos();
              } catch (err: any) {
                console.error(err);
                alert('Error al subir el archivo: ' + (err.response?.data?.error || err.message));
              } finally {
                setUploading(false);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
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
              {todosLosTurnos.length === 0 ? (
                <tr>
                  <td colSpan={dias.length + 1} className="py-8 text-center text-gray-500">
                    No hay turnos asignados para {MESES[mes - 1]} {anio}.
                  </td>
                </tr>
              ) : (
                todosLosTurnos.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70">
                    <td
                      className={`sticky left-0 z-[1] w-48 truncate border-b border-r border-gray-200 px-4 py-2 text-xs font-semibold text-gray-800 ${
                        item.ruts.length > 1 ? 'bg-blue-50' : 'bg-white'
                      }`}
                      title={item.nombres}
                    >
                      <div className="flex items-center gap-2">
                        {item.ruts.length > 1 && <Users size={14} className="text-blue-500" />}
                        <span>{item.nombres}</span>
                      </div>
                    </td>
                    {dias.map((d) => {
                      const t = item.turnos[d] || '';
                      return (
                        <td
                          key={d}
                          className={`border-b border-r border-gray-200 px-1 py-2 text-center ${
                            esFinDeSemana(d) ? 'bg-rojo/[0.03]' : ''
                          }`}
                        >
                          {t ? (
                            <span className={`inline-flex min-w-[26px] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold ${
                              item.ruts.length > 1 ? 'bg-blue-100 text-blue-700' : 'bg-azul/10 text-azul'
                            }`}>
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

      {/* MODAL GESTIÓN DE PAREJAS */}
      {showParejas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-azul/5 to-white px-6 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-azul" />
                <h3 className="font-bold text-azul">Parejas de Tripulación ({parejasReg.length})</h3>
              </div>
              <button onClick={() => setShowParejas(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 bg-gray-50/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Intercambiar miembro entre dos parejas</p>
              <div className="flex flex-wrap items-end gap-2">
                <select value={swap.a} onChange={(e) => setSwap({ ...swap, a: e.target.value })} className="flex-1 min-w-[140px] rounded-lg border border-gray-300 p-2 text-sm">
                  <option value="">Pareja A…</option>
                  {parejasReg.map((p) => <option key={p.id} value={p.id}>#{p.orden} · {p.maquinista_nombre || '—'} / {p.ayudante_nombre || '—'}</option>)}
                </select>
                <select value={swap.b} onChange={(e) => setSwap({ ...swap, b: e.target.value })} className="flex-1 min-w-[140px] rounded-lg border border-gray-300 p-2 text-sm">
                  <option value="">Pareja B…</option>
                  {parejasReg.map((p) => <option key={p.id} value={p.id}>#{p.orden} · {p.maquinista_nombre || '—'} / {p.ayudante_nombre || '—'}</option>)}
                </select>
                <select value={swap.campo} onChange={(e) => setSwap({ ...swap, campo: e.target.value as 'maquinista' | 'ayudante' })} className="rounded-lg border border-gray-300 p-2 text-sm">
                  <option value="ayudante">Ayudante</option>
                  <option value="maquinista">Maquinista</option>
                </select>
                <button onClick={intercambiar} className="flex items-center gap-1.5 rounded-lg bg-azul px-3 py-2 text-sm font-bold text-white hover:bg-azul/90">
                  <ArrowRightLeft className="h-4 w-4" /> Intercambiar
                </button>
              </div>
              {parejasReg.length === 0 && (
                <button onClick={autoEmparejar} className="mt-3 w-full rounded-lg border border-dashed border-azul/40 py-2 text-sm font-bold text-azul hover:bg-azul/5">
                  Auto-emparejar tripulación cargada
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    <th className="border-b px-4 py-2 text-left">#</th>
                    <th className="border-b px-4 py-2 text-left">Maquinista</th>
                    <th className="border-b px-4 py-2 text-left">Ayudante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parejasReg.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-2 font-bold text-azul">{p.orden}</td>
                      <td className="px-4 py-2">{p.maquinista_nombre || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2">{p.ayudante_nombre || <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-6 py-3 text-right">
              <button onClick={autoEmparejar} className="text-xs font-bold text-azul hover:underline">+ Emparejar tripulación sin pareja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE FERIADOS */}
      {showFeriados && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-azul/5 to-white px-6 py-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-azul" />
                <h3 className="font-bold text-azul">Feriados ({feriados.length})</h3>
              </div>
              <button onClick={() => setShowFeriados(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 bg-gray-50/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Agregar feriado</p>
              <div className="flex flex-wrap items-end gap-2">
                <input
                  type="date"
                  value={nuevoFeriado.fecha}
                  onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, fecha: e.target.value })}
                  className="rounded-lg border border-gray-300 p-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Nombre (opcional)"
                  value={nuevoFeriado.nombre}
                  onChange={(e) => setNuevoFeriado({ ...nuevoFeriado, nombre: e.target.value })}
                  className="flex-1 min-w-[140px] rounded-lg border border-gray-300 p-2 text-sm"
                />
                <button onClick={agregarFeriado} className="flex items-center gap-1.5 rounded-lg bg-azul px-3 py-2 text-sm font-bold text-white hover:bg-azul/90">
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">Los días marcados como feriado usan los turnos tipo <b>FER</b> al generar el gráfico.</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {feriados.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No hay feriados cargados.</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {feriados.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">{f.fecha}</td>
                        <td className="px-4 py-2 text-gray-800">{f.nombre || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => eliminarFeriado(f.id)} className="rounded-md p-1 text-gray-400 hover:bg-rojo/10 hover:text-rojo" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
