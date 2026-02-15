import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get('list')
    async getClientsList(
        @Req() req,
        @Query('query') query?: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: number,
        @Query('mine') mine?: string,
    ) {
        const token = this.extractToken(req);
        return this.clientsService.getClientsList(
            token,
            req.user.userId,
            query || '',
            cursor,
            limit ? Number(limit) : 50,
            mine === 'true',
        );
    }

    @Get(':id')
    async getClientDetails(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.clientsService.getClientDetails(token, id);
    }

    @Post()
    async createClient(@Req() req, @Body() payload: any) {
        const token = this.extractToken(req);
        return this.clientsService.createClient(token, req.user.userId, payload);
    }

    @Patch(':id')
    async updateClient(
        @Req() req,
        @Param('id') id: string,
        @Body() payload: any,
    ) {
        const token = this.extractToken(req);
        return this.clientsService.updateClient(token, id, payload);
    }

    @Delete(':id')
    async deleteClient(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.clientsService.deleteClient(token, id);
    }

    @Post('interactions')
    async createInteraction(@Req() req, @Body() payload: any) {
        const token = this.extractToken(req);
        return this.clientsService.addInteraction(token, req.user.userId, payload);
    }

    @Delete('interactions/:id')
    async deleteInteraction(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.clientsService.deleteInteraction(token, id);
    }
}
