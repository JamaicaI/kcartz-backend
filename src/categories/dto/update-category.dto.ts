import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// PATCH = partial update, so every field is optional
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
