import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';

interface EmailThreadsProps {
    clientEmail: string;
}

export const EmailThreads: React.FC<EmailThreadsProps> = ({ clientEmail }) => {
    const api = useApi();
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!clientEmail) return;

        const fetchThreads = async () => {
            setLoading(true);
            try {
                const data = await api.mail.getThreads(clientEmail);
                setThreads(data || []);
            } catch (error) {
                console.error('Error fetching threads:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchThreads();
    }, [clientEmail, api.mail]);

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!threads.length) return <div className="p-4 text-gray-500">No hay correos recientes.</div>;

    return (
        <div className="space-y-4">
            {threads.map((thread) => (
                <div key={thread.id} className="border p-3 rounded hover:bg-gray-50 bg-white shadow-sm">
                    <div className="font-semibold text-sm truncate">{thread.snippet || 'Sin contenido previo'}</div>
                    <div className="text-xs text-gray-400 mt-1">ID: {thread.id}</div>
                    {/* Here you could expand to show full messages */}
                </div>
            ))}
        </div>
    );
};
