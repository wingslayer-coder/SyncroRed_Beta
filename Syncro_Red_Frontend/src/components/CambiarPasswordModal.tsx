import { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose?: () => void; // si viene, es cambio voluntario (tiene botón cancelar)
}

export default function CambiarPasswordModal({ onClose }: Props) {
  const { user, login } = useAuth();
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (nueva.length < 4) { setError('La contraseña debe tener al menos 4 caracteres.'); return; }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      await client.post('/usuarios/change-password/', { new_password: nueva });
      const token = localStorage.getItem('access_token') || '';
      login({ ...user!, must_change_password: false }, token);
      if (onClose) onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-azul to-azul/80 px-6 py-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">
                  {onClose ? 'Cambiar contraseña' : 'Cambio de contraseña obligatorio'}
                </h2>
                <p className="text-sm text-white/70">
                  {onClose ? 'Actualiza tu contraseña de acceso' : 'Debes establecer una nueva contraseña para continuar'}
                </p>
              </div>
            </div>
            {onClose && (
              <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {!onClose && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Hola <b>{user?.nombre}</b>, por seguridad debes cambiar tu contraseña temporal antes de usar el sistema.
            </div>
          )}

          {/* Nueva contraseña */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNueva ? 'text' : 'password'}
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/30"
                required
              />
              <button type="button" onClick={() => setShowNueva(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/30"
                required
              />
              <button type="button" onClick={() => setShowConfirmar(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-azul py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-azul/90 disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Establecer nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
