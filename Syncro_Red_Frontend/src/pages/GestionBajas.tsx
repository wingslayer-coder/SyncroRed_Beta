import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { UserMinus, Save, RefreshCw } from 'lucide-react';

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
  const [usuarios, setUsuarios] = useState<{ rut: string; nombre: string; apellido: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
