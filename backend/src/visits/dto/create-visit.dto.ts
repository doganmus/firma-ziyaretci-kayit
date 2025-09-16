import { IsBoolean, IsDateString, IsOptional, IsString, Length, ValidateIf, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// TR plate: 01-81 + 1-3 letters + 2-4 digits (spaces allowed by transform)
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)[A-Z]{1,3}[0-9]{2,4}$/;

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
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @Matches(TR_PLATE_REGEX, { message: 'vehicle_plate must match TR plate format (e.g. 34ABC1234)' })
  @IsString()
  @Length(4, 20)
  vehicle_plate?: string;
}
