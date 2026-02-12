import { Controller, Get, Post, Put, Body, Param, Headers, UseGuards, Req } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';

@Controller('quotes')
@UseGuards(AuthGuard('jwt'))
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Post()
    async createQuote(
        @Headers('authorization') token: string,
        @Body() body: CreateQuoteDto
    ) {
        return this.quotesService.createQuote(token, body);
    }

    @Get('deal/:dealId')
    async getQuotesByDeal(
        @Headers('authorization') token: string,
        @Param('dealId') dealId: string
    ) {
        return this.quotesService.getQuotesByDeal(token, dealId);
    }

    @Get(':id')
    async getQuote(
        @Headers('authorization') token: string,
        @Param('id') id: string
    ) {
        return this.quotesService.getQuote(token, id);
    }

    @Put(':id/status')
    async updateStatus(
        @Headers('authorization') token: string,
        @Param('id') id: string,
        @Body() body: UpdateQuoteStatusDto
    ) {
        return this.quotesService.updateQuoteStatus(token, id, body.status, body.pdfUrl);
    }
}

