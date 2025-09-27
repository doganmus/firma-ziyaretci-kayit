import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Decorator to declare which roles can access a controller/handler
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
