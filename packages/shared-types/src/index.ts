/**
 * @lumen/shared-types
 * Interfaces de dominio centralizadas para Next.js y NestJS.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DEALS (TRATOS)
// ─────────────────────────────────────────────────────────────────────────────

export interface LumenDeal<T = Record<string, any>> {
    id: string;
    title: string;
    stage: string;
    amount: number;
    currency?: string;
    clientId?: string;
    assignedAgentId?: string;
    organizationId?: string; // Multitenancy ready
    expectedCloseDate?: string;
    createdAt?: string;
    updatedAt?: string;
    metadata: T;
}

export type DealStage = 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS (CLIENTES)
// ─────────────────────────────────────────────────────────────────────────────

export interface LumenClient {
    id: string;
    companyName: string;
    contactName: string;
    email?: string;
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOST';
    origin?: string;
    commodity?: string;
    assignedAgentId?: string;
    organizationId?: string; // Multitenancy ready
    assignmentExpiresAt?: string;
    lastInteractionAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS / PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP';

export interface LumenProfile {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    organizationId: string;
    avatarUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATIONS (TENANTS)
// ─────────────────────────────────────────────────────────────────────────────

export interface LumenOrganization {
    id: string;
    name: string;
    domain: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    createdAt: string;
    settings?: Record<string, any>;
}
