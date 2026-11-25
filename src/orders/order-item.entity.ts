import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from './order.entity';

// Junction table between orders and products (resolves the many-to-many:
// one order has many products, one product appears in many orders).
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign key: order_items.order_id -> orders.id
  @Column({ name: 'order_id' })
  orderId: number;

  // CASCADE: deleting an order also deletes its items
  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Foreign key: order_items.product_id -> products.id
  @Column({ name: 'product_id' })
  productId: number;

  // RESTRICT: a product that appears in orders cannot be deleted
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  // Price at the moment of purchase. Stored on purpose: if the product's
  // price changes later, old orders must still show what the buyer paid.
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  unitPrice: number;
}
