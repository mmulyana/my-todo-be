import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  BlockedHostError,
  UnsupportedSchemeError,
  fetchPage,
} from './link-preview.fetcher';
import {
  buildPreview,
  fallbackPreview,
  type LinkPreviewData,
} from './link-preview.parser';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  /**
   * Fetched on the server, never in the browser: cross-origin HTML is not
   * readable from the page.
   */
  async preview(rawUrl: string): Promise<LinkPreviewData> {
    const { finalUrl, html } = await fetchPage(rawUrl);
    // A page we cannot read still yields a preview built from the URL.
    return html ? buildPreview(html, finalUrl) : fallbackPreview(finalUrl);
  }

  /**
   * Same as preview(), but a broken link must never block saving an
   * attachment — the caller keeps whatever it already had.
   */
  async previewOrNull(rawUrl: string): Promise<LinkPreviewData | null> {
    try {
      return await this.preview(rawUrl);
    } catch (error) {
      this.logger.warn(
        `link preview failed for ${rawUrl}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  toHttpError(error: unknown): Error {
    if (error instanceof UnsupportedSchemeError) {
      return new BadRequestException(error.message);
    }
    if (error instanceof BlockedHostError) {
      return new BadRequestException(error.message);
    }
    return new BadRequestException('could not read that page');
  }
}
