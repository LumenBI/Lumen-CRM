
export const APP_NAME = 'Star CRM'

export const TEXTS = {
    // Titles
    DASHBOARD_TITLE: 'Panel de control',
    SALES_FLOW_TITLE: 'Seguimientos',
    CALENDAR_TITLE: 'Agenda de citas',
    CLIENTS_TITLE: 'Clientes',
    USERS_TITLE: 'Usuarios',
    NEW_ACTIVITY_TITLE: 'Nueva actividad',
    REPORTS_TITLE: 'Reportes y analíticas',

    // Actions
    NEW_CLIENT: 'Nuevo cliente',
    EDIT_CLIENT: 'Editar cliente',
    DELETE_CLIENT: 'Eliminar cliente',

    NEW_DEAL: 'Nuevo seguimiento',
    EDIT_DEAL: 'Editar seguimiento',

    NEW_APPOINTMENT: 'Nueva cita',
    EDIT_APPOINTMENT: 'Editar cita',
    SCHEDULE_APPOINTMENT: 'Agendar cita',

    NEW_USER: 'Nuevo usuario',
    INVITE_USER: 'Invitar usuario',

    // Common
    SEARCH: 'Buscar...',
    SEARCH_CLIENT: 'Buscar cliente...',
    LOGOUT: 'Cerrar sesión',
    SETTINGS: 'Configuración',
    PROFILE: 'Perfil',
    NOTIFICATIONS: 'Notificaciones',
    QUICK_ACTIONS: 'Acciones rápidas',
    SEE_ALL: 'Ver todos',
    WELCOME_BACK: 'Bienvenido de nuevo, aquí está lo que sucede hoy.',

    // Dashboard Cards
    NEW_PROSPECTS: 'Nuevos clientes',
    INTERACTIONS: 'Interacciones',
    COMMERCIAL_VISITS: 'Visitas comerciales',
    CLOSED_SALES: 'Ventas cerradas',
    RECENT_ACTIVITY: 'Actividad reciente',
    UPCOMING_APPOINTMENTS: 'Próximas citas',
    PERFORMANCE_CHART: 'Gráfico de rendimiento',
    COMING_SOON: 'Próximamente',

    // Modals
    CREATE_NEW: 'Crear nuevo',
    SEARCH_EXISTING: 'Buscar existente',
    CANCEL: 'Cancelar',
    SAVE: 'Guardar',
    CONFIRM: 'Confirmar',
}

import {
    LucideLayoutDashboard,
    LucideKanban,
    LucideCalendar,
    LucideUsers,
    LucideBarChart3,
    LucideSettings,
    LucideMail,
} from 'lucide-react'

export interface MenuItem {
    name: string
    href: string
    icon: typeof LucideLayoutDashboard
}

export const MENU_ITEMS: MenuItem[] = [
    { name: 'Resumen', href: '/dashboard', icon: LucideLayoutDashboard },
    { name: 'Ventas', href: '/dashboard/kanban', icon: LucideKanban },
    { name: 'Agenda', href: '/dashboard/citas', icon: LucideCalendar },
    { name: 'Clientes', href: '/dashboard/clients', icon: LucideUsers },
    { name: 'Buzón', href: '/dashboard/mail', icon: LucideMail },
    { name: 'Reportes', href: '/dashboard/reports', icon: LucideBarChart3 },
]

export const SYSTEM_ITEMS: MenuItem[] = [
    { name: 'Usuarios', href: '/dashboard/users', icon: LucideSettings },
    { name: 'Configuración', href: '/dashboard/settings', icon: LucideSettings },
]

export const NAVIGATION_LABELS = {
    SUMMARY: 'Resumen',
    SALES: 'Ventas',
    CALENDAR: 'Agenda',
    CLIENTS: 'Clientes',
    USERS: 'Usuarios',
    REPORTS: 'Reportes',
    SETTINGS: 'Configuración',
}
