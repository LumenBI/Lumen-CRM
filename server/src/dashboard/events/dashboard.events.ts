export class AppointmentCreatedEvent {
    constructor(
        public readonly appointment: any,
        public readonly creatorId: string,
        public readonly creatorEmail: string
    ) { }
}

export class DealCreatedEvent {
    constructor(
        public readonly deal: any,
        public readonly creatorId: string,
        public readonly creatorEmail: string
    ) { }
}

export class InteractionCreatedEvent {
    constructor(
        public readonly interaction: any,
        public readonly creatorId: string
    ) { }
}
