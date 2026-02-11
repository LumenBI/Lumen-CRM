import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';


@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  private extractToken(req: any): string {
    const rawHeader = req.headers.authorization;
    return rawHeader ? rawHeader.split(' ')[1] : '';
  }

  // ==================== APPOINTMENTS ====================

  @Get('appointments')
  async getAppointments(
    @Req() req,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status: string,
  ) {
    const token = this.extractToken(req);
    return this.dashboardService.getAppointments(token, req.user.userId, { from, to, status });
  }

  @Get('appointments/upcoming')
  async getUpcomingAppointments(@Req() req, @Query('limit') limit: number) {
    const token = this.extractToken(req);
    return this.dashboardService.getUpcomingAppointments(token, req.user.userId, limit);
  }

  @Post('appointments')
  async createAppointment(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.createAppointment(token, req.user.userId, payload);
  }

  @Patch('appointments/:id')
  async updateAppointment(@Req() req, @Param('id') id: string, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.updateAppointment(token, id, payload);
  }

  @Patch('appointments/:id/status')
  async updateAppointmentStatus(@Req() req, @Param('id') id: string, @Body('status') status: string) {
    const token = this.extractToken(req);
    return this.dashboardService.updateAppointmentStatus(token, id, status);
  }

  @Delete('appointments/:id')
  async deleteAppointment(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
    return this.dashboardService.deleteAppointment(token, id);
  }

  // ==================== NOTIFICATIONS ====================

  @Get('notifications/check')
  async checkSystemNotifications(@Req() req) {
    const token = this.extractToken(req);
    return this.dashboardService.checkSystemNotifications(token, req.user.userId);
  }

  // ==================== STATS & REPORTS ====================

  @Get('stats')
  async getUserStats(@Req() req) {
    const token = this.extractToken(req);
    const userId = req.user.userId;
    return this.dashboardService.getUserStats(token, userId);
  }

  @Get('history')
  async getHistory(@Req() req) {
    const token = this.extractToken(req);
    return this.dashboardService.getHistory(token);
  }

  // ==================== KANBAN ====================

  @Get('kanban')
  async getKanbanBoard(@Req() req) {
    const token = this.extractToken(req);
    return this.dashboardService.getKanbanBoard(token, req.user.userId);
  }

  @Patch('deals/:id/move')
  async moveCard(@Req() req, @Param('id') dealId: string, @Body('status') newStatus: string) {
    const token = this.extractToken(req);
    return this.dashboardService.moveCard(token, req.user.userId, dealId, newStatus);
  }

  // ==================== CLIENTS ====================

  @Get('clients')
  async getClients(@Req() req, @Query('query') query: string, @Query('mine') mine: string) {
    const token = this.extractToken(req);
    return this.dashboardService.getClients(token, query, mine === 'true', req.user.userId);
  }

  @Post('clients')
  async createClient(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.createClient(token, req.user.userId, payload);
  }

  @Patch('clients/:id')
  async updateClient(@Req() req, @Param('id') id: string, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.updateClient(token, id, payload);
  }

  @Delete('clients/:id')
  async deleteClient(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
    return this.dashboardService.deleteClient(token, id);
  }

  @Get('clients/:id')
  async getClientDetails(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
    return this.dashboardService.getClientDetails(token, id);
  }

  // ==================== INTERACTIONS ====================

  @Get('activities')
  async getActivities(@Req() req) {
    const token = this.extractToken(req);
    return this.dashboardService.getRecentActivities(token);
  }

  @Post('interactions')
  async addInteraction(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.addInteraction(token, req.user.userId, payload);
  }

  @Delete('interactions/:id')
  async deleteInteraction(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
    return this.dashboardService.deleteInteraction(token, id);
  }

  @Get('bootstrap')
  async getBootstrap(@Req() req) {
    const token = this.extractToken(req);
    const userId = req.user.userId;
    return this.dashboardService.getBootstrapData(token, userId);
  }

  // ==================== DEALS ====================

  @Get('deals')
  async getDeals(@Req() req, @Query('clientId') clientId: string) {
    const token = this.extractToken(req);
    return this.dashboardService.getDeals(token, req.user.userId, clientId);
  }

  @Post('deals')
  async createDeal(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.createDeal(token, req.user.userId, payload);
  }

  @Patch('deals/:id')
  async updateDeal(@Req() req, @Param('id') id: string, @Body() payload: any) {
    const token = this.extractToken(req);
    return this.dashboardService.updateDeal(token, id, payload);
  }

  @Delete('deals/:id')
  async deleteDeal(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
    return this.dashboardService.deleteDeal(token, id);
  }
}