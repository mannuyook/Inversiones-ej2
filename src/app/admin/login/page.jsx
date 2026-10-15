'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Autenticación real con Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      // Determinamos el rol según el correo ingresado
      const userEmail = data.user?.email || '';
      const role = userEmail.toLowerCase().includes('dev') ? 'DEVELOPER' : 'ADMIN';

      // Guardamos en el navegador
      localStorage.setItem('ej_user_role', role);
      localStorage.setItem('ej_user_email', userEmail);

      router.push('/admin');
    } catch (err) {
      setError('Credenciales incorrectas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0b0c0e] text-white font-sans items-center justify-center p-4">
      <div className="bg-[#121418] border border-[#d4af37]/40 rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#0b0c0e] mx-auto">
            <img src="/logo/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg font-bold text-[#d4af37]">INVERSIONES EJ</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Panel de Administración</p>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-500 text-rose-300 px-4 py-2.5 rounded-xl text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-300 font-semibold mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="admin@inversionesej.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-[#0b0c0e] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d4af37]" 
              required 
            />
          </div>

          <div>
            <label className="block text-xs text-gray-300 font-semibold mb-1">Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-[#0b0c0e] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d4af37]" 
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#b88f43] text-black py-3 rounded-xl font-extrabold uppercase text-xs transition shadow-lg">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center pt-2">
        </div>
      </div>
    </div>
  );
}