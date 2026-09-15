import type { ProseMirrorDoc } from '@/db/schema';

export class CreateDocumentDto {
  title: string;
  content?: ProseMirrorDoc | null;
  projectId?: string | null;
}
