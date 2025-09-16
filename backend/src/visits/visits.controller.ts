import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateVisitDto } from './dto/create-visit.dto';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get()
  list() {
    return this.visits.list();
  }

  @Post()
  create(@Body() body: CreateVisitDto) {
    return this.visits.create(body);
  }

  @Post(':id/exit')
  exit(@Param('id') id: string) {
    return this.visits.exit(id);
  }
}
