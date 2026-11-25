import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    // Throws 404 if the category does not exist
    await this.categoriesService.findOne(dto.categoryId);
    const product = this.productsRepository.create(dto);
    const saved = await this.productsRepository.save(product);
    return this.findOne(saved.id);
  }

  findAll(query: ProductQueryDto): Promise<Product[]> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.id', 'ASC');

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.search) {
      // Parameters (:search) prevent SQL injection
      qb.andWhere(
        '(product.name LIKE :search OR product.groupName LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.categoriesService.findOne(dto.categoryId);
    }
    // update() runs a single UPDATE query with only the fields that were sent
    if (Object.keys(dto).length > 0) {
      await this.productsRepository.update(id, dto);
    }
    return this.findOne(id);
  }

  async updateStock(id: number, stock: number): Promise<Product> {
    await this.findOne(id);
    await this.productsRepository.update(id, { stock });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { message: `Product #${id} deleted successfully` };
  }
}
