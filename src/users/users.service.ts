import { Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private readonly db: DbService) {}

  async findById(id: string) {
    const [user] = await this.db.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user ?? null;
  }

  async findByEmail(email: string) {
    const [user] = await this.db.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ?? null;
  }

  async create(data: { email: string; username: string; password: string }) {
    const [user] = await this.db.db
      .insert(users)
      .values({
        email: data.email,
        username: data.username,
        password: data.password,
      })
      .returning();
    return user;
  }
}
