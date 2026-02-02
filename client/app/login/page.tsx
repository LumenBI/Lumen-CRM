'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
                await supabase.auth.signOut();
                setChecking(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // PRE-VALIDATION: Check if user is active
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_active')
                    .eq('id', session.user.id)
                    .single()

                if (profile && profile.is_active === false) {
                    console.log('⛔ User account is disabled. preventing login.')
                    await supabase.auth.signOut()
                    setChecking(false)
                    window.location.href = '/login?error=account_disabled'
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
            const currentOrigin = window.location.origin
            const redirectUrl = `${currentOrigin}/auth/callback`

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
            <div className="min-h-screen flex items-center justify-center bg-[#000D42]">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                        <div className="relative bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full w-full h-full flex items-center justify-center border border-white/10 shadow-xl">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                    </div>
                    <p className="text-blue-200/80 text-sm font-medium animate-pulse">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#000D42] selection:bg-blue-500/30">
            {/* Noise Texture */}
            <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Main Gradient Mesh */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px] animate-blob mix-blend-screen pointer-events-none"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-purple-600/30 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen pointer-events-none"></div>

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Back Link */}
                <Link
                    href="/"
                    className="absolute -top-16 left-4 flex items-center gap-2 text-blue-200/50 hover:text-white transition-all duration-300 group text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="relative">
                        Volver al inicio
                        <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-white group-hover:w-full transition-all duration-300"></span>
                    </span>
                </Link>

                {/* Login Card */}
                <div className="relative group">
                    {/* Animated Border Gradient */}
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl opacity-30 group-hover:opacity-100 blur transition duration-1000 animate-gradient-xy"></div>

                    <div className="relative bg-[#0A192F]/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl ring-1 ring-white/5">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center mb-8 relative group/logo">
                                <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/20 shadow-lg shadow-blue-500/20 group-hover/logo:scale-105 transition-transform duration-500">
                                    <Image
                                        src="/logos/star-logo.jpg"
                                        alt="Star CRM"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                Bienvenido
                            </h1>
                            <p className="text-blue-200/60 text-sm font-light tracking-wide">
                                Ingresa a tu espacio de trabajo digital
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-8">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full relative group/btn overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#000D42] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-50 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative bg-[#000D42] hover:bg-[#000D42]/90 rounded-xl px-4 py-5 transition-all flex items-center justify-center gap-3">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            <span className="text-white font-medium text-base tracking-wide">Continuar con Google</span>
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Security Notice */}
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                                <div className="p-2 bg-blue-500/10 rounded-xl mt-0.5">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-white/90 mb-1">Acceso Seguro</h4>
                                    <p className="text-[11px] text-blue-200/50 leading-relaxed font-light">
                                        Plataforma exclusiva para personal de Star Cargo. <br />
                                        Tu dirección IP está siendo monitoreada.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') === 'account_disabled' && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <p className="text-red-200 text-xs font-medium">Tu cuenta se encuentra deshabilitada.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center space-y-2">
                        <p className="text-blue-200/30 text-[10px] tracking-widest uppercase">
                            Legacy System v2.0
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-xy 6s ease infinite;
        }
        @keyframes gradient-xy {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-pulse-slow {
            animation: pulse-slow 6s infinite ease-in-out;
        }
      `}</style>
        </div>
    )
}
