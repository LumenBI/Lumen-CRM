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
import { DealsService } from './deals.service';

@Controller('deals')
@UseGuards(AuthGuard('jwt'))
export class DealsController {
    constructor(private readonly dealsService: DealsService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get('column')
    async getDealsByColumn(
        @Req() req,
        @Query('stageId') stageId: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: number,
        @Query('agentId') agentId?: string,
    ) {
        const token = this.extractToken(req);
        return this.dealsService.getDealsByColumn(
            token,
            req.user.userId,
            stageId,
            cursor,
            limit ? Number(limit) : 20,
            agentId,
        );
    }

    @Get()
    async getDeals(@Req() req, @Query('clientId') clientId: string) {
        const token = this.extractToken(req);
        return this.dealsService.getDeals(token, req.user.userId, clientId);
    }

    @Post()
    async createDeal(@Req() req, @Body() payload: any) {
        const token = this.extractToken(req);
        return this.dealsService.createDeal(token, req.user.userId, payload);
    }

    @Patch(':id')
    async updateDeal(@Req() req, @Param('id') id: string, @Body() payload: any) {
        const token = this.extractToken(req);
        return this.dealsService.updateDeal(token, id, payload);
    }

    @Patch(':id/move')
    async moveCard(
        @Req() req,
        @Param('id') dealId: string,
        @Body('status') newStatus: string,
    ) {
        const token = this.extractToken(req);
        return this.dealsService.moveCard(
            token,
            req.user.userId,
            dealId,
            newStatus,
        );
    }

    @Delete(':id')
    async deleteDeal(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.dealsService.deleteDeal(token, id);
    }
}
