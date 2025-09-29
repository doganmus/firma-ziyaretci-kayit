import { IsBooleanString, IsOptional, IsString, IsDateString, IsIn, IsInt, Min } from 'class-validator';

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

  // Sorting and pagination
  @IsOptional()
  @IsString()
  @IsIn(['entry_at','exit_at','visitor_full_name','visited_person_full_name','company_name'])
  sortKey?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc','desc'])
  sortOrder?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
