import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
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
    async getAppointments(@Req() req) {
        const token = this.extractToken(req);
        return this.appointmentsService.getAppointments(token, req.user.userId);
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
}
