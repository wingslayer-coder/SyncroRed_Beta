import { useState, useEffect } from 'react';
import client from '../api/client';
import { Users, Search, Shield, Train, Wrench } from 'lucide-react';

interface Usuario {
  rut: string;
  nombre: string;
  apellido: string;
  cargo: string;
  is_active: boolean;
}

export default function PersonalOperativo() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCargo, setFiltroCargo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await client.get('/usuarios/usuarios/');
      setUsuarios(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCargoIcon = (cargo: string) => {
    const c = cargo.toUpperCase();
    if (c.includes('ADMIN') || c.includes('JEFE') || c.includes('GERENTE')) return <Shield className="w-4 h-4 text-purple-500" />;
    if (c.includes('MAQUINISTA')) return <Train className="w-4 h-4 text-azul" />;
    if (c.includes('AYUDANTE')) return <Wrench className="w-4 h-4 text-orange-500" />;
    return <Users className="w-4 h-4 text-gray-500" />;
  };

  const filtrados = usuarios.filter(u => {
    const matchCargo = filtroCargo === 'TODOS' || u.cargo.toUpperCase().includes(filtroCargo);
    const matchBusqueda = (u.nombre + ' ' + u.apellido + ' ' + u.rut).toLowerCase().includes(busqueda.toLowerCase());
    return matchCargo && matchBusqueda;
  });

  const stats = {
    total: usuarios.length,
    maquinistas: usuarios.filter(u => u.cargo.toUpperCase().includes('MAQUINISTA')).length,
    ayudantes: usuarios.filter(u => u.cargo.toUpperCase().includes('AYUDANTE')).length,
    jefaturas: usuarios.filter(u => u.cargo.toUpperCase().includes('JEFE')).length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-azul flex items-center gap-2">
          <Users className="w-6 h-6 text-rojo" />
          Personal Operativo
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-azul"
            />
          </div>
          <select 
            value={filtroCargo} 
            onChange={(e) => setFiltroCargo(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-azul"
          >
            <option value="TODOS">Todos los Cargos</option>
            <option value="MAQUINISTA">Maquinistas</option>
            <option value="AYUDANTE">Ayudantes</option>
            <option value="JEFE">Jefaturas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
          <span className="text-xs text-gray-500 font-medium uppercase">Personal Total</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-3xl font-bold text-azul">{stats.maquinistas}</span>
          <span className="text-xs text-gray-500 font-medium uppercase">Maquinistas</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-3xl font-bold text-orange-500">{stats.ayudantes}</span>
          <span className="text-xs text-gray-500 font-medium uppercase">Ayudantes</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-3xl font-bold text-purple-500">{stats.jefaturas}</span>
          <span className="text-xs text-gray-500 font-medium uppercase">Jefaturas</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-200">
          Cargando personal...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(u => (
            <div key={u.rut} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg flex-shrink-0">
                {u.nombre.charAt(0)}{u.apellido.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 leading-tight">
                  {u.nombre} {u.apellido}
                </h3>
                <div className="text-xs text-gray-500 font-mono mt-1 mb-2">{u.rut}</div>
                <div className="flex items-center gap-1 text-xs font-bold bg-gray-50 text-gray-600 px-2 py-1 rounded w-fit border border-gray-100">
                  {getCargoIcon(u.cargo)} {u.cargo}
                </div>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              No se encontró personal coincidente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
