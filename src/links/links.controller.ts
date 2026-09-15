import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LinksService } from './links.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('links')
@UseGuards(JwtAuthGuard)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get('preview')
  async preview(@Query('url') url?: string) {
    if (!url?.trim()) {
      throw this.linksService.toHttpError(new Error('url is required'));
    }
    try {
      return await this.linksService.preview(url);
    } catch (error) {
      throw this.linksService.toHttpError(error);
    }
  }
}
