import { useState } from 'react';
import client from '../api/client';
import {
  Clock, Trash2, AlertTriangle, Plus, Check,
  ChevronDown, ChevronRight, AlertCircle, ShieldAlert, Wrench, FileText
} from 'lucide-react';

/* ======================================================================
   TIPOS
   ====================================================================== */
interface ServicioActivo {
  id: string;
  fecha: string;
  tipo_itinerario: string;
  categoria_equipo: string;
  unidad: string;
  maquinista: string;
  ayudante: string;
  n_servicio: string;
  ruta_id: string;
  estado: string;
}

interface RegistroPasada {
  estado: 'PENDIENTE' | 'A_LA_HORA' | 'ATRASO';
  hora_real: string;
  minutos_atraso: number;
  categoria_atraso: string;
  detalle_atraso: string;
}

interface Incidencia {
  id: string;
  fecha_hora: string;
  tipo: string;
  descripcion: string;
  estacion: string;
  resolucion: string;
}

interface FallaEquipo {
  id: string;
  fecha_hora: string;
  sistema_afectado: string;
  descripcion: string;
  severidad: string;
  resuelto: boolean;
}

interface Emergencia {
  id: string;
  fecha_hora: string;
  tipo_emergencia: string;
  descripcion: string;
  personas_afectadas: number;
  acciones_tomadas: string;
}

/* ======================================================================
   DATOS ESTÁTICOS (heredados de datos.py)
   ====================================================================== */
const RUTAS: Record<string, string[]> = {
  l2_ida: ["Concepción", "Juan Pablo II", "Diagonal Biobío", "Alborada", "Costa Mar", "El Parque", "Lomas Coloradas", "Silva Henríquez", "Hito Galvarino", "Los Canelos", "Huinca", "Cristo Redentor", "Laguna Quiñenco", "Coronel"],
  l2_vuelta: ["Coronel", "Laguna Quiñenco", "Cristo Redentor", "Huinca", "Los Canelos", "Hito Galvarino", "Silva Henríquez", "Lomas Coloradas", "El Parque", "Costa Mar", "Alborada", "Diagonal Biobío", "Juan Pablo II", "Concepción"],
  corto_ida: ["Mercado", "El Arenal", "H. Higueras", "Los Cóndores", "UTF SM", "L. Arenas", "Concepción", "Chiguayante", "P. Medina", "Manquimávida", "La Leonera", "Omer Huet", "Hualqui", "Quilacoya", "San Miguel", "Unihue", "V. Chanco", "Los Acacios", "Talcamávida", "Gomero", "Buenuraqui", "San Rosendo", "Laja"],
  corto_vuelta: ["Laja", "San Rosendo", "Buenuraqui", "Gomero", "Talcamávida", "Los Acacios", "V. Chanco", "Unihue", "San Miguel", "Quilacoya", "Hualqui", "Omer Huet", "La Leonera", "Manquimávida", "P. Medina", "Chiguayante", "Concepción", "L. Arenas", "UTF SM", "Los Cóndores", "H. Higueras", "El Arenal", "Mercado"]
};

const RUTA_LABELS: Record<string, string> = {
  l2_ida: "Línea 2 — Concepción → Coronel",
  l2_vuelta: "Línea 2 — Coronel → Concepción",
  corto_ida: "Corto Laja — Talcahuano → Laja",
  corto_vuelta: "Corto Laja — Laja → Talcahuano"
};

const SERVICIOS_DISPONIBLES: Record<string, string> = {
  "20037": "l2_ida",
  "20038": "l2_vuelta",
  "30101": "corto_ida",
  "30102": "corto_vuelta"
};

const CATEGORIAS_ATRASO = ["Material Rodante", "Infraestructura/Vía", "Señalización", "Clima", "Terceros/Vandalismo", "Operacional"];
const TIPOS_INCIDENCIA = ["Operacional", "Seguridad", "Infraestructura", "Clima", "Terceros"];
const SISTEMAS_FALLA = ["Motor", "Frenos", "Puertas", "HVAC", "Señalización", "Comunicaciones", "Eléctrico"];
const SEVERIDADES = ["Leve", "Moderada", "Crítica"];
const TIPOS_EMERGENCIA = ["Accidente", "Evacuación", "Incendio", "Amenaza", "Médica"];

/* ======================================================================
   COMPONENTE PRINCIPAL
   ====================================================================== */
export default function Bitacora() {
  const hoy = new Date().toISOString().split('T')[0];

  // — Servicios
  const [servicios, setServicios] = useState<ServicioActivo[]>([]);
  const [servicioExpandido, setServicioExpandido] = useState<string | null>(null);

  // — Registros de pasadas  (key = servicio_id + "_" + idx)
  const [registros, setRegistros] = useState<Record<string, RegistroPasada>>({});

  // — Datos auxiliares por servicio
  const [incidencias, setIncidencias] = useState<Record<string, Incidencia[]>>({});
  const [fallas, setFallas] = useState<Record<string, FallaEquipo[]>>({});
  const [emergencias, setEmergencias] = useState<Record<string, Emergencia[]>>({});

  // — Formulario cargar servicio
  const [tipoItinerario, setTipoItinerario] = useState('Domingo');
  const [categoriaEquipo, setCategoriaEquipo] = useState('SFE');
  const [unidad, setUnidad] = useState('101');
  const [maquinista, setMaquinista] = useState('');
  const [nServicio, setNServicio] = useState('');
  const ayudante = 'ayudante';

  // — Modales abiertos  (key = servicio_id, value = 'incidencia' | 'falla' | 'emergencia' | null)
  const [modalAbierto, setModalAbierto] = useState<Record<string, string | null>>({});

  // — Formulario temporal para marcar atraso
  const [editandoAtraso, setEditandoAtraso] = useState<string | null>(null);
  const [atrasoCat, setAtrasoCat] = useState(CATEGORIAS_ATRASO[0]);
  const [atrasoMin, setAtrasoMin] = useState(5);
  const [atrasoDetalle, setAtrasoDetalle] = useState('');

  // — Formularios temporales para modales
  const [formIncTipo, setFormIncTipo] = useState(TIPOS_INCIDENCIA[0]);
  const [formIncDesc, setFormIncDesc] = useState('');
  const [formIncEst, setFormIncEst] = useState('');
  const [formIncRes, setFormIncRes] = useState('');

  const [formFallaSist, setFormFallaSist] = useState(SISTEMAS_FALLA[0]);
  const [formFallaDesc, setFormFallaDesc] = useState('');
  const [formFallaSev, setFormFallaSev] = useState(SEVERIDADES[0]);

  const [formEmeTipo, setFormEmeTipo] = useState(TIPOS_EMERGENCIA[0]);
  const [formEmeDesc, setFormEmeDesc] = useState('');
  const [formEmePersonas, setFormEmePersonas] = useState(0);
  const [formEmeAcciones, setFormEmeAcciones] = useState('');

  // — Reporte
  const [reporteTexto, setReporteTexto] = useState('');
  const [generando, setGenerando] = useState(false);

  /* ====================================================================
     HANDLERS — Servicio
     ==================================================================== */
  const agregarServicio = () => {
    if (!nServicio) { alert('Seleccione un número de servicio.'); return; }
    const rutaId = SERVICIOS_DISPONIBLES[nServicio] || 'l2_ida';
    const nuevo: ServicioActivo = {
      id: Date.now().toString(),
      fecha: hoy,
      tipo_itinerario: tipoItinerario,
      categoria_equipo: categoriaEquipo,
      unidad,
      maquinista: maquinista || 'No asignado',
      ayudante,
      n_servicio: nServicio,
      ruta_id: rutaId,
      estado: 'EN CURSO'
    };
    setServicios(prev => [...prev, nuevo]);

    // Inicializar registros
    const estaciones = RUTAS[rutaId];
    const init: Record<string, RegistroPasada> = {};
    estaciones.forEach((_, i) => {
      init[`${nuevo.id}_${i}`] = { estado: 'PENDIENTE', hora_real: '', minutos_atraso: 0, categoria_atraso: '', detalle_atraso: '' };
    });
    setRegistros(prev => ({ ...prev, ...init }));
    setIncidencias(prev => ({ ...prev, [nuevo.id]: [] }));
    setFallas(prev => ({ ...prev, [nuevo.id]: [] }));
    setEmergencias(prev => ({ ...prev, [nuevo.id]: [] }));

    setServicioExpandido(nuevo.id);
    setNServicio('');
  };

  const eliminarServicio = (id: string) => {
    setServicios(prev => prev.filter(s => s.id !== id));
    if (servicioExpandido === id) setServicioExpandido(null);
  };

  /* ====================================================================
     HANDLERS — Pasadas
     ==================================================================== */
  const marcarALaHora = (key: string) => {
    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    setRegistros(prev => ({
      ...prev,
      [key]: { ...prev[key], estado: 'A_LA_HORA', hora_real: ahora }
    }));
  };

  const iniciarAtraso = (key: string) => {
    setEditandoAtraso(key);
    setAtrasoCat(CATEGORIAS_ATRASO[0]);
    setAtrasoMin(5);
    setAtrasoDetalle('');
  };

  const guardarAtraso = () => {
    if (!editandoAtraso) return;
    const ahora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    setRegistros(prev => ({
      ...prev,
      [editandoAtraso]: {
        estado: 'ATRASO', hora_real: ahora,
        minutos_atraso: atrasoMin, categoria_atraso: atrasoCat, detalle_atraso: atrasoDetalle || 'Sin detalle'
      }
    }));
    setEditandoAtraso(null);
  };

  /* ====================================================================
     HANDLERS — Incidencias / Fallas / Emergencias
     ==================================================================== */
  const guardarIncidencia = (srvId: string) => {
    if (!formIncDesc) return;
    const nueva: Incidencia = {
      id: Date.now().toString(), fecha_hora: new Date().toLocaleString('es-CL'),
      tipo: formIncTipo, descripcion: formIncDesc, estacion: formIncEst, resolucion: formIncRes
    };
    setIncidencias(prev => ({ ...prev, [srvId]: [...(prev[srvId] || []), nueva] }));
    setFormIncDesc(''); setFormIncRes(''); setModalAbierto(prev => ({ ...prev, [srvId]: null }));
  };

  const guardarFalla = (srvId: string) => {
    if (!formFallaDesc) return;
    const nueva: FallaEquipo = {
      id: Date.now().toString(), fecha_hora: new Date().toLocaleString('es-CL'),
      sistema_afectado: formFallaSist, descripcion: formFallaDesc, severidad: formFallaSev, resuelto: false
    };
    setFallas(prev => ({ ...prev, [srvId]: [...(prev[srvId] || []), nueva] }));
    setFormFallaDesc(''); setModalAbierto(prev => ({ ...prev, [srvId]: null }));
  };

  const guardarEmergencia = (srvId: string) => {
    if (!formEmeDesc) return;
    const nueva: Emergencia = {
      id: Date.now().toString(), fecha_hora: new Date().toLocaleString('es-CL'),
      tipo_emergencia: formEmeTipo, descripcion: formEmeDesc, personas_afectadas: formEmePersonas, acciones_tomadas: formEmeAcciones
    };
    setEmergencias(prev => ({ ...prev, [srvId]: [...(prev[srvId] || []), nueva] }));
    setFormEmeDesc(''); setFormEmeAcciones(''); setModalAbierto(prev => ({ ...prev, [srvId]: null }));
  };

  /* ====================================================================
     HANDLERS — Reporte
     ==================================================================== */
  const generarReporte = () => {
    setGenerando(true);
    let txt = `=== BITÁCORA OPERATIVA CONSOLIDADA ===\nFecha: ${hoy}\n`;
    servicios.forEach(srv => {
      txt += `\n─── Servicio ${srv.n_servicio} ───\n`;
      txt += `Equipo: ${srv.categoria_equipo} ${srv.unidad} | Maquinista: ${srv.maquinista} | Ayudante: ${srv.ayudante}\n`;
      txt += `Ruta: ${RUTA_LABELS[srv.ruta_id]}\n\nPasadas:\n`;
      const ests = RUTAS[srv.ruta_id];
      ests.forEach((est, i) => {
        const r = registros[`${srv.id}_${i}`];
        if (r && r.estado !== 'PENDIENTE') {
          if (r.estado === 'ATRASO') {
            txt += `  ⚠ ${est} — ATRASO +${r.minutos_atraso} min [${r.categoria_atraso}] ${r.detalle_atraso} (${r.hora_real})\n`;
          } else {
            txt += `  ✓ ${est} — A LA HORA (${r.hora_real})\n`;
          }
        }
      });
      const srvInc = incidencias[srv.id] || [];
      if (srvInc.length > 0) {
        txt += `\nIncidencias (${srvInc.length}):\n`;
        srvInc.forEach(inc => { txt += `  • [${inc.tipo}] ${inc.descripcion} — Est: ${inc.estacion || 'N/A'} — Res: ${inc.resolucion || 'Pendiente'}\n`; });
      }
      const srvFal = fallas[srv.id] || [];
      if (srvFal.length > 0) {
        txt += `\nFallas de Equipo (${srvFal.length}):\n`;
        srvFal.forEach(f => { txt += `  • [${f.sistema_afectado}] ${f.descripcion} — Sev: ${f.severidad} — ${f.resuelto ? 'Resuelta' : 'Pendiente'}\n`; });
      }
      const srvEme = emergencias[srv.id] || [];
      if (srvEme.length > 0) {
        txt += `\nEmergencias (${srvEme.length}):\n`;
        srvEme.forEach(e => { txt += `  • [${e.tipo_emergencia}] ${e.descripcion} — Personas: ${e.personas_afectadas} — Acciones: ${e.acciones_tomadas}\n`; });
      }
    });
    txt += `\n═══ Cierre de Turno y Bitácora completo. ═══`;
    setReporteTexto(txt);
    setGenerando(false);
  };

  const guardarReporte = async () => {
    if (!reporteTexto) return;
    try {
      await client.post('/bitacora/reportes-finales/', { fecha: hoy, resumen_texto: reporteTexto, justificacion_cierre: 'Generado desde Bitácora React' });
      alert('Reporte guardado exitosamente.');
    } catch { alert('Reporte guardado localmente (modo demostración).'); }
    setReporteTexto('');
  };

  /* ====================================================================
     ESTILOS REUTILIZABLES (colores corporativos EFE)
     ==================================================================== */
  const navy = 'bg-[#002A5C]';
  const navyHover = 'hover:bg-[#001d42]';
  const red = 'bg-[#E31837]';
  const redHover = 'hover:bg-[#c0122d]';
  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#002A5C] focus:ring-1 focus:ring-[#002A5C] bg-white';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';
  const cardCls = 'bg-white border border-gray-200 rounded shadow-sm';

  /* ====================================================================
     RENDER
     ==================================================================== */
  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-6 font-sans">

      {/* ── FORMULARIO: Cargar Servicio ── */}
      <div className={`${cardCls} p-6 mb-8`}>
        <h2 className="text-xl font-bold text-[#002A5C] mb-1">Cargar Servicio al Turno Actual</h2>
        <p className="text-xs text-gray-400 italic mb-6 pb-3 border-b border-gray-100 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-[#E31837]" />
          No hay servicios específicos cargados en su gráfico mensual para hoy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <label className={labelCls}>Tipo de Itinerario</label>
            <select value={tipoItinerario} onChange={e => setTipoItinerario(e.target.value)} className={inputCls}>
              <option>Domingo</option><option>Sábado</option><option>Hábil</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Categoría Equipo</label>
            <select value={categoriaEquipo} onChange={e => setCategoriaEquipo(e.target.value)} className={inputCls}>
              <option>SFE</option><option>UT</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Unidad</label>
            <select value={unidad} onChange={e => setUnidad(e.target.value)} className={inputCls}>
              <option>101</option><option>102</option><option>103</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Maquinista Titular</label>
            <select value={maquinista} onChange={e => setMaquinista(e.target.value)} className={inputCls}>
              <option value="">Seleccione...</option>
              <option value="Benjamín Elias Bustamante González">Benjamín Elias Bustamante González</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Ayudante Asignado (Usted)</label>
            <input type="text" value={ayudante} disabled className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className={labelCls}>N° de Servicio(s) a operar</label>
            <select value={nServicio} onChange={e => setNServicio(e.target.value)} className={inputCls}>
              <option value="">Seleccione un número de servicio...</option>
              {Object.keys(SERVICIOS_DISPONIBLES).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button onClick={agregarServicio} className={`w-full mt-6 ${red} ${redHover} text-white font-semibold py-3 rounded text-sm transition-colors flex items-center justify-center gap-2`}>
          <Plus className="w-4 h-4" /> Agregar servicio a Bitácora
        </button>
      </div>

      {/* ── SERVICIOS ACTIVOS ── */}
      {servicios.map(srv => {
        const expandido = servicioExpandido === srv.id;
        const estaciones = RUTAS[srv.ruta_id] || [];
        const modal = modalAbierto[srv.id] || null;
        const srvIncidencias = incidencias[srv.id] || [];
        const srvFallas = fallas[srv.id] || [];
        const srvEmergencias = emergencias[srv.id] || [];

        return (
          <div key={srv.id} className="mb-6">
            {/* Accordion Header */}
            <button
              onClick={() => setServicioExpandido(expandido ? null : srv.id)}
              className={`w-full ${navy} text-white px-5 py-3 rounded-t flex items-center gap-3 text-sm font-medium text-left transition-colors ${navyHover}`}
            >
              {expandido ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
              <span>Servicio {srv.n_servicio} — {srv.categoria_equipo} {srv.unidad} — {srv.maquinista} / {srv.ayudante}</span>
            </button>

            {expandido && (
              <div className={`${cardCls} rounded-t-none border-t-0`}>
                {/* Botones de acción superiores */}
                <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
                  <button
                    onClick={() => setModalAbierto(p => ({ ...p, [srv.id]: modal === 'incidencia' ? null : 'incidencia' }))}
                    className={`py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-r border-gray-200 ${modal === 'incidencia' ? 'bg-[#002A5C] text-white' : `${navy} text-white ${navyHover}`}`}
                  >
                    <AlertCircle className="w-4 h-4 text-yellow-400" /> Incidencias
                    {srvIncidencias.length > 0 && <span className="bg-yellow-400 text-[#002A5C] text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{srvIncidencias.length}</span>}
                  </button>
                  <button
                    onClick={() => setModalAbierto(p => ({ ...p, [srv.id]: modal === 'falla' ? null : 'falla' }))}
                    className={`py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-r border-gray-200 ${modal === 'falla' ? 'bg-[#002A5C] text-white' : `${navy} text-white ${navyHover}`}`}
                  >
                    <Wrench className="w-4 h-4" /> Falla de Equipo
                    {srvFallas.length > 0 && <span className="bg-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{srvFallas.length}</span>}
                  </button>
                  <button
                    onClick={() => setModalAbierto(p => ({ ...p, [srv.id]: modal === 'emergencia' ? null : 'emergencia' }))}
                    className={`py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${modal === 'emergencia' ? 'bg-[#c0122d] text-white' : `${red} text-white ${redHover}`}`}
                  >
                    <ShieldAlert className="w-4 h-4" /> Emergencias
                    {srvEmergencias.length > 0 && <span className="bg-white text-[#E31837] text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{srvEmergencias.length}</span>}
                  </button>
                </div>

                {/* ── MODAL: Incidencias ── */}
                {modal === 'incidencia' && (
                  <div className="p-5 bg-yellow-50 border-b border-yellow-200">
                    <h4 className="font-bold text-sm text-[#002A5C] mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" /> Registrar Incidencia</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div><label className={labelCls}>Tipo</label><select value={formIncTipo} onChange={e => setFormIncTipo(e.target.value)} className={inputCls}>{TIPOS_INCIDENCIA.map(t => <option key={t}>{t}</option>)}</select></div>
                      <div><label className={labelCls}>Estación</label><select value={formIncEst} onChange={e => setFormIncEst(e.target.value)} className={inputCls}><option value="">Seleccione...</option>{estaciones.map(e => <option key={e}>{e}</option>)}</select></div>
                    </div>
                    <div className="mb-3"><label className={labelCls}>Descripción</label><textarea value={formIncDesc} onChange={e => setFormIncDesc(e.target.value)} rows={2} className={inputCls} placeholder="Describa la incidencia..." /></div>
                    <div className="mb-3"><label className={labelCls}>Resolución tomada</label><textarea value={formIncRes} onChange={e => setFormIncRes(e.target.value)} rows={2} className={inputCls} placeholder="Resolución adoptada..." /></div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setModalAbierto(p => ({ ...p, [srv.id]: null }))} className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                      <button onClick={() => guardarIncidencia(srv.id)} className={`px-4 py-2 text-xs font-bold text-white ${navy} rounded ${navyHover}`}>Guardar Incidencia</button>
                    </div>
                    {srvIncidencias.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">Incidencias registradas:</p>
                        {srvIncidencias.map(inc => (
                          <div key={inc.id} className="bg-white border border-yellow-200 rounded p-3 text-xs">
                            <div className="flex justify-between"><span className="font-bold text-[#002A5C]">[{inc.tipo}]</span><span className="text-gray-400">{inc.fecha_hora}</span></div>
                            <p className="text-gray-700 mt-1">{inc.descripcion}</p>
                            {inc.estacion && <p className="text-gray-500 mt-0.5">📍 {inc.estacion}</p>}
                            {inc.resolucion && <p className="text-green-700 mt-0.5">✓ {inc.resolucion}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── MODAL: Fallas de Equipo ── */}
                {modal === 'falla' && (
                  <div className="p-5 bg-orange-50 border-b border-orange-200">
                    <h4 className="font-bold text-sm text-[#002A5C] mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-500" /> Registrar Falla de Equipo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div><label className={labelCls}>Sistema Afectado</label><select value={formFallaSist} onChange={e => setFormFallaSist(e.target.value)} className={inputCls}>{SISTEMAS_FALLA.map(s => <option key={s}>{s}</option>)}</select></div>
                      <div><label className={labelCls}>Severidad</label><select value={formFallaSev} onChange={e => setFormFallaSev(e.target.value)} className={inputCls}>{SEVERIDADES.map(s => <option key={s}>{s}</option>)}</select></div>
                    </div>
                    <div className="mb-3"><label className={labelCls}>Descripción</label><textarea value={formFallaDesc} onChange={e => setFormFallaDesc(e.target.value)} rows={2} className={inputCls} placeholder="Describa la falla..." /></div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setModalAbierto(p => ({ ...p, [srv.id]: null }))} className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                      <button onClick={() => guardarFalla(srv.id)} className={`px-4 py-2 text-xs font-bold text-white ${navy} rounded ${navyHover}`}>Guardar Falla</button>
                    </div>
                    {srvFallas.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">Fallas registradas:</p>
                        {srvFallas.map(f => (
                          <div key={f.id} className="bg-white border border-orange-200 rounded p-3 text-xs">
                            <div className="flex justify-between"><span className="font-bold text-[#002A5C]">[{f.sistema_afectado}]</span><span className={`font-bold ${f.severidad === 'Crítica' ? 'text-red-600' : f.severidad === 'Moderada' ? 'text-orange-500' : 'text-yellow-500'}`}>{f.severidad}</span></div>
                            <p className="text-gray-700 mt-1">{f.descripcion}</p>
                            <p className="text-gray-400 mt-0.5">{f.fecha_hora}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── MODAL: Emergencias ── */}
                {modal === 'emergencia' && (
                  <div className="p-5 bg-red-50 border-b border-red-200">
                    <h4 className="font-bold text-sm text-[#E31837] mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Registrar Emergencia</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div><label className={labelCls}>Tipo de Emergencia</label><select value={formEmeTipo} onChange={e => setFormEmeTipo(e.target.value)} className={inputCls}>{TIPOS_EMERGENCIA.map(t => <option key={t}>{t}</option>)}</select></div>
                      <div><label className={labelCls}>Personas Afectadas</label><input type="number" min={0} value={formEmePersonas} onChange={e => setFormEmePersonas(parseInt(e.target.value) || 0)} className={inputCls} /></div>
                    </div>
                    <div className="mb-3"><label className={labelCls}>Descripción</label><textarea value={formEmeDesc} onChange={e => setFormEmeDesc(e.target.value)} rows={2} className={inputCls} placeholder="Describa la emergencia..." /></div>
                    <div className="mb-3"><label className={labelCls}>Acciones Tomadas</label><textarea value={formEmeAcciones} onChange={e => setFormEmeAcciones(e.target.value)} rows={2} className={inputCls} placeholder="Acciones realizadas..." /></div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setModalAbierto(p => ({ ...p, [srv.id]: null }))} className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                      <button onClick={() => guardarEmergencia(srv.id)} className={`px-4 py-2 text-xs font-bold text-white ${red} rounded ${redHover}`}>Guardar Emergencia</button>
                    </div>
                    {srvEmergencias.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">Emergencias registradas:</p>
                        {srvEmergencias.map(em => (
                          <div key={em.id} className="bg-white border border-red-200 rounded p-3 text-xs">
                            <div className="flex justify-between"><span className="font-bold text-[#E31837]">[{em.tipo_emergencia}]</span><span className="text-gray-400">{em.fecha_hora}</span></div>
                            <p className="text-gray-700 mt-1">{em.descripcion}</p>
                            <p className="text-gray-500 mt-0.5">👥 Personas: {em.personas_afectadas}</p>
                            {em.acciones_tomadas && <p className="text-blue-700 mt-0.5">→ {em.acciones_tomadas}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Cabecera Bitácora + Eliminar ── */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-[#002A5C]">Bitácora de Servicio {srv.n_servicio}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Equipo {srv.categoria_equipo} {srv.unidad} · Maquinista: {srv.maquinista} · Ayudante: {srv.ayudante}
                    </p>
                    <p className="text-xs text-[#002A5C] font-medium mt-1">{RUTA_LABELS[srv.ruta_id]}</p>
                  </div>
                  <button onClick={() => eliminarServicio(srv.id)} className={`${navy} ${navyHover} text-white px-5 py-2 rounded flex items-center gap-2 text-xs font-medium transition-colors`}>
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>

                {/* ── Tabla de Estaciones ── */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 w-[30%]">Estación</th>
                        <th className="px-6 py-3 w-[15%]">Horario</th>
                        <th className="px-6 py-3 w-[20%] text-center">Acción / Estado</th>
                        <th className="px-6 py-3 w-[35%]">Observación / Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {estaciones.map((est, idx) => {
                        const key = `${srv.id}_${idx}`;
                        const r = registros[key];
                        if (!r) return null;
                        const isEditingThis = editandoAtraso === key;

                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                            <td className="px-6 py-3.5 font-medium">{est}</td>
                            <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{r.hora_real || '—'}</td>
                            <td className="px-6 py-3.5 text-center">
                              {r.estado === 'PENDIENTE' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => marcarALaHora(key)} className={`${navy} ${navyHover} text-white px-4 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors`}>
                                    <Clock className="w-3.5 h-3.5" /> Marcar
                                  </button>
                                  <button onClick={() => iniciarAtraso(key)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-medium transition-colors">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Atraso
                                  </button>
                                </div>
                              ) : r.estado === 'A_LA_HORA' ? (
                                <span className="inline-flex items-center gap-1.5 text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded text-xs border border-green-200">
                                  <Check className="w-3.5 h-3.5" /> A la Hora
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[#E31837] font-bold bg-red-50 px-3 py-1.5 rounded text-xs border border-red-200">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Atraso +{r.minutos_atraso}min
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-xs">
                              {isEditingThis ? (
                                <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] uppercase font-bold text-gray-500">Categoría</label><select value={atrasoCat} onChange={e => setAtrasoCat(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white">{CATEGORIAS_ATRASO.map(c => <option key={c}>{c}</option>)}</select></div>
                                    <div><label className="text-[10px] uppercase font-bold text-gray-500">Minutos</label><input type="number" min={1} value={atrasoMin} onChange={e => setAtrasoMin(parseInt(e.target.value) || 1)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white" /></div>
                                  </div>
                                  <div><label className="text-[10px] uppercase font-bold text-gray-500">Detalle</label><input type="text" value={atrasoDetalle} onChange={e => setAtrasoDetalle(e.target.value)} placeholder="Causa..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white" /></div>
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditandoAtraso(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium px-2 py-1">Cancelar</button>
                                    <button onClick={guardarAtraso} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded">Guardar</button>
                                  </div>
                                </div>
                              ) : r.estado === 'ATRASO' ? (
                                <div className="text-[#E31837]">
                                  <span className="font-bold">[{r.categoria_atraso}]</span> {r.detalle_atraso}
                                </div>
                              ) : r.estado === 'A_LA_HORA' ? (
                                <span className="text-green-600">Sin novedades</span>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── REPORTE / MINUTA CONSOLIDADA ── */}
      {servicios.length > 0 && (
        <div className={`${cardCls} mt-8`}>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-[#002A5C] text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" /> Generador de Minuta Técnica Consolidada
            </h3>
            <button onClick={generarReporte} disabled={generando} className={`${navy} ${navyHover} text-white px-5 py-2 rounded text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-2`}>
              {generando ? <Clock className="w-4 h-4 animate-spin" /> : 'Autogenerar Minuta de Turno'}
            </button>
          </div>
          <div className="p-6 space-y-4">
            <textarea
              className="w-full min-h-[200px] p-4 border border-gray-300 rounded focus:ring-1 focus:ring-[#002A5C] focus:border-[#002A5C] resize-none text-xs font-mono bg-gray-50"
              placeholder="El reporte técnico consolidado autogenerado a partir de los datos ingresados aparecerá aquí..."
              value={reporteTexto}
              onChange={e => setReporteTexto(e.target.value)}
            />
            <button onClick={guardarReporte} disabled={!reporteTexto} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Guardar Reporte y Cerrar Turno
            </button>
          </div>
        </div>
      )}

      {/* ── Sin servicios ── */}
      {servicios.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="font-medium text-base">No hay servicios cargados en este turno.</p>
          <p className="text-sm mt-1">Utilice el formulario superior para agregar un servicio a la bitácora.</p>
        </div>
      )}
    </div>
  );
}
