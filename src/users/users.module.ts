import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // registers the User entity / repository
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // so AuthModule can use it
})
export class UsersModule {}
