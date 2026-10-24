import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UpdateProfileInput } from './dto/update-profile.input';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,30}$/;
const DISPLAY_NAME_MAX = 60;

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

  async update(id: string, input: UpdateProfileInput) {
    const patch: Partial<typeof users.$inferInsert> = {};

    if (input.displayName !== undefined) {
      const displayName = input.displayName?.trim() ?? '';
      if (displayName.length > DISPLAY_NAME_MAX) {
        throw new BadRequestException(
          `Nama tampilan maksimal ${DISPLAY_NAME_MAX} karakter`,
        );
      }
      patch.displayName = displayName || null;
    }

    if (input.username !== undefined && input.username !== null) {
      const username = input.username.trim();
      if (!USERNAME_PATTERN.test(username)) {
        throw new BadRequestException(
          'Username 3-30 karakter: huruf, angka, titik, garis bawah, atau strip',
        );
      }
      const [taken] = await this.db.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username));
      if (taken && taken.id !== id) {
        throw new ConflictException('Username sudah dipakai');
      }
      patch.username = username;
    }

    if (Object.keys(patch).length === 0) return this.findById(id);

    try {
      const [user] = await this.db.db
        .update(users)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return user ?? null;
    } catch (err) {
      // note: dua request bersamaan bisa lolos cek di atas, constraint unik yang menangkapnya
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException('Username sudah dipakai');
      }
      throw err;
    }
  }

  async setAvatar(id: string, avatarUrl: string | null) {
    const previous = await this.findById(id);
    const [user] = await this.db.db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return { user, previousUrl: previous?.avatarUrl ?? null };
  }

  async setPassword(id: string, hashedPassword: string) {
    await this.db.db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
}
