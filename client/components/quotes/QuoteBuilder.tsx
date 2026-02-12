import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteBuilderProps {
    dealId: string;
    onSuccess: () => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ dealId, onSuccess }) => {
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [currency, setCurrency] = useState('USD');
    const [validUntil, setValidUntil] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleChangeItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.quotes.create({
                deal_id: dealId,
                currency_code: currency,
                valid_until: validUntil,
                items: items
            });
            toast.success('Cotización creada exitosamente');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Error al crear la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Nueva Cotización</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Moneda</label>
                    <select
                        className="w-full border rounded p-2"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    >
                        <option value="USD">USD - Dólar Americano</option>
                        <option value="CRC">CRC - Colón Costarricense</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Válido Hasta</label>
                    <input
                        type="date"
                        className="w-full border rounded p-2"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Items</label>
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-center">
                        <input
                            type="text"
                            placeholder="Descripción"
                            className="flex-1 border rounded p-2"
                            value={item.description}
                            onChange={(e) => handleChangeItem(index, 'description', e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Cant."
                            className="w-20 border rounded p-2"
                            value={item.quantity}
                            onChange={(e) => handleChangeItem(index, 'quantity', Number(e.target.value))}
                        />
                        <input
                            type="number"
                            placeholder="Precio Unit."
                            className="w-32 border rounded p-2"
                            value={item.unit_price}
                            onChange={(e) => handleChangeItem(index, 'unit_price', Number(e.target.value))}
                        />
                        <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                    <Plus className="w-4 h-4" /> Agregar Item
                </button>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear Cotización
            </button>
        </div>
    );
};
