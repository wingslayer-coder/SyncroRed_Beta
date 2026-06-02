import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Dashboard from './pages/Dashboard';
import PautaDiaria from './pages/PautaDiaria';
import JefeServicio from './pages/JefeServicio';
import Bitacora from './pages/Bitacora';
import Asistencia from './pages/Asistencia';
import Turnos from './pages/Turnos';
import Historicos from './pages/Historicos';
import MapaFerroviario from './pages/MapaFerroviario';
import PersonalOperativo from './pages/PersonalOperativo';
import GestionBajas from './pages/GestionBajas';
import Placeholder from './pages/Placeholder';
import VisorBitacoras from './pages/VisorBitacoras';

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
        <Route path="/bitacora" element={<ProtectedRoute><Bitacora /></ProtectedRoute>} />
        <Route path="/mapa-ferroviario" element={<ProtectedRoute><MapaFerroviario /></ProtectedRoute>} />
        <Route path="/asistencia" element={<ProtectedRoute><Asistencia /></ProtectedRoute>} />
        <Route path="/turnos" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
        <Route path="/historicos" element={<ProtectedRoute><Historicos /></ProtectedRoute>} />
        <Route path="/visor-bd" element={<ProtectedRoute><Placeholder title="Visor de Base de Datos" /></ProtectedRoute>} />
        <Route path="/personal-operativo" element={<ProtectedRoute><PersonalOperativo /></ProtectedRoute>} />
        <Route path="/gestion-bajas" element={<ProtectedRoute><GestionBajas /></ProtectedRoute>} />
        <Route path="/georreferencia-admin" element={<ProtectedRoute><Placeholder title="Georreferencia de Hitos" /></ProtectedRoute>} />
        <Route path="/carga-tripulacion" element={<ProtectedRoute><Placeholder title="Cargar Tripulación CSV" /></ProtectedRoute>} />
        <Route path="/visor-bitacoras" element={<ProtectedRoute><VisorBitacoras /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
