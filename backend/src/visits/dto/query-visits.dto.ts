import { IsBooleanString, IsOptional, IsString, IsDateString } from 'class-validator';

export class QueryVisitsDto {
  // Optional start date filter
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  // Optional end date filter
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  // Contains text of company name
  @IsOptional()
  @IsString()
  company?: string;

  // 'true' or 'false' as a string
  @IsOptional()
  @IsBooleanString()
  hasVehicle?: string; // 'true' | 'false'

  // Part of a vehicle plate to search for
  @IsOptional()
  @IsString()
  plate?: string;

  // Part of a visited person's name to search for
  @IsOptional()
  @IsString()
  visitedPerson?: string;
}
