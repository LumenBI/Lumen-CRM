import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Loader2, Search, User } from "lucide-react";
import { useApi } from '@/hooks/useApi';
import { Client } from '@/types';

interface ClientAutocompleteProps {
    onSelect: (client: Client) => void;
    placeholder?: string;
    defaultValue?: string;
}

export const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({ onSelect, placeholder = "Buscar cliente...", defaultValue = "" }) => {
    const api = useApi();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(defaultValue);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchClients = async (search: string = "") => {
        setLoading(true);
        try {
            const data = await api.clients.getAll(search);
            // Handle both flat array and paginated response { items: [] }
            const clientsList = Array.isArray(data) ? data : (data?.items || []);
            setClients(clientsList);
        } catch (err) {
            console.error("Failed to fetch clients", err);
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        fetchClients(val);
        setOpen(true);
    };

    const handleFocus = () => {
        if (clients.length === 0) {
            fetchClients("");
        }
        setOpen(true);
    };

    return (
        <div className="relative w-full max-w-sm" ref={wrapperRef}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className="pl-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loading && <div className="p-2 text-sm text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Buscando...</div>}
                    {!loading && clients.length === 0 && <div className="p-2 text-sm text-center text-muted-foreground">No se encontraron clientes.</div>}
                    {!loading && clients.map((client) => (
                        <div
                            key={client.id}
                            className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 flex flex-col gap-0.5 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors"
                            onClick={() => {
                                setQuery(client.company_name);
                                onSelect(client);
                                setOpen(false);
                            }}
                        >
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <User className="h-3 w-3 text-blue-600" />
                                {client.company_name}
                            </div>
                            {client.email && <div className="text-xs text-muted-foreground ml-5">{client.email}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
