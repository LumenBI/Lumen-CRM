import { Controller, Get, Patch, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { SlackSignatureGuard } from '../security/slack-signature.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get('check')
    @UseGuards(AuthGuard('jwt'))
    async checkNotifications(@Req() req) {
        const token = this.extractToken(req);
        return this.notificationsService.checkSystemNotifications(
            token,
            req.user.userId,
        );
    }

    @Patch('interval')
    @UseGuards(AuthGuard('jwt'))
    async updateInterval(@Req() req, @Param('minutes') minutes: number) {
        const token = this.extractToken(req);
        return this.notificationsService.updateNotificationInterval(
            token,
            req.user.userId,
            minutes,
        );
    }

    @Post('client-error')
    async reportClientError(@Body() payload: { message: string; stack: string; user?: string; device?: string }) {
        const context = `Modulo: FRONTEND\nUsuario: ${payload.user || 'Desconocido'}\nDispositivo: ${payload.device || 'N/A'}`;
        await this.notificationsService.notifySlackError(
            { message: payload.message, stack: payload.stack },
            context,
            { type: 'FRONTEND', severity: 'WARN' }
        );
        return { success: true };
    }

    @Post('slack/commands')
    @UseGuards(SlackSignatureGuard)
    async handleSlackCommand(@Body() body: any) {
        const { command, text, user_name } = body;

        if (command === '/anuncio') {
            await this.notificationsService.notifyAllUsers(
                'SYSTEM_UPDATE',
                `${text} (Enviado por ${user_name} desde Slack)`,
                '/dashboard'
            );
            return {
                response_type: 'in_channel',
                text: `✅ Anuncio enviado correctamente al CRM: "${text}"`,
            };
        }

        return {
            response_type: 'ephemeral',
            text: `Comando ${command} no reconocido.`,
        };
    }
}
