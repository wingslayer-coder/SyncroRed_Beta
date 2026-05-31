import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserMinus, Save, Calendar as  RefreshCw } from 'lucide-react';

interface Ausencia {
  id?: number;
  fecha: string;
  rut: string;
  tipo: string;
  motivo: string;
  dias: number;
  registrado_por: string;
}

export default function GestionBajas() {
  const { user } = useAuth();
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [usuarios, setUsuarios] = useState<{rut: string, nombre: string, apellido: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Ausencia>({
    fecha: hoy,
    rut: '',
    tipo: 'LICENCIA',
    motivo: '',
    dias: 1,
    registrado_por: `${user?.nombre} ${user?.apellido}`
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resAus, resUsu] = await Promise.all([
        client.get('/usuarios/ausencias/'),
        client.get('/usuarios/usuarios/')
      ]);
      setAusencias(resAus.data.results || resAus.data);
      setUsuarios(resUsu.data.results || resUsu.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rut) return alert('Seleccione un trabajador');
    setSaving(true);
    try {
      await client.post('/usuarios/ausencias/', form);
      alert('Ausencia registrada exitosamente');
      cargarDatos();
      setForm({ ...form, rut: '', motivo: '', dias: 1 });
    } catch (err) {
      console.error(err);
      alert('Error al registrar ausencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <UserMinus className="w-6 h-6 text-rojo" />
          Gestión de Bajas y Licencias
        </h2>
        <button onClick={cargarDatos} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md transition-colors">
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-1 h-fit">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-700">Nueva Ausencia</h3>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Trabajador</label>
              <select 
                value={form.rut} 
                onChange={(e) => setForm({...form, rut: e.target.value})}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul text-sm"
              >
                <option value="">Seleccione trabajador...</option>
                {usuarios.map(u => (
                  <option key={u.rut} value={u.rut}>{u.nombre} {u.apellido} ({u.rut})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Fecha Inicial</label>
              <input 
                type="date" 
                value={form.fecha} 
                onChange={(e) => setForm({...form, fecha: e.target.value})}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                <select 
                  value={form.tipo} 
                  onChange={(e) => setForm({...form, tipo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul text-sm"
                >
                  <option value="LICENCIA">Licencia</option>
                  <option value="PERMISO">Permiso</option>
                  <option value="BAJA">Baja Médica</option>
                  <option value="VACACIONES">Vacaciones</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Días</label>
                <input 
                  type="number" 
                  min="1" 
                  value={form.dias} 
                  onChange={(e) => setForm({...form, dias: parseInt(e.target.value)})}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Motivo / Observación</label>
              <textarea 
                value={form.motivo} 
                onChange={(e) => setForm({...form, motivo: e.target.value})}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-azul text-sm"
                placeholder="Detalle de la ausencia..."
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-verde text-white py-2 rounded-lg font-bold hover:bg-verde/90 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Registrar Ausencia'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-700">Registro Histórico de Ausencias</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Cargando registros...</div>
            ) : ausencias.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay ausencias registradas.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left border-b">Fecha</th>
                    <th className="px-4 py-3 text-left border-b">Trabajador</th>
                    <th className="px-4 py-3 text-left border-b">Tipo</th>
                    <th className="px-4 py-3 text-left border-b">Días</th>
                    <th className="px-4 py-3 text-left border-b">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ausencias.map(a => {
                    const usr = typeof a.rut === 'object' ? a.rut as any : usuarios.find(u => u.rut === a.rut);
                    const usrName = usr ? `${usr.nombre} ${usr.apellido}` : a.rut;
                    
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{a.fecha}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{usrName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                            a.tipo === 'VACACIONES' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            a.tipo === 'LICENCIA' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {a.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-center">{a.dias}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-xs" title={a.motivo}>
                          {a.motivo || '-'}
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
    </div>
  );
}
