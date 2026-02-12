import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
=======
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService],
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
})
export class UsersModule { }
