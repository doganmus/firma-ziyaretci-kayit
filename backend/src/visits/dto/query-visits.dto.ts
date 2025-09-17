import { IsBooleanString, IsOptional, IsString, IsDateString } from 'class-validator';

export class QueryVisitsDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsBooleanString()
  hasVehicle?: string; // 'true' | 'false'

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  visitedPerson?: string;
}
