import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../order.entity';

// Optional filter for GET /orders?status=pending
export class OrderQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
