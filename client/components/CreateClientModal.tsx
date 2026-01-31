'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LucideX, LucideLoader2, LucideBuilding2, LucideUser, LucideMail, LucidePhone } from 'lucide-react'

type CreateClientModalProps = {
    onClose: () => void
    onSuccess: () => void
}

export default function CreateClientModal({ onClose, onSuccess }: CreateClientModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: ''
    })

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Error al crear cliente')

            // Éxito: Cerramos y refrescamos el tablero
            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error al guardar. Verifica los datos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-800">Nuevo Prospecto</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200">
                        <LucideX className="text-gray-500" size={20} />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">Empresa *</label>
                        <div className="relative">
                            <LucideBuilding2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                required
                                type="text"
                                placeholder="Ej. Tech Solutions S.A."
                                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">Contacto Principal</label>
                        <div className="relative">
                            <LucideUser className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Ej. Ana Pérez"
                                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">Email</label>
                            <div className="relative">
                                <LucideMail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="ana@tech.com"
                                    className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">Teléfono</label>
                            <div className="relative">
                                <LucidePhone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    placeholder="+506 8888-8888"
                                    className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                        >
                            {loading ? <LucideLoader2 className="animate-spin" size={18} /> : 'Registrar Prospecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}