import { IsDateString, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/;

export class CreateVehicleEventDto {
  @IsIn(['ENTRY', 'EXIT'])
  action!: 'ENTRY' | 'EXIT';

  @IsDateString()
  at!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @Matches(TR_PLATE_REGEX, { message: 'plate must match TR plate format (e.g. 34ABC1234)' })
  @IsString()
  @Length(4, 20)
  plate!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  district?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  vehicle_type?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;
}


