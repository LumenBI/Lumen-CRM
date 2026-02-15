import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get('check')
    async checkNotifications(@Req() req) {
        const token = this.extractToken(req);
        return this.notificationsService.checkSystemNotifications(
            token,
            req.user.userId,
        );
    }

    @Patch('interval')
    async updateInterval(@Req() req, @Param('minutes') minutes: number) {
        const token = this.extractToken(req);
        return this.notificationsService.updateNotificationInterval(
            token,
            req.user.userId,
            minutes,
        );
    }
}
