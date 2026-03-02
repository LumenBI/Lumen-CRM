import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SmartDraftDto } from './dto/ai.dto';
import { AppConfigService } from '../common/config/app-config.service';

const AI_TIMEOUT_MS = 12_000;

/** Wraps a promise in a race with a timeout. Throws if the timeout wins. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`AI timeout after ${ms}ms [${label}]`)), ms),
  );
  return Promise.race([promise, timeout]);
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private google;

  constructor(private readonly appConfig: AppConfigService) {
    this.google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  async generateQuoteEmail(data: SmartDraftDto): Promise<string> {
    if (!process.env.GEMINI_API_KEY) return 'AI Service not configured.';

    const [systemPrompt, companyName] = await Promise.all([
      this.appConfig.getSystemPrompt(),
      this.appConfig.getCompanyName(),
    ]);

    const prompt = `
            ${systemPrompt}
            
            Redacta un correo electrónico formal y profesional para enviar la cotización #${data.quote_number || 'Pendiente'}.
            
            Información de la Cotización:
            - Cliente: ${data.company_name}
            - Contacto: ${data.contact_person || 'No especificado'}
            - Servicios: ${data.items.map((i: any) => i.description).join(', ')}
            - Total: ${data.total_amount ? (data.currency || 'USD') + ' ' + data.total_amount.toLocaleString() : 'Ver adjunto'}
            - Vigencia: ${data.valid_until || 'No especificada'}
            - Notas adicionales: ${data.notes || 'Ninguna'}
            
            Instrucciones de Redacción:
            1. Saluda cordialmente al cliente.
            2. Menciona claramente que se adjunta la cotización formal en formato PDF.
            3. Destaca que los precios son válidos hasta el ${data.valid_until || 'la fecha indicada en el documento'}.
            4. El tono debe ser profesional, servicial y transmitir confianza.
            5. Sé conciso pero completo.
            6. IMPORTANTE: Devuelve ÚNICAMENTE el cuerpo del mensaje. No incluyas asunto, despedidas automáticas de IA ni comentarios adicionales.
        `;

    try {
      const { text } = await withTimeout(
        generateText({ model: this.google('gemini-pro'), prompt }),
        AI_TIMEOUT_MS,
        'generateQuoteEmail',
      );
      return text.trim();
    } catch (error) {
      this.logger.error('Error generating email draft', error.message);
      return `Estimado cliente de ${data.company_name},\n\nEs un gusto saludarle. Adjunto encontrará la cotización formal #${data.quote_number || ''} solicitada.\n\nQuedamos a su entera disposición para cualquier duda o para proceder con la confirmación.\n\nSaludos cordiales,\n${companyName}.`;
    }
  }

  async checkPriceAnomalies(items: any[]): Promise<string | null> {
    if (!process.env.GEMINI_API_KEY) return null;

    const systemPrompt = await this.appConfig.getSystemPrompt();

    const prompt = `
            ${systemPrompt}
            
            Analiza estos ítems de una cotización y detecta posibles precios erróneos (muy bajos o absurdos para el tipo de servicio):
            ${JSON.stringify(items)}
            
            Reglas:
            - Si ves algo sospechoso (ej. precio $0 en un servicio, cantidad negativa), alerta.
            - Si todo parece razonable, responde "OK".
            - Si hay alerta, responde con un mensaje corto de advertencia (máx 15 palabras).
        `;

    try {
      const { text } = await withTimeout(
        generateText({ model: this.google('gemini-pro'), prompt }),
        AI_TIMEOUT_MS,
        'checkPriceAnomalies',
      );
      const result = text.trim();
      return result === 'OK' ? null : result;
    } catch (error) {
      this.logger.warn('AI price check timed out or failed', error.message);
      return null;
    }
  }

  async explainQuoteTerms(
    items: any[],
  ): Promise<{ term: string; definition: string }[]> {
    if (!process.env.GEMINI_API_KEY) return [];

    const systemPrompt = await this.appConfig.getSystemPrompt();

    const prompt = `
            ${systemPrompt}
            
            Identifica términos técnicos o especializados en esta lista de descripciones:
            ${items.map((i: any) => i.description).join(', ')}
            
            Para cada término difícil de entender para un cliente nuevo, da una definición muy breve (10 palabras).
            Devuelve un JSON válido array de objetos: [{"term": "NOMBRE", "definition": "Definición breve."}]
            Si no hay términos complejos, devuelve [].
            Responde SOLO EL JSON.
        `;

    try {
      const { text } = await withTimeout(
        generateText({ model: this.google('gemini-pro'), prompt }),
        AI_TIMEOUT_MS,
        'explainQuoteTerms',
      );
      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Error generating glossary', error.message);
      return [];
    }
  }
}
