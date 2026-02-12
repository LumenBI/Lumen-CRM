import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { AiService } from './ai.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    // Helper to validate token (simplified for now, ideally use a Guard)
    private getClient(token: string) {
        if (!token) throw new UnauthorizedException();
        // In a real app, verify token with Supabase
        return true;
    }

    @Post('smart-draft')
    async generateDraft(@Headers('Authorization') token: string, @Body() body: any) {
        this.getClient(token);
        const draft = await this.aiService.generateQuoteEmail(body);
        return { draft };
    }

    @Post('price-audit')
    async auditPrices(@Headers('Authorization') token: string, @Body() body: { items: any[] }) {
        this.getClient(token);
        const alert = await this.aiService.checkPriceAnomalies(body.items);
        return { alert };
    }

    @Post('jargon-buster')
    async explainTerms(@Headers('Authorization') token: string, @Body() body: { items: any[] }) {
        this.getClient(token);
        const glossary = await this.aiService.explainQuoteTerms(body.items);
        return glossary;
    }
}
