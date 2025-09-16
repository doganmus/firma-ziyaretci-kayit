import { IsBoolean, IsDateString, IsOptional, IsString, Length, ValidateIf } from 'class-validator';

export class CreateVisitDto {
  @IsDateString()
  entry_at: string;

  @IsOptional()
  @IsDateString()
  exit_at?: string | null;

  @IsString()
  @Length(2, 150)
  visitor_full_name: string;

  @IsString()
  @Length(2, 150)
  visited_person_full_name: string;

  @IsString()
  @Length(2, 150)
  company_name: string;

  @IsBoolean()
  has_vehicle: boolean;

  @ValidateIf((o) => o.has_vehicle === true)
  @IsString()
  @Length(2, 20)
  vehicle_plate?: string;
}
