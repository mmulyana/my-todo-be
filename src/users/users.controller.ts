import {
  BadRequestException,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { unlink } from 'fs/promises';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

// note: jangan pernah mengembalikan baris User mentah, kolom password ikut terbawa
function publicUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const { id, email, username, displayName, avatarUrl, createdAt, updatedAt } =
    user;
  return { id, email, username, displayName, avatarUrl, createdAt, updatedAt };
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const UPLOADS_PREFIX = '/uploads/';

// note: hanya hapus file avatar di folder uploads, url dari DB tidak dipercaya mentah
async function removeUploadedFile(url: string | null) {
  if (!url || !url.startsWith(`${UPLOADS_PREFIX}avatar-`)) return;
  const name = url.slice(UPLOADS_PREFIX.length);
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return;
  try {
    await unlink(join(process.cwd(), 'uploads', name));
  } catch {
    // note: file sudah tidak ada, tidak masalah
  }
}

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `avatar-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: AVATAR_MAX_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Avatar harus berupa gambar'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() current: { userId: string },
    @UploadedFile() file?: { filename: string },
  ) {
    if (!file) throw new BadRequestException('File is required');
    const { user, previousUrl } = await this.usersService.setAvatar(
      current.userId,
      `${UPLOADS_PREFIX}${file.filename}`,
    );
    await removeUploadedFile(previousUrl);
    return publicUser(user);
  }

  @Delete('avatar')
  async removeAvatar(@CurrentUser() current: { userId: string }) {
    const { user, previousUrl } = await this.usersService.setAvatar(
      current.userId,
      null,
    );
    await removeUploadedFile(previousUrl);
    return publicUser(user);
  }
}
