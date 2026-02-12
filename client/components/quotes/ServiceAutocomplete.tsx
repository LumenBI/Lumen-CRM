import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Using existing Input component
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    description?: string;
}

interface ServiceAutocompleteProps {
    onSelect: (product: Product) => void;
    token?: string;
}

export const ServiceAutocomplete: React.FC<ServiceAutocompleteProps> = ({ onSelect, token }) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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
    }, [wrapperRef]);

    const fetchProducts = async (search: string) => {
        setLoading(true);
        try {
            // Use environment variable or default to localhost
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${apiUrl}/quotes/products?search=${search}`, {
                headers: { Authorization: token || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue(val);
        if (val.length > 2) {
            fetchProducts(val);
            setOpen(true);
        }
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="flex gap-2">
                <Input
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => { if (products.length > 0) setOpen(true); }}
                    placeholder="Search service..."
                    className="w-full"
                />
            </div>

            {open && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {loading && <div className="p-2 text-sm text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading...</div>}
                    {!loading && products.length === 0 && <div className="p-2 text-sm text-center text-muted-foreground">No services found.</div>}
                    {!loading && products.map((product) => (
                        <div
                            key={product.id}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                            onClick={() => {
                                onSelect(product);
                                setValue(product.name);
                                setOpen(false);
                            }}
                        >
                            <span>{product.name}</span>
                            <span className="text-xs text-muted-foreground text-right">${product.price}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
