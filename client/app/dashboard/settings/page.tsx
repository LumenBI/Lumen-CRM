'use client'

import { useState, useEffect } from 'react'
import { LucideUser, LucideBell, LucideSettings, LucideMoon, LucideSun, LucideShield } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { useApi } from '@/hooks/useApi'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general')
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<{ id: string, email: string, last_sign_in_at: string } | null>(null)
    const [profile, setProfile] = useState<{ full_name: string, role: string, notification_interval?: number } | null>(null)
    const [preferences, setPreferences] = useState({
        marketingEmails: true,
        securityAlerts: true,
        browserNotifications: true,
        darkMode: false,
        notificationInterval: 30
    })
    const [isSaving, setIsSaving] = useState(false)
    const [customInterval, setCustomInterval] = useState('')
    const [intervalUnit, setIntervalUnit] = useState('minutes')

    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser({ id: user.id, email: user.email || '', last_sign_in_at: user.last_sign_in_at || '' })

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, role, notification_interval')
                    .eq('id', user.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    setPreferences(prev => ({ ...prev, notificationInterval: profileData.notification_interval || 30 }))
                }
            }

            // Load prefs from localStorage
            const savedPrefs = localStorage.getItem('user_prefs')
            if (savedPrefs) {
                const parsed = JSON.parse(savedPrefs)
                setPreferences(prev => ({ ...prev, ...parsed }))
            }
            setLoading(false)
        }
        fetchUser()
    }, [])

    const handleToggle = (key: keyof typeof preferences) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] }
        setPreferences(newPrefs)
        localStorage.setItem('user_prefs', JSON.stringify(newPrefs))

        if (key === 'darkMode') {
            if (newPrefs.darkMode) document.documentElement.classList.add('dark')
            else document.documentElement.classList.remove('dark')
        }
    }

    const { updateNotificationInterval } = useApi().users

    const handleIntervalChange = async (minutes: number) => {
        setIsSaving(true)
        try {
            await updateNotificationInterval(minutes)
            setPreferences(prev => ({ ...prev, notificationInterval: minutes }))
            toast.success('Frecuencia de alertas actualizada')
        } catch (error) {
            toast.error('Error al actualizar frecuencia')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCustomIntervalSubmit = () => {
        const val = parseInt(customInterval)
        if (isNaN(val) || val <= 0) return

        let minutes = val
        if (intervalUnit === 'hours') minutes = val * 60
        if (intervalUnit === 'days') minutes = val * 1440

        handleIntervalChange(minutes)
        setCustomInterval('')
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <PageHeader title="Configuración" subtitle="Administra tu perfil y preferencias" />
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-pulse h-[400px]" />
            </div>
        )
    }

    const tabs = [
        { id: 'general', label: 'General', icon: LucideSettings },
        { id: 'notifications', label: 'Notificaciones', icon: LucideBell },
        { id: 'profile', label: 'Mi Perfil', icon: LucideUser },
    ]

    const presets = [
        { label: '15 min', value: 15 },
        { label: '30 min', value: 30 },
        { label: '1 hora', value: 60 },
        { label: '4 horas', value: 240 },
        { label: '1 día', value: 1440 },
    ]

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'US'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader title="Configuración" subtitle="Administra tu perfil y preferencias" />

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px]">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">Apariencia</h3>
                            <p className="text-sm text-gray-500 mb-4">Personaliza cómo se ve la aplicación.</p>

                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                                        {preferences.darkMode ? <LucideMoon size={20} /> : <LucideSun size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700">Modo Oscuro</p>
                                        <p className="text-xs text-gray-500">Cambiar entre tema claro y oscuro</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.darkMode}
                                        onChange={() => handleToggle('darkMode')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">Idioma y Región</h3>
                            <p className="text-sm text-gray-500 mb-4">La configuración regional está bloqueada por la organización.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg bg-gray-50 opacity-75 cursor-not-allowed">
                                    <p className="text-xs text-gray-400 mb-1">Idioma</p>
                                    <p className="font-medium text-gray-700">Español (Latinoamérica)</p>
                                </div>
                                <div className="p-4 border rounded-lg bg-gray-50 opacity-75 cursor-not-allowed">
                                    <p className="text-xs text-gray-400 mb-1">Zona Horaria</p>
                                    <p className="font-medium text-gray-700">America/Guatemala (GMT-6)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferencias de Alerta</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-700">Alertas en el navegador</p>
                                        <p className="text-xs text-gray-500">Recibir popups cuando una cita está por comenzar</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.browserNotifications}
                                            onChange={() => handleToggle('browserNotifications')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-700">Correos de Marketing</p>
                                        <p className="text-xs text-gray-500">Noticias sobre actualizaciones del sistema</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.marketingEmails}
                                            onChange={() => handleToggle('marketingEmails')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Frecuencia de Recordatorios</h3>
                            <p className="text-sm text-gray-500 mb-4">¿Con cuánto tiempo de anticipación quieres que te avisemos de tus citas?</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        disabled={isSaving}
                                        onClick={() => handleIntervalChange(preset.value)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${preferences.notificationInterval === preset.value
                                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 max-w-md">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Valor personalizado</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={customInterval}
                                        onChange={(e) => setCustomInterval(e.target.value)}
                                        placeholder="Ej: 45"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                    <select
                                        value={intervalUnit}
                                        onChange={(e) => setIntervalUnit(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="minutes">Minutos</option>
                                        <option value="hours">Horas</option>
                                        <option value="days">Días</option>
                                    </select>
                                    <button
                                        onClick={handleCustomIntervalSubmit}
                                        disabled={isSaving || !customInterval}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                                    >
                                        Guardar
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Intervalo actual: {preferences.notificationInterval >= 1440
                                        ? `${(preferences.notificationInterval / 1440).toFixed(1)} días`
                                        : preferences.notificationInterval >= 60
                                            ? `${(preferences.notificationInterval / 60).toFixed(1)} horas`
                                            : `${preferences.notificationInterval} minutos`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-start gap-6">
                            <div className="h-24 w-24 rounded-full bg-[#000D42] text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                                {initials}
                            </div>
                            <div className="space-y-1 pt-2">
                                <h3 className="text-xl font-bold text-gray-800">{profile?.full_name || 'Usuario'}</h3>
                                <p className="text-gray-500">{user?.email}</p>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <LucideShield size={12} />
                                    Rol: {profile?.role || 'Usuario'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">ID de Usuario</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono text-gray-600 truncate">
                                    {user?.id}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Último Acceso</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3 text-sm text-yellow-800">
                            <LucideShield className="flex-shrink-0 mt-0.5" size={16} />
                            <p>
                                Tu cuenta es gestionada por <strong>Star Cargo Organization</strong>.
                                Para cambiar tu contraseña o actualizar detalles personales, contacta al departamento de IT.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
