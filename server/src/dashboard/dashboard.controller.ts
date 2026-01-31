import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';


@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  // ==================== APPOINTMENTS ====================

  @Get('appointments')
  async getAppointments(
    @Req() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    const userId = req.user.id;
    return this.dashboardService.getAppointments(userId, { from, to, status });
  }

  @Get('appointments/upcoming')
  async getUpcomingAppointments(@Req() req, @Query('limit') limit?: string) {
    const userId = req.user.id;
    return this.dashboardService.getUpcomingAppointments(userId, limit ? parseInt(limit) : 5);
  }

  @Post('appointments')
  async createAppointment(@Req() req, @Body() payload: any) {
    const userId = req.user.id;
    return this.dashboardService.createAppointment(userId, payload);
  }

  @Patch('appointments/:id')
  async updateAppointment(@Param('id') id: string, @Body() payload: any) {
    return this.dashboardService.updateAppointment(id, payload);
  }

  @Patch('appointments/:id/status')
  async updateAppointmentStatus(@Param('id') id: string, @Body() payload: { status: string }) {
    return this.dashboardService.updateAppointmentStatus(id, payload.status);
  }

  @Delete('appointments/:id')
  async deleteAppointment(@Param('id') id: string) {
    return this.dashboardService.deleteAppointment(id);
  }

  // ==================== STATS & REPORTS ====================

  @Get('stats')
  async getUserStats(@Req() req) {
    const userId = req.user.id;
    return this.dashboardService.getUserStats(userId);
  }

  // ==================== KANBAN ====================

  @Get('kanban')
  async getKanbanBoard(@Req() req) {
    const userId = req.user.id;
    return this.dashboardService.getKanbanBoard(userId);
  }

  @Patch('clients/:id/move')
  async moveCard(@Req() req, @Param('id') id: string, @Body() payload: { status: string }) {
    const userId = req.user.id;
    return this.dashboardService.moveCard(userId, id, payload.status);
  }

  // ==================== CLIENTS ====================

  @Post('clients')
  async createClient(@Req() req, @Body() payload: any) {
    const userId = req.user.id;
    return this.dashboardService.createClient(userId, payload);
  }

  @Patch('clients/:id')
  async updateClient(@Param('id') id: string, @Body() payload: any) {
    return this.dashboardService.updateClient(id, payload);
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id') id: string) {
    return this.dashboardService.deleteClient(id);
  }

  @Get('clients/:id')
  async getClientDetails(@Param('id') id: string) {
    return this.dashboardService.getClientDetails(id);
  }

  // ==================== INTERACTIONS ====================

  @Post('interactions')
  async addInteraction(@Req() req, @Body() payload: any) {
    const userId = req.user.id;
    return this.dashboardService.addInteraction(userId, payload);
  }

  @Delete('interactions/:id')
  async deleteInteraction(@Param('id') id: string) {
    return this.dashboardService.deleteInteraction(id);
  }
}