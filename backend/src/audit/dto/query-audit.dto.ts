import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryAuditDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  method?: string; // GET, POST, ...

  @IsOptional()
  @IsInt()
  statusFrom?: number;

  @IsOptional()
  @IsInt()
  statusTo?: number;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt','statusCode','durationMs'])
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


