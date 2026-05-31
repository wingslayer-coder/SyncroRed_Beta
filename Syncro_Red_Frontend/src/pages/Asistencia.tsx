import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Clock, Save, UserCheck } from 'lucide-react';

interface RegistroOperativo {
  id?: number;
  fecha: string;
  rut_trabajador: string;
  lugar_apertura: string;
  hora_apertura: string;
  inicio_servicio: string;
  hora_cierre: string;
  horas_extras: number;
  horas_menos_reposo: number;
  horas_nocturnas: number;
  horas_manejo: number;
  estado: string;
  observacion_il: string;
}

export default function Asistencia() {
  const { user } = useAuth();
  const hoy = new Date().toISOString().split('T')[0];
  
  const [registro, setRegistro] = useState<RegistroOperativo>({
    fecha: hoy,
    rut_trabajador: user?.rut || '',
    lugar_apertura: '',
    hora_apertura: '',
    inicio_servicio: '',
    hora_cierre: '',
    horas_extras: 0,
    horas_menos_reposo: 0,
    horas_nocturnas: 0,
    horas_manejo: 0,
    estado: 'PENDIENTE',
    observacion_il: ''
  });
  const [loading, setLoading] = useState(false);
  const [existe, setExiste] = useState(false);

  useEffect(() => {
    if (user?.rut) {
      cargarRegistro();
    }
  }, [user]);

  const cargarRegistro = async () => {
    try {
      const res = await client.get(`/usuarios/registros-operativos/?fecha=${hoy}&rut_trabajador=${user?.rut}`);
      if (res.data.results && res.data.results.length > 0) {
        setRegistro(res.data.results[0]);
        setExiste(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (existe && registro.id) {
        await client.put(`/usuarios/registros-operativos/${registro.id}/`, registro);
        alert('Registro actualizado correctamente');
      } else {
        const res = await client.post('/usuarios/registros-operativos/', registro);
        setRegistro(res.data);
        setExiste(true);
        alert('Turno abierto exitosamente');
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRegistro({ ...registro, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-rojo" />
          Control de Asistencia y Alistación
        </h2>
        <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
          Fecha: {hoy}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Apertura y Cierre de Turno
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Trabajador</label>
              <div className="p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700 font-medium">
                {user?.nombre} {user?.apellido} ({user?.cargo})
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Lugar de Apertura</label>
              <input 
                type="text" name="lugar_apertura" value={registro.lugar_apertura} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul focus:border-azul"
                placeholder="Ej. Concepción"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Estado Turno</label>
              <select name="estado" value={registro.estado} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul focus:border-azul"
              >
                <option value="PENDIENTE">PENDIENTE (Abierto)</option>
                <option value="CONFIRMADO">CONFIRMADO (Cerrado)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Hora Presentación</label>
              <input type="time" name="hora_apertura" value={registro.hora_apertura} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Inicio Servicio</label>
              <input type="time" name="inicio_servicio" value={registro.inicio_servicio} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Hora Cierre</label>
              <input type="time" name="hora_cierre" value={registro.hora_cierre} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase">Horas Calculadas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Horas Extras</label>
                <input type="number" step="0.1" name="horas_extras" value={registro.horas_extras} onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Horas Menos Rep.</label>
                <input type="number" step="0.1" name="horas_menos_reposo" value={registro.horas_menos_reposo} onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Horas Nocturnas</label>
                <input type="number" step="0.1" name="horas_nocturnas" value={registro.horas_nocturnas} onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Horas Manejo</label>
                <input type="number" step="0.1" name="horas_manejo" value={registro.horas_manejo} onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Observaciones del Inspector</label>
            <textarea name="observacion_il" value={registro.observacion_il} onChange={handleChange} rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul"
              placeholder="Novedades durante la alistación o cierre..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSave} disabled={loading}
              className="bg-verde text-white px-6 py-2 rounded-lg font-bold hover:bg-verde/90 transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? "Guardando..." : (existe ? "Actualizar Registro" : "Abrir Turno")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
