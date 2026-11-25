import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { UserRole } from '../users/user.entity';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderItem } from './order-item.entity';
import { Order, OrderStatus } from './order.entity';

// Which status changes are allowed (pending -> paid -> shipped -> completed)
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  // Places an order. Runs inside a database TRANSACTION: either every step
  // succeeds (stock reduced + order saved) or nothing is changed at all.
  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException(
        'Each product may appear only once per order; use quantity instead',
      );
    }

    const orderId = await this.dataSource.transaction(async (manager) => {
      const items: OrderItem[] = [];
      let total = 0;

      for (const line of dto.items) {
        // Row lock: two buyers cannot buy the last item at the same time
        const product = await manager.findOne(Product, {
          where: { id: line.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(`Product #${line.productId} not found`);
        }
        if (product.stock < line.quantity) {
          throw new ConflictException(
            `Not enough stock for "${product.name}" (available: ${product.stock}, requested: ${line.quantity})`,
          );
        }

        product.stock -= line.quantity;
        await manager.save(product);

        // The price comes from the database, never from the client
        items.push(
          manager.create(OrderItem, {
            productId: product.id,
            quantity: line.quantity,
            unitPrice: product.price,
          }),
        );
        total += product.price * line.quantity;
      }

      const order = manager.create(Order, {
        userId,
        shippingAddress: dto.shippingAddress,
        contactNumber: dto.contactNumber,
        totalAmount: Math.round(total * 100) / 100,
        items,
      });
      const saved = await manager.save(order);
      return saved.id;
    });

    return this.findById(orderId);
  }

  // Admin: every order, optionally filtered by status
  findAll(query: OrderQueryDto): Promise<Order[]> {
    return this.ordersRepository.find({
      where: query.status ? { status: query.status } : {},
      relations: { user: true, items: { product: true } },
      order: { id: 'DESC' },
    });
  }

  // Buyer: only their own orders
  findMine(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: { items: { product: true } },
      order: { id: 'DESC' },
    });
  }

  // Admin can view any order; a buyer only their own
  async findOneForUser(id: number, requester: JwtPayload): Promise<Order> {
    const order = await this.findById(id);
    this.assertCanAccess(order, requester);
    return order;
  }

  async updateStatus(id: number, newStatus: OrderStatus): Promise<Order> {
    return this.changeStatus(id, newStatus);
  }

  // Buyer cancels their own order, only while it is still pending
  async cancel(id: number, requester: JwtPayload): Promise<Order> {
    const order = await this.findById(id);
    this.assertCanAccess(order, requester);
    if (
      requester.role !== UserRole.ADMIN &&
      order.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException(
        `Only pending orders can be cancelled (this order is ${order.status})`,
      );
    }
    return this.changeStatus(id, OrderStatus.CANCELLED);
  }

  // Admin removes an order record permanently (only finished orders)
  async remove(id: number): Promise<{ message: string }> {
    const order = await this.findById(id);
    if (
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.COMPLETED
    ) {
      throw new ConflictException(
        `Only cancelled or completed orders can be deleted (this order is ${order.status})`,
      );
    }
    await this.ordersRepository.remove(order); // order_items are removed by CASCADE
    return { message: `Order #${id} deleted successfully` };
  }

  private async changeStatus(
    id: number,
    newStatus: OrderStatus,
  ): Promise<Order> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(`Order #${id} not found`);
      }
      if (!ALLOWED_TRANSITIONS[order.status].includes(newStatus)) {
        throw new BadRequestException(
          `Cannot change order status from ${order.status} to ${newStatus}`,
        );
      }

      if (newStatus === OrderStatus.CANCELLED) {
        await this.restoreStock(manager, id);
      }

      await manager.update(Order, id, { status: newStatus });
    });
    return this.findById(id);
  }

  // Puts the items of a cancelled order back into stock
  private async restoreStock(
    manager: EntityManager,
    orderId: number,
  ): Promise<void> {
    const items = await manager.find(OrderItem, { where: { orderId } });
    for (const item of items) {
      await manager.increment(
        Product,
        { id: item.productId },
        'stock',
        item.quantity,
      );
    }
  }

  private async findById(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { user: true, items: { product: true } },
    });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  private assertCanAccess(order: Order, requester: JwtPayload): void {
    if (requester.role !== UserRole.ADMIN && order.userId !== requester.sub) {
      throw new ForbiddenException('You can only access your own orders');
    }
  }
}
