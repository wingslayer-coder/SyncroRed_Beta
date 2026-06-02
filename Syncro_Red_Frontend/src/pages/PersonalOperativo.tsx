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
    if (c.includes('ADMIN') || c.includes('JEFE') || c.includes('GERENTE')) return <Shield className="h-4 w-4 text-purple-500" />;
    if (c.includes('MAQUINISTA')) return <Train className="h-4 w-4 text-azul" />;
    if (c.includes('AYUDANTE')) return <Wrench className="h-4 w-4 text-orange-500" />;
    return <Users className="h-4 w-4 text-gray-500" />;
  };

  const filtrados = usuarios.filter((u) => {
    const matchCargo = filtroCargo === 'TODOS' || u.cargo.toUpperCase().includes(filtroCargo);
    const matchBusqueda = (u.nombre + ' ' + u.apellido + ' ' + u.rut).toLowerCase().includes(busqueda.toLowerCase());
    return matchCargo && matchBusqueda;
  });

  const stats = {
    total: usuarios.length,
    maquinistas: usuarios.filter((u) => u.cargo.toUpperCase().includes('MAQUINISTA')).length,
    ayudantes: usuarios.filter((u) => u.cargo.toUpperCase().includes('AYUDANTE')).length,
    jefaturas: usuarios.filter((u) => u.cargo.toUpperCase().includes('JEFE')).length,
  };

  const tarjetasStats = [
    { label: 'Personal Total', value: stats.total, icon: Users, color: 'text-gray-800', accent: 'border-t-gray-300', tile: 'bg-gray-100 text-gray-500' },
    { label: 'Maquinistas', value: stats.maquinistas, icon: Train, color: 'text-azul', accent: 'border-t-azul', tile: 'bg-azul/10 text-azul' },
    { label: 'Ayudantes', value: stats.ayudantes, icon: Wrench, color: 'text-orange-500', accent: 'border-t-orange-400', tile: 'bg-orange-50 text-orange-500' },
    { label: 'Jefaturas', value: stats.jefaturas, icon: Shield, color: 'text-purple-500', accent: 'border-t-purple-400', tile: 'bg-purple-50 text-purple-500' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-azul/10">
            <Users className="h-6 w-6 text-rojo" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-azul leading-tight">Personal Operativo</h2>
            <p className="text-sm text-gray-400">Directorio de tripulación y jefaturas</p>
          </div>
        </div>

        <div className="flex w-full gap-2 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
            />
          </div>
          <select
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-azul focus:ring-2 focus:ring-azul/30"
          >
            <option value="TODOS">Todos los Cargos</option>
            <option value="MAQUINISTA">Maquinistas</option>
            <option value="AYUDANTE">Ayudantes</option>
            <option value="JEFE">Jefaturas</option>
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tarjetasStats.map((s) => {
          const Icono = s.icon;
          return (
            <div
              key={s.label}
              className={`flex items-center justify-between rounded-xl border border-gray-200 border-t-4 ${s.accent} bg-white p-4 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div>
                <span className={`block text-3xl font-extrabold ${s.color}`}>{s.value}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{s.label}</span>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tile}`}>
                <Icono className="h-5 w-5" />
              </span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-gray-400 shadow-sm">
          Cargando personal...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((u) => (
            <div
              key={u.rut}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rojo/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azul to-rojo text-lg font-extrabold text-white shadow-inner">
                {u.nombre.charAt(0)}{u.apellido.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold leading-tight text-gray-800">{u.nombre} {u.apellido}</h3>
                <div className="mb-2 mt-1 font-mono text-xs text-gray-500">{u.rut}</div>
                <div className="flex w-fit items-center gap-1 rounded border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600">
                  {getCargoIcon(u.cargo)} {u.cargo}
                </div>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-gray-500">
              No se encontró personal coincidente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
