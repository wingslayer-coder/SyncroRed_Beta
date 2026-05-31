import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import client from '../api/client';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const rutLimpio = rut.replace(/[. ]/g, '').toUpperCase();
      const esNumerico = /^\d+$/.test(rutLimpio.replace('-', ''));
      const rutFormateado = esNumerico && !rutLimpio.includes('-') && rutLimpio.length >= 2
        ? `${rutLimpio.slice(0, -1)}-${rutLimpio.slice(-1)}`
        : rutLimpio;

      const res = await client.post('/auth/login/', {
        rut: rutFormateado,
        password,
      });

      const token = res.data.access;
      const refresh = res.data.refresh;
      localStorage.setItem('refresh_token', refresh);

      const user = {
        ...res.data.usuario,
        cargo: (res.data.usuario.cargo || '').toUpperCase(),
      };

      login(user, token);
      navigate('/menu', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas o RUT no registrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/logo_efe.png" alt="EFE Trenes de Chile" className="login-logo" />
        <h1 className="login-title">SyncroRed</h1>
        <p className="login-subtitle">
          <b>Estimado Usuario:</b> Ingrese sus credenciales para entrar al sistema{' '}
          <b>Control Operativo de Redes de EFE</b>.
        </p>

        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label className="login-label">RUT</label>
          <input
            type="text"
            className="login-input"
            placeholder="Ej: 11.222.333-4"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label className="login-label">Contraseña</label>
          <div className="login-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              placeholder="Ingrese clave"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          <span>➜</span>
          <span>{loading ? 'Ingresando...' : 'Ingresar'}</span>
        </button>
      </form>
    </div>
  );
}
