import { IsBoolean, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Length(0, 120)
  brandName?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: false }, { message: 'brandLogoUrl must be a URL path (e.g. /uploads/logo.png)' })
  @Length(0, 2048)
  brandLogoUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;
}


