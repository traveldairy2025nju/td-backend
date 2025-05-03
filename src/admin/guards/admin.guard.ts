import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    
    if (!user) {
      throw new ForbiddenException('未授权访问');
    }
    
    if (user.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限');
    }
    
    return true;
  }
} 