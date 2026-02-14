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
        <div className="p-4 md:p-8 space-y-6">
            <PageHeader
                title={TEXTS.USERS_TITLE}
                subtitle="Administra el equipo y permisos del sistema"
                icon={Shield}
                actionLabel={TEXTS.NEW_USER}
                actionIcon={<Plus size={18} />}
                onAction={() => setIsModalOpen(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <KpiCard
                    title="Usuarios Activos"
                    value={activeCount}
                    icon={<UserCheck className="text-white" size={20} />}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <KpiCard
                    title="Inactivos"
                    value={inactiveCount}
                    icon={<UserX className="text-white" size={20} />}
                    color="bg-gradient-to-br from-red-500 to-red-600"
                />
                <KpiCard
                    title="Pendientes"
                    value={pendingCount}
                    icon={<UserPlus className="text-white" size={20} />}
                    color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/20">
                    <div className="relative flex-1 max-w-md">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Buscar por nombre o correo..."
                            className="p-0 shadow-none border-0 bg-transparent"
                        />
                    </div>
                </div>

                {/* Mobile View - Compact Cards */}
                <div className="md:hidden p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">Cargando usuarios...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-400 font-medium">No se encontraron usuarios</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                                            <img
                                                src="/logos/star-logo.jpg"
                                                alt={user.full_name || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#000D42] dark:text-white truncate">{user.full_name || 'Sin nombre'}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                                            {user.role}
                                        </span>
                                        {user.status !== 'PENDING' && (
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${user.is_active
                                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                    }`}
                                                title={user.is_active ? 'Desactivar' : 'Activar'}
                                            >
                                                {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    {(() => {
                                        const statusConfig = USER_STATUS_MAP[user.status || '']
                                        return (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${statusConfig?.badgeColor || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig?.dotColor || 'bg-gray-500 dark:bg-slate-400'}`}></span>
                                                {statusConfig?.label || user.status}
                                            </span>
                                        )
                                    })()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View - Compact Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-slate-400 tracking-wider uppercase">Usuario</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-slate-400 tracking-wider uppercase">Rol</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 dark:text-slate-400 tracking-wider uppercase">Estado</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 dark:text-slate-400 tracking-wider uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">No se encontraron usuarios</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 dark:border-slate-700 flex-shrink-0">
                                                    <img
                                                        src="/logos/star-logo.jpg"
                                                        alt={user.full_name || 'User'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-[#000D42] dark:text-white truncate">{user.full_name || 'Sin nombre'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs ${user.role === 'ADMIN' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
                                                {user.role === 'ADMIN' ? <Shield size={14} /> : <Briefcase size={14} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const statusConfig = USER_STATUS_MAP[user.status || '']
                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[10px] ${statusConfig?.badgeColor || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${statusConfig?.dotColor || 'bg-gray-500 dark:bg-slate-400'}`}></span>
                                                        {statusConfig?.label || user.status}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.status !== 'PENDING' && (
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${user.is_active
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                                                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                        }`}
                                                >
                                                    {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
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
                onUserCreated={() => refreshAgents()}
            />
        </div>
    );
}
