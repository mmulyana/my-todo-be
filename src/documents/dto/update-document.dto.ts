import type { ProseMirrorDoc } from '@/db/schema';

export class UpdateDocumentDto {
  title?: string;
  content?: ProseMirrorDoc | null;
  projectId?: string | null;
}
