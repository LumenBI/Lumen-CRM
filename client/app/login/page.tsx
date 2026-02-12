'use client'

import { useState, Suspense, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const supabase = createClient()
    const searchParams = useSearchParams()

    useEffect(() => {
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        if (error) {
            setErrorMessage(error_description || 'Ha ocurrido un error durante el inicio de sesión.')
        }
    }, [searchParams])

    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
                },
            },
        })
        if (error) setLoading(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-[420px] bg-white p-10 md:p-12 rounded-3xl shadow-soft border border-gray-100 relative overflow-hidden"
        >
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "circOut" }}
                className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-base-900 via-blue-600 to-base-900 origin-left"
            ></motion.div>

            <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                    className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </motion.div>
                <h1 className="text-2xl font-bold text-base-900 tracking-tight">Bienvenido</h1>
                <p className="text-gray-400 mt-2 text-sm font-medium">Inicie sesión para gestionar sus envíos</p>
            </div>

            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 font-medium text-left">{errorMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full relative group flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 text-base-900 font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 overflow-hidden"
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                    <>
                        <Image
                            src="https://authjs.dev/img/providers/google.svg"
                            width={20}
                            height={20}
                            alt="Google"
                        />
                        <span className="relative z-10">Continuar con Google</span>
                    </>
                )}
            </motion.button>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 pt-6 border-t border-gray-50 text-center"
            >
                <p className="text-xs text-gray-300">
                    Acceso restringido a personal autorizado de Star Cargo.
                </p>
            </motion.div>
        </motion.div>
    )
}

import ParticleBackground from '@/components/ui/ParticleBackground'

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex relative bg-[#F8FAFC] overflow-hidden">
            <ParticleBackground />

            <div className="container mx-auto px-6 relative z-10 flex flex-col h-screen">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="h-20 flex items-center justify-between"
                >
                    <Link href="/" className="flex items-center gap-2 text-sm font-bold text-base-900/60 hover:text-base-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                    </Link>
                </motion.div>

                <div className="flex-1 flex items-center justify-center pb-20">
                    <Suspense fallback={<div>Cargando...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="h-16 flex items-center justify-center text-xs text-gray-400"
                >
                    © {new Date().getFullYear()} Star Cargo Service S.A.
                </motion.div>
            </div>
        </div>
    )
}
