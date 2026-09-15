import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { LinksService } from './links.service';
import { LinkPreview } from './models/link-preview.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Resolver(() => LinkPreview)
@UseGuards(JwtAuthGuard)
export class LinksResolver {
  constructor(private readonly linksService: LinksService) {}

  @Query(() => LinkPreview, { name: 'linkPreview' })
  async preview(@Args('url') url: string) {
    try {
      return await this.linksService.preview(url);
    } catch (error) {
      throw this.linksService.toHttpError(error);
    }
  }
}
