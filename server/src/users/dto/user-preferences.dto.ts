export class ChannelPreferences {
    inApp: boolean; // Notificaciones en el dashboard
    email: boolean; // Correos electrónicos (Future proofing)
}

export class CategoryPreferences {
    appointments: ChannelPreferences;
    deals: ChannelPreferences;
    follows: ChannelPreferences;
}

export class UserPreferences {
    personal: CategoryPreferences; // Mis acciones
    team: CategoryPreferences;     // Acciones de mis subordinados
}
