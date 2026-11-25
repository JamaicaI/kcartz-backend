import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending', // placed, waiting for payment
  PAID = 'paid', // payment confirmed by the admin
  SHIPPED = 'shipped', // handed to the courier
  COMPLETED = 'completed', // received by the buyer
  CANCELLED = 'cancelled', // cancelled, stock was returned
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // Foreign key column: orders.user_id -> users.id
  @Column({ name: 'user_id' })
  userId: number;

  // Many orders belong to one user (the buyer)
  @ManyToOne(() => User, (user) => user.orders, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // Computed by the server from the items, never sent by the client
  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalAmount: number;

  @Column({ name: 'shipping_address', length: 255 })
  shippingAddress: string;

  @Column({ name: 'contact_number', length: 20 })
  contactNumber: string;

  // One order has many items. cascade: saving an order also saves its items.
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
