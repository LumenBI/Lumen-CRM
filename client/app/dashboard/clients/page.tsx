'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Plus, Building2, User, Phone, Mail, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import NewTrackingModal from '@/components/kanban/NewTrackingModal';
import ClientModal from '@/components/ClientModal';
import EditClientModal from '@/components/clients/EditClientModal';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Client {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    status: string;
    created_at: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State for viewing/editing
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    // Alert Modal State
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

    // Confirm Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        clientId: string | null;
    }>({
        isOpen: false,
        clientId: null
    });

    // Loading state for deletion
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    const fetchClients = async (query = '') => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients?query=${query}`, {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch clients');
            const data = await res.json();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchClients(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

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
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/clients/${confirmState.clientId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al eliminar cliente');
            }

            // Success
            fetchClients(searchTerm);
            setConfirmState({ isOpen: false, clientId: null });

            // Show success alert
            setAlertState({
                isOpen: true,
                title: '¡Cliente Eliminado!',
                message: 'El cliente ha sido eliminado correctamente de la base de datos.',
                type: 'success'
            });
        } catch (error: any) {
            console.error("Error deleting client", error);
            // Close confirm modal first
            setConfirmState({ isOpen: false, clientId: null });
            // Show error alert
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
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#000D42] to-[#0066FF] rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Cartera de Clientes</h1>
                        <p className="text-blue-100 text-lg">Directorio completo de empresas y contactos</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-[#0066FF] px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de empresa, contacto o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#0066FF] focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide">EMPRESA</th>
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide">CONTACTO</th>
                                <th className="px-8 py-5 text-left text-sm font-bold text-[#000D42] tracking-wide">INFORMACIÓN</th>
                                <th className="px-8 py-5 text-right text-sm font-bold text-[#000D42] tracking-wide">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-8">Cargando clientes...</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No se encontraron clientes</td></tr>
                            ) : clients.map((client) => (
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

            {/* Modal for Alerts */}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            {/* Modal for Confirmation */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false, clientId: null })}
                onConfirm={executeDelete}
                title="¿Eliminar Cliente?"
                message="Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este cliente permanentemente?"
                isLoading={isDeleting}
            />

            {isCreateModalOpen && (
                <NewTrackingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => fetchClients(searchTerm)}
                    initialMode="create"
                />
            )}

            {selectedClientId && (
                <ClientModal
                    clientId={selectedClientId}
                    onClose={() => setSelectedClientId(null)}
                />
            )}

            {clientToEdit && (
                <EditClientModal
                    client={clientToEdit}
                    onClose={() => setClientToEdit(null)}
                    onSuccess={() => {
                        fetchClients(searchTerm); // Refresh list
                        setAlertState({
                            isOpen: true,
                            title: '¡Actualización Exitosa!',
                            message: 'Los datos del cliente han sido actualizados correctamente.',
                            type: 'success'
                        });
                    }}
                />
            )}
        </div>
    );
}
