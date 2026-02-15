import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SmartDraftDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private google;

  constructor() {
    this.google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  async generateQuoteEmail(data: SmartDraftDto): Promise<string> {
    if (!process.env.GEMINI_API_KEY) return 'AI Service not configured.';

    const prompt = `
            Actúa como un agente logístico experto de Star Cargo (Logística Internacional).
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
            3. Explica que los fletes internacionales están sujetos a disponibilidad de espacio y equipo al momento de la reserva.
            4. Destaca que los precios son válidos hasta el ${data.valid_until || 'la fecha indicada en el documento'}.
            5. El tono debe ser profesional, servicial y transmitir confianza.
            6. Sé conciso pero completo.
            7. IMPORTANTE: Devuelve ÚNICAMENTE el cuerpo del mensaje. No incluyas asunto, despedidas automáticas de IA ni comentarios adicionales.
        `;

    try {
      const { text } = await generateText({
        model: this.google('gemini-pro'),
        prompt: prompt,
      });
      return text.trim();
    } catch (error) {
      this.logger.error('Error generating email draft', error);
      return `Estimado cliente de ${data.company_name},\n\nEs un gusto saludarle. Adjunto encontrará la cotización formal #${data.quote_number || ''} solicitada para sus servicios logísticos.\n\nQuedamos a su entera disposición para cualquier duda o para proceder con la reserva.\n\nSaludos cordiales,\nStar Cargo Service.`;
    }
  }

  async checkPriceAnomalies(items: any[]): Promise<string | null> {
    if (!process.env.GEMINI_API_KEY) return null;

    const prompt = `
            Analiza estos ítems de una cotización logística internacional y detecta posibles precios erróneos (muy bajos o absurdos):
            ${JSON.stringify(items)}
            
            Reglas:
            - Fletes marítimos internacionales usualmente > $500.
            - Gastos locales usualmente > $50.
            - Si ves algo sospechoso (ej. Flete a $10, o $0), alerta.
            - Si todo parece bien, responde "OK".
            - Si hay alerta, responde con un mensaje corto de advertencia (máx 15 palabras).
        `;

    try {
      const { text } = await generateText({
        model: this.google('gemini-pro'),
        prompt: prompt,
      });
      const result = text.trim();
      return result === 'OK' ? null : result;
    } catch (error) {
      return null;
    }
  }

  async explainQuoteTerms(
    items: any[],
  ): Promise<{ term: string; definition: string }[]> {
    if (!process.env.GEMINI_API_KEY) return [];

    const prompt = `
            Identifica términos técnicos logísticos (Incoterms, recargos, siglas como THC, B/L, VGM) en esta lista:
            ${items.map((i: any) => i.description).join(', ')}
            
            Para cada término difícil, da una definición muy breve (10 palabras) para un cliente novato.
            Devuelve un JSON válido array de objetos: [{"term": "THC", "definition": "Costo de manipulación en puerto."}]
            Si no hay términos complejos, devuelve [].
            Responde SOLO EL JSON.
        `;

    try {
      const { text } = await generateText({
        model: this.google('gemini-pro'),
        prompt: prompt,
      });
      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Error generating glossary', error);
      return [];
    }
  }
}