export const INTERACTION_TYPES = [
    { value: 'CALL', label: 'Llamada', icon: 'Phone', backendValue: 'CALL', requiresModality: false },
    { value: 'MEETING', label: 'Reunión', icon: 'Calendar', backendValue: 'MEETING', requiresModality: true },
    { value: 'VISIT', label: 'Visita Comercial', icon: 'Briefcase', backendValue: 'MEETING', requiresModality: false, defaultModality: 'IN_PERSON' },
    { value: 'EMAIL', label: 'Correo', icon: 'Mail', backendValue: 'EMAIL', requiresModality: false },
    { value: 'TEXT', label: 'Mensaje de texto', icon: 'MessageSquare', backendValue: 'WHATSAPP', requiresModality: false },
    { value: 'SALE', label: 'Venta Cerrada', icon: 'CheckCircle2', backendValue: 'QUOTE_DECISION', requiresModality: false },
]

export const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'No contactado' },
    { value: 'CONTACTED', label: 'Contactado' },
    { value: 'CITA', label: 'Cita / Reunión' },
    { value: 'PROCESO_COTIZACION', label: 'Cotizando' },
    { value: 'COTIZACION_ENVIADA', label: 'Cotización Enviada' },
    { value: 'CERRADO_GANADO', label: 'Cerrado Ganado' },
    { value: 'CERRADO_PERDIDO', label: 'Perdido' },
]

export const ORIGIN_OPTIONS = [
    { value: 'APP COBUS', label: 'APP COBUS' },
    { value: 'MANUAL', label: 'Manual / Directo' },
    { value: 'REFERIDO', label: 'Referido' },
    { value: 'WEB', label: 'Sitio Web' },
    { value: 'REDES', label: 'Redes Sociales' },
]
