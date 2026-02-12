'use client';

import { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, UserPlus, Shield, Briefcase } from 'lucide-react';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import KpiCard from '@/components/ui/KpiCard';
import { UserModal } from '@/components/admin/user-modal';
import { useAgents, type Agent as User } from '@/context/AgentsContext';
import { toast } from 'sonner'
import { TEXTS } from '@/constants/text'
import { USER_STATUS_MAP } from '@/constants/users'

export default function UsersPage() {
    const { agents: users, loading, refreshAgents } = useAgents();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { authFetch } = useAuthFetch();

    const handleToggleStatus = async (user: User) => {
        if (user.status === 'PENDING') return;

        try {
            const newStatus = !user.is_active;
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');
            refreshAgents();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error updating user status');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeCount = users.filter(u => u.status === 'ACTIVE').length;
    const inactiveCount = users.filter(u => u.status === 'INACTIVE').length;
    const pendingCount = users.filter(u => u.status === 'PENDING').length;

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title={TEXTS.USERS_TITLE}
                subtitle="Administra el equipo y permisos del sistema"
                actionLabel={TEXTS.NEW_USER}
                actionIcon={<Plus size={20} />}
                onAction={() => setIsModalOpen(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Usuarios Activos"
                    value={activeCount}
                    icon={<UserCheck className="text-white" size={24} />}
                    color="bg-gradient-to-br from-emerald-400 to-emerald-600"
                />
                <KpiCard
                    title="Inactivos"
                    value={inactiveCount}
                    icon={<UserX className="text-white" size={24} />}
                    color="bg-gradient-to-br from-red-400 to-red-600"
                />
                <KpiCard
                    title="Pendientes"
                    value={pendingCount}
                    icon={<UserPlus className="text-white" size={24} />}
                    color="bg-gradient-to-br from-amber-400 to-amber-600"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Buscar por nombre o correo..."
                            className="p-0 shadow-none"
                        />
                    </div>
                </div>

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
                                                {(() => {
                                                    const statusConfig = USER_STATUS_MAP[user.status || '']
                                                    return (
                                                        <span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-xs shadow-md ${statusConfig?.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                                                            <span className={`w-2 h-2 rounded-full mr-2 ${statusConfig?.dotColor || 'bg-gray-500'}`}></span>
                                                            {statusConfig?.label || user.status}
                                                        </span>
                                                    )
                                                })()}
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

                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUserCreated={() => {
                        refreshAgents();
                    }}
                />
            </div>
        </div>
    );
}
