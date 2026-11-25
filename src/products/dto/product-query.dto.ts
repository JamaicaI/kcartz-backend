import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

// Optional filters for GET /products?categoryId=1&search=seventeen
export class ProductQueryDto {
  @IsOptional()
  @Type(() => Number) // query strings arrive as text, so convert "1" -> 1
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
