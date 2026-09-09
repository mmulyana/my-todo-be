import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

// note: Ingat, endpoint ini hanya menggunakan JwtAuthGuard, bukan McpAuthGuard.
// Personal access token tidak boleh digunakan untuk membuat personal access token lainnya.
@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateTokenDto) {
    return this.tokensService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.tokensService.findAll(user.userId);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.tokensService.revoke(id, user.userId);
  }
}
