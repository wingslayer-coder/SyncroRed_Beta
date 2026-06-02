import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
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
      // Limpiar puntos y espacios, uppercase
      const rutLimpio = rut.replace(/[.\s]/g, '').toUpperCase();
      // Si ya tiene guión, usarlo tal cual; si no, insertar guión antes del último carácter
      const rutFormateado = rutLimpio.includes('-')
        ? rutLimpio
        : rutLimpio.length >= 2
          ? `${rutLimpio.slice(0, -1)}-${rutLimpio.slice(-1)}`
          : rutLimpio;

      console.log('[LOGIN] baseURL:', client.defaults.baseURL);
      console.log('[LOGIN] rut enviado:', rutFormateado, '| pwd:', password);
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
      <div className="login-shell">
        {/* ===== Panel de marca (izquierda) ===== */}
        <aside className="login-brand">
          <div className="login-brand-top">
            <span className="login-eyebrow">Control Operativo de Redes</span>
            <h1 className="login-brand-title">SyncroRed</h1>
            <span className="login-accent" />
            <p className="login-brand-text">
              Plataforma de gestión y monitoreo operacional de la red
              ferroviaria&nbsp;EFE&nbsp;Sur.
            </p>
          </div>

          <div className="login-brand-foot">
            <ShieldCheck size={16} />
            <span>EFE Trenes de Chile · Acceso autorizado</span>
          </div>

          {/* Motivo ferroviario decorativo */}
          <svg className="login-rail" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden="true">
            <g stroke="rgba(255,255,255,0.10)" strokeWidth="6">
              {Array.from({ length: 21 }).map((_, i) => (
                <line key={i} x1={i * 20} y1="16" x2={i * 20} y2="56" />
              ))}
            </g>
            <g stroke="rgba(255,255,255,0.20)" strokeWidth="2">
              <line x1="0" y1="26" x2="400" y2="26" />
              <line x1="0" y1="46" x2="400" y2="46" />
            </g>
          </svg>
        </aside>

        {/* ===== Formulario (derecha) ===== */}
        <form className="login-form-side" onSubmit={handleSubmit}>
          <img src="/logo_efe.png" alt="EFE Trenes de Chile" className="login-logo" />

          <h2 className="login-form-title">Iniciar sesión</h2>
          <p className="login-form-sub">
            Ingresa tus credenciales para acceder al{' '}
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
                autoComplete="current-password"
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
            <span>{loading ? 'Ingresando...' : 'Ingresar'}</span>
            <ArrowRight size={18} />
          </button>

          <div className="text-center">
            <details className="text-xs text-gray-400 cursor-pointer select-none">
              <summary className="hover:text-gray-600 transition-colors">¿Olvidaste tu contraseña?</summary>
              <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-gray-500 leading-relaxed">
                Contacta a un <b>administrador del sistema</b> para que restablezca tu acceso.<br />
                Tu nueva contraseña temporal serán los <b>primeros 4 dígitos de tu RUT</b>.
              </p>
            </details>
          </div>

          <p className="login-foot-note">
            © {new Date().getFullYear()} EFE Sur · SyncroRed
          </p>
        </form>
      </div>
    </div>
  );
}
