import { LumenDeal } from '@lumen/shared-types';


/**
 * mapToSupabaseDeal — Adaptador Fase 1 (Capa de Anticorrupción).
 *
 * Traduce un `LumenDeal<T>` genérico a la estructura plana que Supabase
 * espera actualmente. Preserva todas las columnas existentes.
 *
 * ELIMINACIÓN EN FASE 2: Cuando se añada la columna JSONB `metadata` a la
 * tabla `deals` en Supabase, esta función se elimina y el objeto se persiste
 * directamente con su forma genérica.
 *
 * @param deal - Un deal en formato genérico LumenDeal
 * @returns Payload plano listo para insertar/actualizar en Supabase
 */
export function mapToSupabaseDeal(deal: Partial<LumenDeal>): Record<string, any> {
    const { id, metadata, ...rest } = deal;

    return {
        // Campos directos del modelo genérico
        ...(id && { id }),
        title: rest.title,
        status: rest.stage,
        value: rest.amount,
        currency: rest.currency,
        client_id: rest.clientId,
        assigned_agent_id: rest.assignedAgentId,
        expected_close_date: rest.expectedCloseDate,

        // Metadata aplanada: en Fase 1, los campos de metadata se mapean
        // a columnas específicas en la DB logística.
        // TODO Fase 2: reemplazar por `metadata: JSON.stringify(metadata)`
        ...(metadata?.shipmentType && { type: metadata.shipmentType }),
        ...(metadata?.origin && { origin: metadata.origin }),
        ...(metadata?.destination && { destination: metadata.destination }),
    };
}

/**
 * mapFromSupabaseDeal — Traduce un registro plano de Supabase a LumenDeal<T>.
 *
 * INVERSIÓN DEL ADAPTADOR: Permite que los servicios trabajen siempre
 * con el modelo genérico, independientemente del esquema de DB.
 */
export function mapFromSupabaseDeal(row: Record<string, any>): LumenDeal {
    return {
        id: row.id,
        title: row.title,
        stage: row.status,
        amount: row.value ?? 0,
        currency: row.currency,
        clientId: row.client_id,
        assignedAgentId: row.assigned_agent_id,
        expectedCloseDate: row.expected_close_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Reconstruye metadata desde columnas planas (Fase 1)
        metadata: {
            shipmentType: row.type,
            origin: row.origin,
            destination: row.destination,
        },
    };
}
