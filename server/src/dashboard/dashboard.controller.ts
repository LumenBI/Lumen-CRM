import { Controller, Get, Patch, Post, Body, UseGuards, Param, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getDashboard(@Request() req) {
    return this.dashboardService.getUserStats(req.user.userId);
  }

  @Get('kanban')
  @UseGuards(AuthGuard('jwt'))
  getKanban(@Request() req) {
    return this.dashboardService.getKanbanBoard(req.user.userId);
  }

  @Patch('kanban/move')
  @UseGuards(AuthGuard('jwt'))
  moveCard(@Request() req, @Body() body: { clientId: string, newStatus: string }) {
    return this.dashboardService.moveCard(req.user.userId, body.clientId, body.newStatus);
  }

  @Get('clients/:id')
  @UseGuards(AuthGuard('jwt'))
  getClientDetails(@Param('id') id: string) {
    return this.dashboardService.getClientDetails(id);
  }

  @Post('interactions')
  @UseGuards(AuthGuard('jwt'))
  addInteraction(@Request() req, @Body() body: any) {
    return this.dashboardService.addInteraction(req.user.userId, body);
  }
}