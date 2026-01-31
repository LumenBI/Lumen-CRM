export const INTERACTION_TYPES = [
    { value: 'CALL', label: 'Llamada', icon: 'Phone', backendValue: 'CALL' },
    { value: 'MEETING', label: 'Reunión / Visita', icon: 'Calendar', backendValue: 'MEETING' },
    { value: 'EMAIL', label: 'Correo', icon: 'Mail', backendValue: 'EMAIL' },
    { value: 'TEXT', label: 'Mensaje de texto', icon: 'MessageSquare', backendValue: 'SMS' },
    { value: 'SALE', label: 'Venta Cerrada', icon: 'CheckCircle2', backendValue: 'QUOTE_DECISION' },
]

export const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Prospecto (No contactado)' },
    { value: 'CONTACTED', label: 'Contactado' },
    { value: 'IN_NEGOTIATION', label: 'En Negociación' },
    { value: 'CLOSED_WON', label: 'Cerrado Ganado' },
    { value: 'CLOSED_LOST', label: 'Perdido' },
]
