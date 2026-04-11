'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div style={{
            animation: 'eve-auth-pulse 2.5s ease-in-out infinite',
            borderRadius: '50%',
          }}>
            <Image src="/logo-stacked.png" alt="The E.V.E. Studio" width={240} height={240} priority />
          </div>
          <style>{`
            @keyframes eve-auth-pulse {
              0%, 100% { filter: drop-shadow(0 0 20px rgba(139,92,246,0.5)) drop-shadow(0 0 50px rgba(124,58,237,0.25)); }
              50%       { filter: drop-shadow(0 0 45px rgba(167,139,250,0.9)) drop-shadow(0 0 90px rgba(139,92,246,0.5)); }
            }
          `}</style>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/forgot-password" className="text-zinc-500 hover:text-zinc-300 text-sm transition">
            Forgot password?
          </Link>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 transition">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
