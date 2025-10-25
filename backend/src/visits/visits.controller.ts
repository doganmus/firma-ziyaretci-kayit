import { Body, Controller, Get, Param, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateVisitDto } from './dto/create-visit.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

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
      sortKey: q.sortKey,
      sortOrder: q.sortOrder,
      page: q.page,
      pageSize: q.pageSize,
    };
    return this.visits.list(filters);
  }

  // Creates a new visit (ADMIN and OPERATOR only)
  @Post()
  @Roles('ADMIN', 'OPERATOR')
  create(@Body() body: CreateVisitDto) {
    return this.visits.create(body);
  }

  // Updates a visit (ADMIN and OPERATOR only)
  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  update(@Param('id') id: string, @Body() body: UpdateVisitDto) {
    return this.visits.update(id, body);
  }
}
