import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
<<<<<<< HEAD
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ConfigModule,
    ],
=======

@Module({
    imports: [PassportModule],
>>>>>>> f3dfb7456178ded21d4d15ff7b691dd9702b6f69
    providers: [JwtStrategy],
    exports: [PassportModule, JwtStrategy],
})
export class AuthModule { }
