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
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get()
    async getAppointments(
        @Req() req,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('status') status?: string,
    ) {
        const token = this.extractToken(req);
        return this.appointmentsService.getAppointments(token, req.user.userId, {
            from,
            to,
            status,
        });
    }

    @Get('upcoming')
    async getUpcomingAppointments(@Req() req, @Query('limit') limit?: number) {
        const token = this.extractToken(req);
        return this.appointmentsService.getUpcomingAppointments(
            token,
            req.user.userId,
            limit ? Number(limit) : 5,
        );
    }

    @Post()
    async createAppointment(@Req() req, @Body() payload: any) {
        const token = this.extractToken(req);
        return this.appointmentsService.createAppointment(
            token,
            req.user.userId,
            payload,
        );
    }

    @Patch(':id')
    async updateAppointment(
        @Req() req,
        @Param('id') id: string,
        @Body() payload: any,
    ) {
        const token = this.extractToken(req);
        return this.appointmentsService.updateAppointment(token, id, payload);
    }

    @Delete(':id')
    async deleteAppointment(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.appointmentsService.deleteAppointment(token, id);
    }

    @Post(':id/cancel')
    async cancelAppointment(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.appointmentsService.cancelAppointment(token, id);
    }

    @Post(':id/finish')
    async finishAppointment(@Req() req, @Param('id') id: string) {
        const token = this.extractToken(req);
        return this.appointmentsService.finishAppointment(token, id);
    }

    @Post(':id/rate')
    async rateAppointment(
        @Req() req,
        @Param('id') id: string,
        @Body() payload: any,
    ) {
        const token = this.extractToken(req);
        return this.appointmentsService.rateAppointment(token, id, payload);
    }

    @Patch(':id/status')
    async updateStatus(
        @Req() req,
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        const token = this.extractToken(req);
        return this.appointmentsService.updateAppointmentStatus(token, id, status);
    }
}