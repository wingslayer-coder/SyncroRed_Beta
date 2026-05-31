import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Dashboard from './pages/Dashboard';
import PautaDiaria from './pages/PautaDiaria';
import JefeServicio from './pages/JefeServicio';
import Placeholder from './pages/Placeholder';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pauta-diaria" element={<ProtectedRoute><PautaDiaria /></ProtectedRoute>} />
        <Route path="/jefe-servicio" element={<ProtectedRoute><JefeServicio /></ProtectedRoute>} />
        <Route path="/bitacora" element={<ProtectedRoute><Placeholder title="Servicios en curso" /></ProtectedRoute>} />
        <Route path="/mapa-ferroviario" element={<ProtectedRoute><Placeholder title="Mapa Ferroviario" /></ProtectedRoute>} />
        <Route path="/asistencia" element={<ProtectedRoute><Placeholder title="Asistencia y alistación" /></ProtectedRoute>} />
        <Route path="/turnos" element={<ProtectedRoute><Placeholder title="Gráfico Tripulación" /></ProtectedRoute>} />
        <Route path="/historicos" element={<ProtectedRoute><Placeholder title="Históricos y Reportes" /></ProtectedRoute>} />
        <Route path="/visor-bd" element={<ProtectedRoute><Placeholder title="Visor de Base de Datos" /></ProtectedRoute>} />
        <Route path="/personal-operativo" element={<ProtectedRoute><Placeholder title="Personal Operativo" /></ProtectedRoute>} />
        <Route path="/gestion-bajas" element={<ProtectedRoute><Placeholder title="Gestión de Bajas" /></ProtectedRoute>} />
        <Route path="/georreferencia-admin" element={<ProtectedRoute><Placeholder title="Georreferencia de Hitos" /></ProtectedRoute>} />
        <Route path="/carga-tripulacion" element={<ProtectedRoute><Placeholder title="Cargar Tripulación CSV" /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
