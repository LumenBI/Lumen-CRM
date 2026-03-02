import { Injectable } from '@nestjs/common';
import { PricingStrategy } from './pricing-strategy.interface';
import { QuoteItemDto } from '../dto/create-quote.dto';

/**
 * DefaultPricingStrategy — Implementación genérica del patrón Strategy.
 *
 * Contiene la lógica de cotización que anteriormente estaba dispersa dentro
 * de `QuotesService`. Representa la industria "por defecto" (sin reglas especiales).
 *
 * En Fase 2, esta estrategia se registrará como predeterminada en un registro
 * de estrategias indexado por `tenantId`.
 *
 * Para agregar lógica específica de logística, inmobiliaria, etc.:
 *   1. Implementa `PricingStrategy`.
 *   2. Registra la nueva clase en `QuotesModule`.
 *   3. El `QuotesService` la resolverá automáticamente.
 */
@Injectable()
export class DefaultPricingStrategy implements PricingStrategy {
    /**
     * Suma precio × cantidad por ítem. No aplica impuesto global —
     * cada ítem declara su propio `tax_rate`.
     */
    calculateTotal(items: QuoteItemDto[]): number {
        return items.reduce((sum, item) => {
            const lineTotal = item.unit_price * item.quantity;
            const taxMultiplier = 1 + (item.tax_rate ?? 0) / 100;
            return sum + lineTotal * taxMultiplier;
        }, 0);
    }

    /**
     * Validación básica: ningún ítem con precio negativo.
     * @returns Mensaje de error o `null` si es válido.
     */
    validateItems(items: QuoteItemDto[]): string | null {
        for (const item of items) {
            if (item.unit_price < 0) {
                return `El precio unitario de "${item.description}" no puede ser negativo.`;
            }
            if (item.quantity <= 0) {
                return `La cantidad de "${item.description}" debe ser mayor a 0.`;
            }
        }
        return null;
    }
}
