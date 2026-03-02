'use client'

import { useState, Suspense, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, Lock, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import ParticleBackground from '@/components/ui/ParticleBackground'

function LoginForm() {
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const supabase = createClient()
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        if (error) {
            setErrorMessage(error_description || 'Ha ocurrido un error durante el inicio de sesión.')
        }
    }, [searchParams])

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!captchaToken) {
            setErrorMessage('Por favor completa la verificación de seguridad')
            return
        }

        setLoading(true)
        setErrorMessage(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                captchaToken,
            },
        })

        if (error) {
            setLoading(false)
            setErrorMessage(error.message)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    const handleGoogleLogin = async () => {
        if (!captchaToken) {
            setErrorMessage('Por favor completa la verificación de seguridad')
            return
        }

        setLoading(true)

        const authOptions = {
            captchaToken,
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
                scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
            },
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: authOptions,
        })

        if (error) {
            setLoading(false)
            setErrorMessage(error.message)
        }
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
                    <Image src="/logos/star-logo.jpg" alt="Star Cargo" width={80} height={80} className="object-contain rounded-xl" />
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

            <form onSubmit={handleEmailLogin} className="space-y-4 mb-6 text-left">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="email"
                            placeholder="nombre@empresa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50/50 border-2 border-gray-100 focus:border-blue-600 focus:bg-white rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contraseña</label>
                        <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">¿Olvidó su contraseña?</button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50/50 border-2 border-gray-100 focus:border-blue-600 focus:bg-white rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-center py-2 min-h-[65px]">
                    <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                        onSuccess={(token) => {
                            setCaptchaToken(token)
                            setErrorMessage(null)
                        }}
                        onError={() => setErrorMessage('Error verificando seguridad')}
                        options={{
                            theme: 'light',
                            size: 'normal',
                        }}
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading || !captchaToken}
                    className="w-full bg-base-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-base-900/10 disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
                </motion.button>
            </form>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-400 font-bold">o continuar con</span>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGoogleLogin}
                type="button"
                disabled={loading || !captchaToken}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 text-base-900 font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
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
                        <span>Google</span>
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

export default function LoginPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`min-h-screen w-full flex relative bg-[#F8FAFC] overflow-hidden transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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