import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Protects routes by requiring a valid JWT in the Authorization header
export class JwtAuthGuard extends AuthGuard('jwt') {}
