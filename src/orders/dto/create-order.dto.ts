import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}

// Example body:
// {
//   "items": [{ "productId": 1, "quantity": 2 }],
//   "shippingAddress": "Blk 1 Lot 2, Imus, Cavite",
//   "contactNumber": "09171234567"
// }
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'an order must contain at least 1 item' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shippingAddress: string;

  @Matches(/^(09|\+639)\d{9}$/, {
    message:
      'contactNumber must be a PH mobile number, e.g. 09171234567 or +639171234567',
  })
  contactNumber: string;
}
