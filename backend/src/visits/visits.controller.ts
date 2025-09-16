import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VisitsService } from './visits.service';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get()
  list() {
    return this.visits.list();
  }

  @Post()
  create(
    @Body()
    body: {
      entry_at: string;
      exit_at?: string | null;
      visitor_full_name: string;
      visited_person_full_name: string;
      company_name: string;
      has_vehicle: boolean;
      vehicle_plate?: string | null;
    },
  ) {
    return this.visits.create(body);
  }

  @Post(':id/exit')
  exit(@Param('id') id: string) {
    return this.visits.exit(id);
  }
}
