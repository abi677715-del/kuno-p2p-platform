import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { PrismaService } from './prisma.service';

/** Any account with staff-level access must have 2FA on before it can use that access. */
const ROLES_REQUIRING_TWO_FA: Role[] = [Role.ADMIN, Role.SUPPORT];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to do this');
    }

    if (ROLES_REQUIRING_TWO_FA.includes(user.role)) {
      const record = await this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { twoFaEnabled: true },
      });
      if (!record?.twoFaEnabled) {
        throw new ForbiddenException('Enable two-factor authentication in Settings before using admin/support features');
      }
    }

    return true;
  }
}
