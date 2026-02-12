import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    private extractToken(req: any): string {
        const rawHeader = req.headers.authorization;
        return rawHeader ? rawHeader.split(' ')[1] : '';
    }

    @Get()
    async findAll(@Req() req) {
        const token = this.extractToken(req);
        return this.usersService.findAll(token);
    }

    @Post()
    async createInvite(@Req() req, @Body() payload: { email: string; role: string }) {
        const token = this.extractToken(req);
        return this.usersService.createInvite(token, payload);
    }

    @Patch(':id/status')
    async toggleStatus(@Req() req, @Param('id') id: string, @Body('is_active') isActive: boolean) {
        const token = this.extractToken(req);
        return this.usersService.toggleStatus(token, id, isActive);
    }
}
