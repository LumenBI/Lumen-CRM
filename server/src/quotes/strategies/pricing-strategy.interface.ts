import { QuoteItemDto } from '../../quotes/dto/create-quote.dto';

/**
 * PricingStrategy — Interfaz base del patrón Strategy para lógica de precios.
 *
 * Cada tenant/industria puede registrar su propia implementación.
 * El `QuotesService` no necesita saber qué estrategia está activa —
 * simplemente delega el cálculo y la validación.
 *
 * En Fase 2, la estrategia se resuelve dinámicamente vía `tenantId`.
 */
export interface PricingStrategy {
    /**
     * Calcula el importe total de los ítems de una cotización.
     * @param items - Lista de ítems de la cotización
     * @returns Total sin aplicar impuesto (el impuesto se aplica por ítem si `tax_rate` > 0)
     */
    calculateTotal(items: QuoteItemDto[]): number;

    /**
     * Valida los ítems antes de persistir la cotización.
     * @returns `null` si los ítems son válidos; string descriptivo del error si no.
     */
    validateItems(items: QuoteItemDto[]): string | null;
}
