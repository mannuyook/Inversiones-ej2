'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Guardamos el rol y el email para que el panel los reconozca
      localStorage.setItem('ej_user_role', 'ADMIN');
      localStorage.setItem('ej_user_email', email);

      // Redirigimos al panel de administración
      router.push('/admin');
      router.refresh();
    } catch (error) {
      setErrorMsg(error.message || 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0c0e] text-white font-sans items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#121418] rounded-2xl shadow-2xl p-8 border border-[#1a1d24]">
        
        {/* Cabecera con el estilo de la marca */}
        <div className="flex items-center justify-center gap-3 mb-6 pb-6 border-b border-[#1a1d24]">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#0b0c0e] shrink-0">
            <img src="/logo/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-extrabold text-sm tracking-wider leading-none">
              INVERSIONES <span className="text-[#d4af37] text-base">EJ</span>
            </span>
            <span className="text-[#d4af37] text-[10px] font-bold tracking-widest mt-1 uppercase">
              ROPA DE CABALLERO
            </span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-center mb-6 uppercase text-gray-200 tracking-wider">
          Panel Administrativo
        </h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-semibold">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0b0c0e] border border-[#1a1d24] rounded-xl text-xs text-white focus:outline-none focus:border-[#cca152]"
              placeholder="admin@inversionesej.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-semibold">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0b0c0e] border border-[#1a1d24] rounded-xl text-xs text-white focus:outline-none focus:border-[#cca152]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#181a20] hover:bg-[#22252d] text-[#cca152] border border-[#cca152]/40 text-xs font-bold rounded-xl transition duration-200 uppercase disabled:opacity-50 shadow-lg mt-2"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}