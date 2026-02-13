'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X, Mail, Shield } from 'lucide-react';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

export function UserModal({ isOpen, onClose, onUserCreated }: UserModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        role: 'SALES_REP'
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Error creating invite');
            }

            onUserCreated();
            onClose();
            setFormData({ email: '', role: 'SALES_REP' });

        } catch (error: any) {
            console.error('Error creating user:', error);
            alert(error.message || 'Error al invitar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo usuario</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                            <Mail size={16} /> Correo electrónico
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="ejemplo@starcargo.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">El usuario se registrará con este correo usando Google.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                            <Shield size={16} /> Rol del usuario
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`
                flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                ${formData.role === 'SALES_REP' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-600 dark:text-slate-400'}
              `}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="SALES_REP"
                                    checked={formData.role === 'SALES_REP'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="sr-only"
                                />
                                <span className="font-semibold text-sm">Seguimientos</span>
                                <span className="text-xs opacity-70 mt-1">Acceso limitado</span>
                            </label>

                            <label className={`
                flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                ${formData.role === 'ADMIN' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-600 dark:text-slate-400'}
              `}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="ADMIN"
                                    checked={formData.role === 'ADMIN'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="sr-only"
                                />
                                <span className="font-semibold text-sm">Admin</span>
                                <span className="text-xs opacity-70 mt-1">Acceso total</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : 'Enviar Invitación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
