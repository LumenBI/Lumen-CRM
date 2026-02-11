export const INTERACTION_TYPES = [
    { value: 'CALL', label: 'Llamada', icon: 'Phone', backendValue: 'CALL', requiresModality: false },
    { value: 'MEETING', label: 'Reunión', icon: 'Calendar', backendValue: 'MEETING', requiresModality: true },
    { value: 'VISIT', label: 'Visita comercial', icon: 'Briefcase', backendValue: 'MEETING', requiresModality: false, defaultModality: 'IN_PERSON' },
    { value: 'EMAIL', label: 'Correo', icon: 'Mail', backendValue: 'EMAIL', requiresModality: false },
    { value: 'TEXT', label: 'Mensaje de texto', icon: 'MessageSquare', backendValue: 'WHATSAPP', requiresModality: false },
    { value: 'SALE', label: 'Venta cerrada', icon: 'CheckCircle2', backendValue: 'QUOTE_DECISION', requiresModality: false },
]

export const ORIGIN_OPTIONS = [
    { value: 'APP COBUS', label: 'APP COBUS' },
    { value: 'MANUAL', label: 'Manual / Directo' },
    { value: 'REFERIDO', label: 'Referido' },
    { value: 'WEB', label: 'Sitio web' },
    { value: 'REDES', label: 'Redes sociales' },
]
