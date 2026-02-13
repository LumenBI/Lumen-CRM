import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
        if (!requiredPermission) return true; // Si la ruta no exige permiso, pasa.

        const request = context.switchToHttp().getRequest();
        const user = request.user; // Inyectado por JwtStrategy

        if (!user || !user.role) {
            throw new ForbiddenException('Usuario no identificado');
        }

        // El array de permissions debe ser inyectado por JwtStrategy
        const permissions = user.permissions || [];

        if (!permissions.includes(requiredPermission)) {
            throw new ForbiddenException(`No tienes el permiso: ${requiredPermission}`);
        }

        return true;
    }
}
