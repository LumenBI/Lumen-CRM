'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, Search, UserCheck, UserX, UserPlus, Shield, Briefcase } from 'lucide-react';
import { UserModal } from '@/components/admin/user-modal';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Supabase client to get the session token
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (user: User) => {
        // Only active users can be toggled. Pending users need to register first.
        if (user.status === 'PENDING') return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const newStatus = !user.is_active;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ is_active: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            // Optimistic update
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus, status: newStatus ? 'ACTIVE' : 'INACTIVE' } : u));
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error updating user status');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-6">
            {/* Header - MEJORADO con gradiente Star Cargo */}
            <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                        <p className="text-blue-100 text-lg">Administra el equipo y permisos del sistema</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-[#0066FF] px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <Plus size={20} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Search Bar - MEJORADO */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#0066FF] focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
                    />
                </div>
            </div>

            {/* Stats Cards - MEJORADO con diseño premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                            <UserCheck className="text-white" size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Usuarios Activos</h3>
                        <p className="text-4xl font-bold text-[#000D42]">{users.filter(u => u.status === 'ACTIVE').length}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                            <UserX className="text-white" size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Inactivos</h3>
                        <p className="text-4xl font-bold text-[#000D42]">{users.filter(u => u.status === 'INACTIVE').length}</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                            <UserPlus className="text-white" size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Pendientes</h3>
                        <p className="text-4xl font-bold text-[#000D42]">{users.filter(u => u.status === 'PENDING').length}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* User Table - MEJORADO */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide">USUARIO</th>
                                    <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide">ROL</th>
                                    <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide">ESTADO</th>
                                    <th className="px-8 py-5 text-right text-sm font-bold text-[#000D42] tracking-wide">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-gray-500">
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-gray-500">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-blue-50/50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0066FF] to-[#0052CC] flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                                                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg text-[#000D42] group-hover:text-[#0066FF] transition-colors">
                                                            {user.full_name || 'Sin nombre'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm ${user.role === 'ADMIN' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700' :
                                                    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700'
                                                    }`}>
                                                    {user.role === 'ADMIN' ? <Shield size={16} /> : <Briefcase size={16} />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-xs shadow-md ${user.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-green-700' :
                                                    user.status === 'PENDING' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700' :
                                                        'bg-gradient-to-r from-red-100 to-red-200 text-red-700'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full mr-2 ${user.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
                                                        user.status === 'PENDING' ? 'bg-amber-500' :
                                                            'bg-red-500'
                                                        }`}></span>
                                                    {user.status === 'ACTIVE' ? 'Activo' : user.status === 'PENDING' ? 'Pendiente' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {user.status !== 'PENDING' && (
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg hover:scale-105 ${user.is_active
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        {user.is_active ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Modal */}
                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUserCreated={() => {
                        fetchUsers();
                    }}
                />
            </div>
        </div>
    );
}
