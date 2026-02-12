import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;

    constructor() {
        // Assuming GEMINI_API_KEY is in env
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }

    private getModel() {
        return this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    async generateQuoteEmail(data: any): Promise<string> {
        if (!process.env.GEMINI_API_KEY) return "AI Service not configured.";

        const prompt = `
            Actúa como un agente logístico experto de Star Cargo (Logística Internacional).
            Redacta un correo electrónico formal y profesional para enviar la cotización #${data.quote_number || 'BORRADOR'}.
            Datos del cliente: ${data.client_name || 'Estimado Cliente'}.
            Servicios cotizados: ${data.items.map((i: any) => i.description).join(', ')}.
            Validez: ${data.valid_until}.
            Moneda: ${data.currency}.
            
            Instrucciones:
            - Sé conciso pero cordial.
            - Destaca que los fletes internacionales están sujetos a espacio y equipo.
            - Menciona que la cotización se adjunta en PDF.
            - NO inventes valores no provistos.
            - El tono debe ser de urgencia moderada debido a la volatilidad del mercado.
            - Devuelve SOLO el cuerpo del correo en texto plano, sin saludos genéricos de IA como "Aquí tienes el correo".
        `;

        try {
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            this.logger.error("Error generating email draft", error);
            return "Estimado Cliente,\n\nAdjunto encontrará la cotización solicitada.\n\nSaludos,\nStar Cargo.";
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
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            return text === "OK" ? null : text;
        } catch (error) {
            return null;
        }
    }

    async explainQuoteTerms(items: any[]): Promise<{ term: string, definition: string }[]> {
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
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);
        } catch (error) {
            this.logger.error("Error generating glossary", error);
            return [];
        }
    }
}
