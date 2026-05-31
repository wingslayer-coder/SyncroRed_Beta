import { useAuth } from '../context/AuthContext';
import { LogOut, Menu as MenuIcon, Train } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const rol = (user?.cargo || '').toUpperCase();
  const esGerencia = rol === 'GERENTE' || rol === 'GERENCIA';
  const esAdmin = rol === 'ADMIN';
  const esJefeServicio = rol === 'JEFE SERVICIO' || rol === 'JEFE DE SERVICIO';
  const esJefatura = esAdmin || rol === 'IL' || rol === 'INSPECTOR DE LINEA' || rol === 'JEFE DE OPERACIONES' || rol === 'SL' || rol === 'SUPERVISOR DE LINEA';

  const navItem = (path: string, label: string, icon?: React.ReactNode) => (
    <Link
      key={path}
      to={path}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
        location.pathname === path
          ? 'bg-azul-2 text-white'
          : 'text-gray-300 hover:bg-azul-2/50 hover:text-white'
      }`}
    >
      {icon}
      <span className={sidebarOpen ? 'block' : 'hidden'}>{label}</span>
    </Link>
  );

  const isMenuPage = location.pathname === '/menu';

  return (
    <div className="flex min-h-screen bg-gris-bg">
      {!isMenuPage && (
        <aside
          className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-azul text-white flex flex-col transition-all duration-300`}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Train className="w-6 h-6 text-rojo" />
                <span className="font-bold text-lg">SyncroRed</span>
              </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-white/10 rounded">
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItem('/menu', 'Menú Principal')}
            {(esGerencia || esAdmin) && navItem('/dashboard', 'Dashboard Gerencial')}
            {navItem('/pauta-diaria', 'Pauta Diaria')}
            {esJefeServicio && navItem('/jefe-servicio', 'Consola de Tráfico')}
            {!esGerencia && !esJefeServicio && (
              <>
                {navItem('/bitacora', 'Servicios en curso')}
                {navItem('/mapa-ferroviario', 'Mapa Ferroviario')}
                {navItem('/asistencia', 'Asistencia y alistación')}
                {navItem('/turnos', 'Gráfico Tripulación')}
              </>
            )}
            {esJefatura && !esJefeServicio && (
              <>
                {navItem('/visor-bd', 'Base de Datos')}
                {navItem('/personal-operativo', 'Personal Operativo')}
                {navItem('/gestion-bajas', 'Gestión de Bajas')}
              </>
            )}
            {esAdmin && (
              <>
                {navItem('/georreferencia-admin', 'Georreferencia de Hitos')}
                {navItem('/carga-tripulacion', 'Cargar Tripulación CSV')}
              </>
            )}
          </nav>

          <div className="p-3 border-t border-white/10">
            {sidebarOpen && user && (
              <div className="mb-2 text-xs text-gray-300">
                <div className="font-semibold">{user.nombre} {user.apellido}</div>
                <div>{user.cargo}</div>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-300 hover:bg-white/10 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        {!isMenuPage && (
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <h1 className="text-xl font-bold text-azul">SyncroRed EFE Sur</h1>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('es-CL')}
            </div>
          </header>
        )}
        <div className={`flex-1 p-6 overflow-auto ${isMenuPage ? 'flex flex-col justify-center items-center' : ''}`}>{children}</div>
      </main>
    </div>
  );
}

