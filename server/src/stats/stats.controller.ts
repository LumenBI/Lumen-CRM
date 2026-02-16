import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get()
    async getDashboardStats(@Req() req) {
        const token = this.extractToken(req);
        return this.statsService.getBootstrapData(token, req.user.userId);
    }

    @Get('history')
    async getHistory(@Req() req) {
        const token = this.extractToken(req);
        return this.statsService.getHistory(token);
    }

    @Get('kanban')
    async getKanban(@Req() req) {
        const token = this.extractToken(req);
        // We'll use the deals service directly or via stats service
        // Since stats service already has deals service, let's add it there or use it directly
        // I'll add a passthrough in stats service for consistency
        return this.statsService.getKanban(token, req.user.userId);
    }
}
