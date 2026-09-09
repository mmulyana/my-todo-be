import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { DbService } from '@/db/db.service';
import { apiTokens } from '@/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { CreateTokenDto } from './dto/create-token.dto';

// note: prefix ini menandai token akses pribadi my-todo agar mudah dikenali
// (misalnya oleh pemindai secrets atau pada file konfigurasi yang ditempelkan) "mtd" = my-todo.
const TOKEN_PREFIX = 'mtd_';
// note: ,enentukan bagian token yang ditampilkan kepada pengguna setelah dibuat, agar token dapat dibedakan di daftar tanpa menampilkan secret lengkap lagi.
const VISIBLE_PREFIX_LENGTH = 12;

function hashToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class TokensService {
  constructor(private readonly db: DbService) {}

  /**
   * note: membuat token dan mengembalikannya sekali dalam bentuk teks asli.
   * token harus segera ditampilkan karena tidak dapat dipulihkan setelah pemanggilan ini selesai.
   */
  async create(userId: string, dto: CreateTokenDto) {
    const rawToken = TOKEN_PREFIX + randomBytes(32).toString('base64url');
    const prefix = rawToken.slice(0, VISIBLE_PREFIX_LENGTH);

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const [token] = await this.db.db
      .insert(apiTokens)
      .values({
        userId,
        name: dto.name,
        prefix,
        tokenHash: hashToken(rawToken),
        expiresAt,
      })
      .returning();

    return { ...token, token: rawToken };
  }

  async findAll(userId: string) {
    const rows = await this.db.db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.userId, userId))
      .orderBy(desc(apiTokens.createdAt));

    return rows.map(({ tokenHash: _tokenHash, ...rest }) => rest);
  }

  async revoke(id: string, userId: string) {
    const [revoked] = await this.db.db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiTokens.id, id),
          eq(apiTokens.userId, userId),
          isNull(apiTokens.revokedAt),
        ),
      )
      .returning();

    if (!revoked) {
      throw new NotFoundException('Token tidak ditemukan');
    }

    const { tokenHash: _tokenHash, ...rest } = revoked;
    return rest;
  }

  /**
   * note: Memvalidasi bearer token dan mengembalikan userId pemiliknya,
   * atau null jika token tidak valid. Error 401 ditangani oleh auth guard.
   */
  async validate(rawToken: string): Promise<{ userId: string } | null> {
    if (!rawToken.startsWith(TOKEN_PREFIX)) {
      return null;
    }

    const [token] = await this.db.db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, hashToken(rawToken)));

    if (!token || token.revokedAt) {
      return null;
    }

    if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
      return null;
    }

    // fire-and-forget: don't make every MCP tool call pay for this write.
    void this.db.db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, token.id))
      .catch(() => {
        // Best-effort only - losing a lastUsedAt update is not worth failing the request.
      });

    return { userId: token.userId };
  }
}
