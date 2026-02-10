'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, User, Phone, Mail, Trash2, Pencil } from 'lucide-react';
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

    // The clients displayed are derived from the global cache via search
    const displayedClients = searchTerm ? searchAllClients(searchTerm) : allClients;

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

            // The cache will update via real-time, but manual refresh is safer after delete
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
        <div className="p-8 space-y-6">
            <PageHeader
                title="Cartera de Clientes"
                subtitle="Directorio completo de empresas y contactos"
                actionLabel="Nuevo Cliente"
                actionIcon={<Plus className="h-5 w-5" />}
                onAction={() => setIsCreateModalOpen(true)}
            />

            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre de empresa, contacto o email..."
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide uppercase">Cliente</th>
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide uppercase">Contacto</th>
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide uppercase">Origen</th>
                                <th className="px-8 py-5 text-right text-sm font-bold text-[#000D42] tracking-wide uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8">Cargando clientes...</td></tr>
                            ) : displayedClients.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No se encontraron clientes</td></tr>
                            ) : displayedClients.map((client) => (
                                <tr
                                    key={client.id}
                                    className="group hover:bg-blue-50/50 transition-all cursor-pointer border-b border-gray-100 hover:shadow-md hover:scale-[1.01] "
                                    onClick={() => setSelectedClientId(client.id)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#0052CC] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-[#000D42] group-hover:text-[#0066FF] transition-colors">{client.company_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <User size={18} className="text-purple-600" />
                                            </div>
                                            <span className="text-gray-800 font-medium">{client.contact_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${client.origin === 'APP COBUS' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            client.origin === 'WEB' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                            {client.origin || 'MANUAL'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Mail size={16} className="text-blue-600" />
                                                </div>
                                                <span className="text-gray-700">{client.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                                    <Phone size={16} className="text-green-600" />
                                                </div>
                                                <span className="text-gray-700">{client.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => handleEditClick(e, client)}
                                                className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white hover:bg-blue-500 rounded-xl transition-all hover:scale-110 shadow-sm hover:shadow-md"
                                                title="Editar Cliente"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, client.id)}
                                                className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white hover:bg-red-500 rounded-xl transition-all hover:scale-110 shadow-sm hover:shadow-md"
                                                title="Eliminar Cliente"
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
        </div>
    );
}
