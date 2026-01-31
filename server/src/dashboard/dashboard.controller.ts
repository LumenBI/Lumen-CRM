import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getDashboard(@Request() req) {
    const userId = req.user.userId;
    return this.dashboardService.getUserStats(userId);
  }
}