import { IsBoolean, IsDateString, IsOptional, IsString, Length, ValidateIf, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// TR plate (no spaces after transform):
// 99X9999 or 99X99999 | 99XX999 or 99XX9999 | 99XXX99 or 99XXX999
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

export class CreateVisitDto {
  // When the visitor enters
  @IsDateString()
  entry_at: string;

  // Optional exit time (will be set by server on /exit otherwise)
  @IsOptional()
  @IsDateString()
  exit_at?: string | null;

  // Visitor's full name (auto-uppercased in TR locale)
  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  visitor_full_name: string;

  // Person being visited (auto-uppercased)
  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  visited_person_full_name: string;

  // Visitor company (auto-uppercased)
  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  company_name: string;

  // Whether the visitor arrived with a vehicle
  @IsBoolean()
  has_vehicle: boolean;

  // Vehicle plate required and validated only when has_vehicle is true
  @ValidateIf((o) => o.has_vehicle === true)
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @Matches(TR_PLATE_REGEX, { message: 'vehicle_plate must match TR plate format (e.g. 34ABC1234)' })
  @IsString()
  @Length(4, 20)
  vehicle_plate?: string;
}
