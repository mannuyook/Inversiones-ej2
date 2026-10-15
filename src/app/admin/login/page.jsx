'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password.trim())
        .single()

      if (error) {
        console.error('Error detallado de Supabase:', error)
        throw new Error(`Supabase dice: ${error.message}`)
      }

      if (!data) {
        throw new Error('Usuario no encontrado en la tabla')
      }

      localStorage.setItem('ej_user_role', data.role || 'ADMIN')
      localStorage.setItem('ej_user_email', data.email)

      // Redirección directa y forzada para evitar bloqueos
      window.location.href = '/admin'
    } catch (error) {
      setErrorMsg(error.message || 'Ocurrió un error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0b0c0e] text-white font-sans items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#121418] rounded-2xl shadow-2xl p-8 border border-[#1a1d24]">
        <div className="flex items-center justify-center gap-3 mb-6 pb-6 border-b border-[#1a1d24]">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#0b0c0e] shrink-0">
            <img src="/logo/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">INVERSIONES EJ</h1>
            <p className="text-[10px] text-amber-500 font-semibold tracking-widest uppercase">Ropa de Caballero</p>
          </div>
        </div>

        <h2 className="text-center font-bold tracking-wider text-sm mb-6 text-gray-200">PANEL ADMINISTRATIVO</h2>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-200 text-sm rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Correo Electrónico</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
              placeholder="correo electrónico"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Contraseña</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 text-sm"
              placeholder="••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1d24] hover:bg-[#222630] border border-[#d4af37]/30 text-amber-400 font-semibold py-3 rounded-lg transition duration-200 text-xs tracking-widest uppercase mt-2"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar al Panel'}
          </button>
        </form>
      </div>
    </div>
  )
}