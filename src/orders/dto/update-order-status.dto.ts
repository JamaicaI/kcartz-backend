import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order.entity';

// Body for PATCH /orders/:id/status, e.g. { "status": "paid" }
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: `status must be one of: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
