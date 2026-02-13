'use client'

import { useState, useEffect } from 'react'
import { LucideUser, LucideBell, LucideSettings, LucideMoon, LucideSun, LucideShield } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { useApi } from '@/hooks/useApi'
import { toast } from 'sonner'

import { useTheme } from 'next-themes'

export default function SettingsPage() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('general')
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<{ id: string, email: string, last_sign_in_at: string } | null>(null)
    const [profile, setProfile] = useState<{ full_name: string, role: string, notification_interval?: number, preferences?: any } | null>(null)
    const [preferences, setPreferences] = useState({
        marketingEmails: true,
        securityAlerts: true,
        browserNotifications: true,
        darkMode: false,
        notificationInterval: 30,
        timezone: 'America/Guatemala',
        // Granular notifications
        personal: { appointments: { inApp: true }, deals: { inApp: true }, follows: { inApp: true } },
        team: { appointments: { inApp: false }, deals: { inApp: true }, follows: { inApp: false } }
    })
    const [isSaving, setIsSaving] = useState(false)
    const [customInterval, setCustomInterval] = useState('')
    const [intervalUnit, setIntervalUnit] = useState('minutes')
    const [mounted, setMounted] = useState(false)

    const supabase = createClient()
    const { updateNotificationInterval, updatePreferences } = useApi().users

    useEffect(() => {
        setMounted(true)
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser({ id: user.id, email: user.email || '', last_sign_in_at: user.last_sign_in_at || '' })

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, role, notification_interval, preferences')
                    .eq('id', user.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    setPreferences(prev => ({
                        ...prev,
                        notificationInterval: profileData.notification_interval || 30,
                        ...(profileData.preferences || {})
                    }))
                }
            }
            setLoading(false)
        }
        fetchUser()
    }, [])

    const handleToggle = (key: keyof typeof preferences) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] }
        setPreferences(newPrefs)
        if (key === 'darkMode') {
            setTheme(newPrefs.darkMode ? 'dark' : 'light')
        }
    }

    const handlePreferenceToggle = async (type: 'personal' | 'team', category: string, channel: string) => {
        const anyPrefs = preferences as any
        const updatedPrefs = {
            ...preferences,
            [type]: {
                ...anyPrefs[type],
                [category]: {
                    ...anyPrefs[type][category],
                    [channel]: !anyPrefs[type][category][channel]
                }
            }
        }
        setPreferences(updatedPrefs)
        try {
            await updatePreferences(updatedPrefs)
            toast.success('Preferencia actualizada')
        } catch (error) {
            toast.error('Error al guardar preferencia')
        }
    }

    const handleTimezoneChange = (tz: string) => {
        const newPrefs = { ...preferences, timezone: tz }
        setPreferences(newPrefs)
        localStorage.setItem('user_prefs', JSON.stringify(newPrefs))
        toast.success(`Zona horaria actualizada a ${tz}`)
    }

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

    if (loading || !mounted) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <PageHeader title="Configuración" subtitle="Administra tu perfil y preferencias" />
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 animate-pulse h-[400px]" />
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
            <div className="flex border-b border-gray-200 dark:border-slate-800">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 min-h-[400px] transition-colors duration-300">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Apariencia</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Personaliza cómo se ve la aplicación.</p>

                            <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 dark:text-slate-400">
                                        {resolvedTheme === 'dark' ? <LucideMoon size={20} /> : <LucideSun size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-slate-200">Modo Oscuro</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500">Cambiar entre tema claro y oscuro</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={resolvedTheme === 'dark'}
                                        onChange={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-900/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-slate-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Idioma y Región</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Configura tus preferencias regionales.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-800/20 opacity-75 cursor-not-allowed">
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Idioma</p>
                                    <p className="font-medium text-gray-700 dark:text-slate-300">Español (Latinoamérica)</p>
                                    <p className="text-[10px] text-slate-400">Gestionado por IT</p>
                                </div>
                                <div className="p-4 border dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/40 transition-all hover:border-blue-200 dark:hover:border-blue-900/60 group">
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Zona Horaria</p>
                                    <select
                                        value={preferences.timezone}
                                        onChange={(e) => handleTimezoneChange(e.target.value)}
                                        className="w-full bg-transparent font-medium text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                                    >
                                        <option value="America/Guatemala">Guatemala (GMT-6)</option>
                                        <option value="America/Mexico_City">México (GMT-6)</option>
                                        <option value="America/New_York">New York (GMT-5)</option>
                                        <option value="Europe/Madrid">Madrid (GMT+1)</option>
                                        <option value="UTC">UTC (GMT+0)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <LucideUser className="text-[#0066FF]" size={20} />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mis notificaciones</h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Recibe alertas en el dashboard cuando tú realices estas acciones.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-slate-300">Notificaciones citas</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500">Recibe notificaciones de tus citas programadas.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.personal.appointments.inApp}
                                            onChange={() => handlePreferenceToggle('personal', 'appointments', 'inApp')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-slate-300">Nuevos Negocios</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500">Alertas al registrar una negociación</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.personal.deals.inApp}
                                            onChange={() => handlePreferenceToggle('personal', 'deals', 'inApp')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <LucideShield className="text-amber-500" size={20} />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Supervisión</h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Recibe alertas sobre las acciones de otros agentes.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-slate-300">Citas de agentes</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500">Alertas de nuevas citas programadas por otros agentes</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.team.appointments.inApp}
                                            onChange={() => handlePreferenceToggle('team', 'appointments', 'inApp')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-slate-300">Seguimientos de agentes</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500">Alertas de nuevos seguimientos</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.team.deals.inApp}
                                            onChange={() => handlePreferenceToggle('team', 'deals', 'inApp')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Otros Canales (Beta)</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800/50">
                                    <div>
                                        <p className="font-medium text-gray-700 dark:text-slate-300">Alertas en el navegador (Popups)</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500">Recibir notificaciones flotantes del navegador</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.browserNotifications}
                                            onChange={() => handleToggle('browserNotifications')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-gray-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Frecuencia de Recordatorios de Agenda</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">¿Con cuánto tiempo de anticipación quieres que te avisemos de tus citas?</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        disabled={isSaving}
                                        onClick={() => handleIntervalChange(preset.value)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${preferences.notificationInterval === preset.value
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800 max-w-md">
                                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Valor personalizado</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={customInterval}
                                        onChange={(e) => setCustomInterval(e.target.value)}
                                        placeholder="Ej: 45"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                                    />
                                    <select
                                        value={intervalUnit}
                                        onChange={(e) => setIntervalUnit(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                                    >
                                        <option value="minutes">Minutos</option>
                                        <option value="hours">Horas</option>
                                        <option value="days">Días</option>
                                    </select>
                                    <button
                                        onClick={handleCustomIntervalSubmit}
                                        disabled={isSaving || !customInterval}
                                        className="px-4 py-2 bg-gray-800 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-gray-900 dark:hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Guardar
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">
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
                            <div className="h-24 w-24 rounded-full bg-[#000D42] dark:bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                                {initials}
                            </div>
                            <div className="space-y-1 pt-2">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{profile?.full_name || 'Usuario'}</h3>
                                <p className="text-gray-500 dark:text-slate-400">{user?.email}</p>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                    <LucideShield size={12} />
                                    Rol: {profile?.role || 'Usuario'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-800">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">ID de Usuario</label>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg text-sm font-mono text-gray-600 dark:text-slate-300 truncate border dark:border-slate-800">
                                    {user?.id}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Último Acceso</label>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg text-sm text-gray-600 dark:text-slate-300 border dark:border-slate-800">
                                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg flex gap-3 text-sm text-yellow-800 dark:text-yellow-200">
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
