import { Controller, Get, Post, Put, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Post()
    async createQuote(
        @Headers('authorization') token: string,
        @Body() body: any
    ) {
        if (!token) throw new UnauthorizedException('Missing token');
        return this.quotesService.createQuote(token, body);
    }

    @Get('deal/:dealId')
    async getQuotesByDeal(
        @Headers('authorization') token: string,
        @Param('dealId') dealId: string
    ) {
        if (!token) throw new UnauthorizedException('Missing token');
        return this.quotesService.getQuotesByDeal(token, dealId);
    }

    @Get(':id')
    async getQuote(
        @Headers('authorization') token: string,
        @Param('id') id: string
    ) {
        if (!token) throw new UnauthorizedException('Missing token');
        return this.quotesService.getQuote(token, id);
    }

    @Put(':id/status')
    async updateStatus(
        @Headers('authorization') token: string,
        @Param('id') id: string,
        @Body() body: { status: string, pdfUrl?: string }
    ) {
        if (!token) throw new UnauthorizedException('Missing token');
        return this.quotesService.updateQuoteStatus(token, id, body.status, body.pdfUrl);
    }
}
