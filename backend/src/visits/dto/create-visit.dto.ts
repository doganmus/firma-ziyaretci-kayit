import { IsBoolean, IsDateString, IsOptional, IsString, Length, ValidateIf, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// TR plate (no spaces after transform):
// 99X9999 or 99X99999 | 99XX999 or 99XX9999 | 99XXX99 or 99XXX999
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

export class CreateVisitDto {
  @IsDateString()
  entry_at: string;

  @IsOptional()
  @IsDateString()
  exit_at?: string | null;

  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  visitor_full_name: string;

  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  visited_person_full_name: string;

  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
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
