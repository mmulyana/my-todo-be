import { UseGuards } from '@nestjs/common';
import { Resolver, Query } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UsersService } from './users.service';
import { JwtAuthGuard, CurrentUser } from '@/auth';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }
}
