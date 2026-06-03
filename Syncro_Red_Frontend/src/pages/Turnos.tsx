import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Calendar, RefreshCw, Upload, Users } from 'lucide-react';

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

  useEffect(() => {
    cargarGraficos();
    cargarNombresUsuarios();
  }, [mes, anio]);

  const cargarGraficos = async () => {
    setLoading(true);
    try {
      const res = await client.get(`/operaciones/grafico-mensual/`);
      const all: GraficoMensual[] = res.data.results || res.data;
      const filtrados = all.filter((g) => {
        const date = new Date(g.fecha);
        return date.getMonth() + 1 === mes && date.getFullYear() === anio;
      });
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
            <button
              onClick={() => document.getElementById('upload-grafico')?.click()}
              disabled={uploading}
              className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              title="Subir gráfico (Excel)"
            >
              <Upload className={`h-5 w-5 text-azul ${uploading ? 'animate-pulse' : ''}`} />
            </button>
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
    </div>
  );
}
