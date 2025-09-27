import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateVisitDto } from './dto/create-visit.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  // Lists visits with optional filters; all roles can view
  @Get()
  @Roles('ADMIN', 'OPERATOR', 'VIEWER')
  list(@Query() q: QueryVisitsDto) {
    const filters = {
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      company: q.company,
      hasVehicle: typeof q.hasVehicle === 'string' ? q.hasVehicle === 'true' : undefined,
      plate: q.plate,
      visitedPerson: q.visitedPerson,
    };
    return this.visits.list(filters);
  }

  // Creates a new visit (ADMIN and OPERATOR only)
  @Post()
  @Roles('ADMIN', 'OPERATOR')
  create(@Body() body: CreateVisitDto) {
    return this.visits.create(body);
  }

  // Marks a visit as exited by setting exit time to now
  @Post(':id/exit')
  @Roles('ADMIN', 'OPERATOR')
  exit(@Param('id') id: string) {
    return this.visits.exit(id);
  }
}
