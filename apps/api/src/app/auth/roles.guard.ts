import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) return false;

    // Define hierarchy (higher number = more privileges)
    const hierarchy: Record<string, number> = {
      viewer: 1,
      admin: 2,
      owner: 3,
    };

    const userRank = hierarchy[user.role.toLowerCase()] ?? 0;

    return requiredRoles.some(
      (role) => userRank >= (hierarchy[role.toLowerCase()] ?? 0),
    );
  }
}
