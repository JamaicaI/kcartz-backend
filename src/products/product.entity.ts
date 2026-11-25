import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string; // e.g. "SEVENTEEN 12th Mini Album - SPILL THE FEELS"

  @Column({ name: 'group_name', length: 100 })
  groupName: string; // the K-pop group or artist, e.g. "SEVENTEEN"

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // DECIMAL keeps money exact (no floating-point rounding errors).
  // MySQL returns DECIMAL as a string, so the transformer converts it back to a number.
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  // Foreign key column: products.category_id -> categories.id
  @Column({ name: 'category_id' })
  categoryId: number;

  // Many products belong to one category.
  // RESTRICT: MySQL itself refuses to delete a category that still has products.
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
