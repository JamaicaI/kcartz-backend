import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

export interface CreateUserData {
  name: string;
  email: string;
  password: string; // already hashed by AuthService
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    // The Repository is TypeORM's gateway to the "users" table in MySQL
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    await this.ensureEmailIsFree(data.email);
    const user = this.usersRepository.create(data);
    const saved = await this.usersRepository.save(user);
    return this.findOne(saved.id); // re-fetch so the password hash is not returned
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  // Only used during login: explicitly includes the password hash for comparison
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async hasAdmin(): Promise<boolean> {
    const count = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
    return count > 0;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      await this.ensureEmailIsFree(dto.email);
    }
    Object.assign(user, dto);
    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return { message: `User #${id} deleted successfully` };
  }

  private async ensureEmailIsFree(email: string): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
  }
}
