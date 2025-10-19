import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

// Public read-only endpoint to expose safe settings (e.g., maintenance flag)
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  async getPublic() {
    const s = await this.settings.get();
    return { maintenanceMode: s.maintenanceMode, brandName: s.brandName, brandLogoUrl: s.brandLogoUrl };
  }
}


