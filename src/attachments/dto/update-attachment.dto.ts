import { AttachmentType } from '../models/attachment.model';

export class UpdateAttachmentDto {
  filename?: string;
  url?: string;
  mimeType?: string | null;
  size?: number | null;
  type?: AttachmentType;
  todoId?: string | null;
  projectId?: string | null;
}
