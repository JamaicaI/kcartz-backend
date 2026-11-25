import { IsInt, Min } from 'class-validator';

// Body for PATCH /products/:id/stock, e.g. { "stock": 25 }
export class UpdateStockDto {
  @IsInt()
  @Min(0)
  stock: number;
}
