'use client';

import { useState, useEffect } from 'react';
import { useQuickActions } from '@/context/QuickActionsContext';
import { Building2, User, Phone, Mail, Trash2, Pencil, Plus } from 'lucide-react';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import NewTrackingModal from '@/components/kanban/NewTrackingModal';
import ClientModal from '@/components/ClientModal';
import EditClientModal from '@/components/clients/EditClientModal';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { Client } from '@/types';
import { useClients } from '@/context/ClientsContext';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner'
import { TEXTS, NAVIGATION_LABELS } from '@/constants/text'

export default function ClientsPage() {
    const { allClients, searchAllClients, loading, refreshClients } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: AlertType;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        clientId: string | null;
    }>({
        isOpen: false,
        clientId: null
    });

    const [isDeleting, setIsDeleting] = useState(false);

    const { authFetch } = useAuthFetch();
    const { profile } = useUser();
    const { requestAction, clearAction } = useQuickActions();

    const displayedClients = searchTerm ? searchAllClients(searchTerm) : allClients;

    useEffect(() => {
        if (requestAction === 'newClient') {
            setIsCreateModalOpen(true);
            clearAction();
        }
    }, [requestAction, clearAction]);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmState({ isOpen: true, clientId: id });
    }

    const handleEditClick = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation();
        setClientToEdit(client);
    }

    const executeDelete = async () => {
        if (!confirmState.clientId) return;

        setIsDeleting(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${confirmState.clientId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al eliminar cliente');
            }

            refreshClients();
            setConfirmState({ isOpen: false, clientId: null });

            setAlertState({
                isOpen: true,
                title: '¡Cliente Eliminado!',
                message: 'El cliente ha sido eliminado correctamente de la base de datos.',
                type: 'success'
            });
        } catch (error: any) {
            console.error("Error deleting client", error);
            setConfirmState({ isOpen: false, clientId: null });
            setAlertState({
                isOpen: true,
                title: 'No se pudo eliminar',
                message: error.message || 'Ocurrió un error al intentar eliminar el cliente',
                type: 'error'
            });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <PageHeader
                title={TEXTS.CLIENTS_TITLE}
                subtitle="Gestiona tu base de datos de clientes"
                icon={Building2}
                actionLabel={TEXTS.NEW_CLIENT}
                actionIcon={<Plus size={20} />}
                onAction={() => setIsCreateModalOpen(true)}
            />
            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre de empresa, contacto o email..."
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Vista cards - móvil */}
                <div className="md:hidden p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">Cargando clientes...</div>
                    ) : displayedClients.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-400 font-medium">No se encontraron clientes</div>
                    ) : (
                        displayedClients.map((client) => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedClientId(client.id)}
                                className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 active:bg-blue-50/50 dark:active:bg-blue-900/10 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#0052CC] flex items-center justify-center text-white shadow-md flex-shrink-0">
                                            <Building2 size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#000D42] dark:text-white truncate">{client.company_name}</p>
                                            <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{client.contact_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleEditClick(e, client)}
                                            className="p-2 text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                                            title={TEXTS.EDIT_CLIENT}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, client.id)}
                                            className="p-2 text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                            title={TEXTS.DELETE_CLIENT}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${client.origin === 'APP COBUS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                        client.origin === 'WEB' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                                            'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                        }`}>
                                        {client.origin || 'MANUAL'}
                                    </span>
                                    {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && client.agent && (
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            {client.agent.full_name || 'Sin asignar'}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3 space-y-1.5">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                                        <Mail size={14} className="flex-shrink-0 text-blue-500" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                                        <Phone size={14} className="flex-shrink-0 text-green-500" />
                                        <span>{client.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Vista tabla - desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50">
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] dark:text-blue-400 tracking-wide uppercase">Cliente</th>
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] dark:text-blue-400 tracking-wide uppercase">Contacto</th>
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] dark:text-blue-400 tracking-wide uppercase">Origen</th>
                                {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                                    <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] dark:text-blue-400 tracking-wide uppercase">Asignado A</th>
                                )}

                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] dark:text-blue-400 tracking-wide uppercase">
                                    Datos
                                </th>

                                <th className="px-8 py-5 text-right text-sm font-bold text-[#000D42] dark:text-blue-400 tracking-wide uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-slate-400">Cargando clientes...</td></tr>
                            ) : displayedClients.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-slate-400 font-medium">No se encontraron clientes</td></tr>
                            ) : displayedClients.map((client) => (
                                <tr
                                    key={client.id}
                                    className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer border-b border-gray-100 dark:border-slate-800 hover:shadow-md hover:scale-[1.01]"
                                    onClick={() => setSelectedClientId(client.id)}
                                >
                                    <td className="px-8 py-6 w-[35%]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#0052CC] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                                <Building2 size={24} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-lg text-[#000D42] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{client.company_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 w-[25%]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                                <User size={18} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <span className="text-gray-800 dark:text-slate-200 font-medium truncate">{client.contact_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 w-[15%]">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${client.origin === 'APP COBUS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                                            client.origin === 'WEB' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                                                'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                                            }`}>
                                            {client.origin || 'MANUAL'}
                                        </span>
                                    </td>
                                    {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                                        <td className="px-8 py-6 w-[20%]">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${client.assigned_agent_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-sm text-gray-700 dark:text-slate-300 font-medium truncate">
                                                    {client.agent?.full_name || 'Sin Asignar'}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-8 py-6 w-[25%]">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                                    <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-gray-700 dark:text-slate-400 truncate">{client.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                                                    <Phone size={16} className="text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-gray-700 dark:text-slate-400 truncate">{client.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right w-[150px]">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => handleEditClick(e, client)}
                                                className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white hover:bg-blue-500 rounded-xl transition-all hover:scale-110 shadow-sm hover:shadow-md"
                                                title={TEXTS.EDIT_CLIENT}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, client.id)}
                                                className="inline-flex items-center justify-center w-10 h-10 text-gray-400 dark:text-slate-500 hover:text-white hover:bg-red-500 rounded-xl transition-all hover:scale-110 shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-800"
                                                title={TEXTS.DELETE_CLIENT}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {alertState.isOpen && (
                <AlertModal
                    isOpen={alertState.isOpen}
                    onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                />
            )}

            {confirmState.isOpen && (
                <ConfirmModal
                    isOpen={confirmState.isOpen}
                    onClose={() => setConfirmState({ isOpen: false, clientId: null })}
                    onConfirm={executeDelete}
                    title="¿Eliminar Cliente?"
                    message="Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este cliente permanentemente?"
                    isLoading={isDeleting}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                />
            )}

            {isCreateModalOpen && (
                <NewTrackingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        refreshClients();
                    }}
                    initialMode="create"
                />
            )}

            {selectedClientId && (
                <ClientModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                    onSuccess={() => {
                        refreshClients();
                    }}
                />
            )}

            {clientToEdit && (
                <EditClientModal
                    client={clientToEdit}
                    onClose={() => setClientToEdit(null)}
                    onSuccess={() => {
                        refreshClients();
                        setClientToEdit(null);
                    }}
                />
            )}
        </div>
    );
}
