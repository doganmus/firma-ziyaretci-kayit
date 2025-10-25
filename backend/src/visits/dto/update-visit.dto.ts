import { IsBoolean, IsDateString, IsOptional, IsString, Length, ValidateIf, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

export class UpdateVisitDto {
  @IsOptional()
  @IsDateString()
  entry_at?: string;

  @IsOptional()
  @IsDateString()
  exit_at?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  visitor_full_name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  visited_person_full_name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLocaleUpperCase('tr-TR') : value))
  company_name?: string;

  @IsOptional()
  @IsBoolean()
  has_vehicle?: boolean;

  @ValidateIf((o) => o.has_vehicle === true || typeof o.has_vehicle === 'undefined')
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @Matches(TR_PLATE_REGEX, { message: 'vehicle_plate must match TR plate format (e.g. 34ABC1234)' })
  @IsString()
  @Length(4, 20)
  vehicle_plate?: string | null;
}


