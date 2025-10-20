import { IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

// TR plate regex (normalized: no spaces, uppercase)
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

export class CreateVehicleLogDto {
  // Optional entry time; if omitted, server will use now()
  @IsOptional()
  @IsDateString()
  entry_at?: string;

  // Optional exit time (usually set via /exit endpoint)
  @IsOptional()
  @IsDateString()
  exit_at?: string | null;

  // Required normalized plate
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @Matches(TR_PLATE_REGEX, { message: 'plate must match TR plate format (e.g. 34ABC1234)' })
  @IsString()
  @Length(4, 20)
  plate!: string;

  // Required on create
  @IsString()
  @Length(1, 100)
  district!: string;

  @IsString()
  @Length(1, 20)
  vehicle_type!: string;

  @IsOptional()
  @IsString()
  note?: string | null;
}


