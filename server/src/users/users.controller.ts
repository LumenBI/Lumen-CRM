import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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
    }
}
