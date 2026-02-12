<<<<<<< HEAD
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
=======
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

<<<<<<< HEAD
    @Get()
    async findAll(@Request() req) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                console.error('UsersController: No token found in authorization header');
            }
            return await this.usersService.findAll(token);
        } catch (error) {
            console.error('UsersController: Error fetching users', error);
            throw error;
        }
=======
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
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
    }
}
