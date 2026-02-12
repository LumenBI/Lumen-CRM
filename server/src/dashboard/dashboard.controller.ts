import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
<<<<<<< HEAD
import { AppointmentsService } from './services/appointments.service';
import { NotificationsService } from './services/notifications.service';
import { StatsService } from './services/stats.service';
import { DealsService } from './services/deals.service';
import { ClientsService } from './services/clients.service';
=======
import { DashboardService } from './dashboard.service';

>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
<<<<<<< HEAD
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationsService: NotificationsService,
    private readonly statsService: StatsService,
    private readonly dealsService: DealsService,
    private readonly clientsService: ClientsService,
  ) { }
=======
  constructor(private readonly dashboardService: DashboardService) { }
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69

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
<<<<<<< HEAD
    return this.appointmentsService.getAppointments(token, req.user.userId, { from, to, status });
=======
    return this.dashboardService.getAppointments(token, req.user.userId, { from, to, status });
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Get('appointments/upcoming')
  async getUpcomingAppointments(@Req() req, @Query('limit') limit: number) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.appointmentsService.getUpcomingAppointments(token, req.user.userId, limit);
=======
    return this.dashboardService.getUpcomingAppointments(token, req.user.userId, limit);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Post('appointments')
  async createAppointment(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.appointmentsService.createAppointment(token, req.user.userId, payload);
=======
    return this.dashboardService.createAppointment(token, req.user.userId, payload);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Patch('appointments/:id')
  async updateAppointment(@Req() req, @Param('id') id: string, @Body() payload: any) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.appointmentsService.updateAppointment(token, id, payload);
=======
    return this.dashboardService.updateAppointment(token, id, payload);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Patch('appointments/:id/status')
  async updateAppointmentStatus(@Req() req, @Param('id') id: string, @Body('status') status: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.appointmentsService.updateAppointmentStatus(token, id, status);
=======
    return this.dashboardService.updateAppointmentStatus(token, id, status);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Delete('appointments/:id')
  async deleteAppointment(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.appointmentsService.deleteAppointment(token, id);
=======
    return this.dashboardService.deleteAppointment(token, id);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  // ==================== NOTIFICATIONS ====================

  @Get('notifications/check')
  async checkSystemNotifications(@Req() req) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.notificationsService.checkSystemNotifications(token, req.user.userId);
=======
    return this.dashboardService.checkSystemNotifications(token, req.user.userId);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  // ==================== STATS & REPORTS ====================

  @Get('stats')
  async getUserStats(@Req() req) {
    const token = this.extractToken(req);
    const userId = req.user.userId;
<<<<<<< HEAD
    return this.statsService.getUserStats(token, userId);
=======
    return this.dashboardService.getUserStats(token, userId);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Get('history')
  async getHistory(@Req() req) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.statsService.getHistory(token);
=======
    return this.dashboardService.getHistory(token);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  // ==================== KANBAN ====================

  @Get('kanban')
  async getKanbanBoard(@Req() req) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.dealsService.getKanbanBoard(token, req.user.userId);
=======
    return this.dashboardService.getKanbanBoard(token, req.user.userId);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Patch('deals/:id/move')
  async moveCard(@Req() req, @Param('id') dealId: string, @Body('status') newStatus: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.dealsService.moveCard(token, req.user.userId, dealId, newStatus);
=======
    return this.dashboardService.moveCard(token, req.user.userId, dealId, newStatus);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  // ==================== CLIENTS ====================

  @Get('clients')
  async getClients(@Req() req, @Query('query') query: string, @Query('mine') mine: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.getClients(token, query, mine === 'true', req.user.userId);
=======
    return this.dashboardService.getClients(token, query, mine === 'true', req.user.userId);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Post('clients')
  async createClient(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.createClient(token, req.user.userId, payload);
=======
    return this.dashboardService.createClient(token, req.user.userId, payload);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Patch('clients/:id')
  async updateClient(@Req() req, @Param('id') id: string, @Body() payload: any) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.updateClient(token, id, payload);
=======
    return this.dashboardService.updateClient(token, id, payload);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Delete('clients/:id')
  async deleteClient(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.deleteClient(token, id);
=======
    return this.dashboardService.deleteClient(token, id);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Get('clients/:id')
  async getClientDetails(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.getClientDetails(token, id);
=======
    return this.dashboardService.getClientDetails(token, id);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  // ==================== INTERACTIONS ====================

  @Get('activities')
  async getActivities(@Req() req) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.getRecentActivities(token);
=======
    return this.dashboardService.getRecentActivities(token);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Delete('interactions/:id')
  async deleteInteraction(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.clientsService.deleteInteraction(token, id);
=======
    return this.dashboardService.deleteInteraction(token, id);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Patch('profile/notifications')
  async updateNotificationSettings(@Req() req, @Body('interval') interval: number) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.notificationsService.updateNotificationInterval(token, req.user.userId, interval);
=======
    return this.dashboardService.updateNotificationInterval(token, req.user.userId, interval);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Get('bootstrap')
  async getBootstrap(@Req() req) {
    const token = this.extractToken(req);
    const userId = req.user.userId;
<<<<<<< HEAD
    return this.statsService.getBootstrapData(token, userId);
=======
    return this.dashboardService.getBootstrapData(token, userId);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  // ==================== DEALS ====================

  @Get('deals')
  async getDeals(@Req() req, @Query('clientId') clientId: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.dealsService.getDeals(token, req.user.userId, clientId);
=======
    return this.dashboardService.getDeals(token, req.user.userId, clientId);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Post('deals')
  async createDeal(@Req() req, @Body() payload: any) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.dealsService.createDeal(token, req.user.userId, payload);
=======
    return this.dashboardService.createDeal(token, req.user.userId, payload);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Patch('deals/:id')
  async updateDeal(@Req() req, @Param('id') id: string, @Body() payload: any) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.dealsService.updateDeal(token, id, payload);
=======
    return this.dashboardService.updateDeal(token, id, payload);
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
  }

  @Delete('deals/:id')
  async deleteDeal(@Req() req, @Param('id') id: string) {
    const token = this.extractToken(req);
<<<<<<< HEAD
    return this.dealsService.deleteDeal(token, id);
  }
}
=======
    return this.dashboardService.deleteDeal(token, id);
  }
}
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
