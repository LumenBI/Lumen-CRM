'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      // Check for error param indicating account disabled
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');

      if (errorParam === 'account_disabled') {
        // Force sign out if we were redirected here due to disabled account
        await supabase.auth.signOut();
        setChecking(false);
        // We can show a toast or alert here, or render it in the UI
        return;
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // PRE-VALIDATION: Check if user is active BEFORE redirecting
        // This avoids the infinite loop and provides instant feedback
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', session.user.id)
          .single()

        if (profile && profile.is_active === false) {
          console.log('⛔ User account is disabled. preventing login.')
          await supabase.auth.signOut()
          setChecking(false)
          // Force reload with error param to trigger the UI message we added earlier
          window.location.href = '/?error=account_disabled'
          return
        }

        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      // Get the current origin (preserves 192.168.100.194 or localhost)
      const currentOrigin = window.location.origin
      const redirectUrl = `${currentOrigin}/auth/callback`

      console.log('🔍 Login from:', currentOrigin)
      console.log('🔗 Redirect to:', redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Error logging in:', error.message)
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000D42] via-[#0066FF] to-[#000D42]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80 text-sm">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000D42] via-[#0066FF] to-[#000D42]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#9FAEFF] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0066FF] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative group">
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-white rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

                {/* Logo container */}
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30 transform group-hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/logos/star-logo.jpg"
                    alt="Star Cargo"
                    width={120}
                    height={120}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
                Star CRM
              </h1>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
                <p className="text-blue-100 text-lg font-light">
                  Sistema de Gestión de Clientes
                </p>
                <Sparkles className="w-4 h-4 text-blue-200 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="relative group">
            {/* Animated gradient border */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 rounded-3xl blur-sm opacity-40 group-hover:opacity-60 transition duration-500 animate-gradient-x"></div>

            {/* Card */}
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Bienvenido
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Inicia sesión para continuar
                  </p>

                  {/* Error Message Display */}
                  {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') === 'account_disabled' && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                      ⛔ Tu cuenta ha sido desactivada.
                      <br />
                      Contacta al administrador.
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="group/btn w-full relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {/* Button gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-200 to-white opacity-50 group-hover/btn:opacity-100 transition-opacity"></div>

                  {/* Button content */}
                  <div className="relative bg-gradient-to-r from-[#0066FF] to-[#0052CC] rounded-2xl px-6 py-4 transition-all duration-300 shadow-lg shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/70">
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span className="text-white font-semibold">Conectando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        {/* Google Icon with all colors */}
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-white font-semibold text-base">Continuar con Google</span>
                      </div>
                    )}

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </div>
                </button>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-xs text-center text-blue-100/80">
                    🔒 Acceso exclusivo para personal autorizado
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-blue-100/80">
              © 2026 Star Cargo. Todos los derechos reservados.
            </p>
            <p className="text-xs text-blue-200/60">
              Powered by Next.js & Supabase
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(100px);
                        opacity: 0;
                    }
                }
                @keyframes gradient-x {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animate-float {
                    animation: float linear infinite;
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
    </div>
  )
}