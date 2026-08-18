import { AttachmentType } from '../models/attachment.model';

export class CreateAttachmentDto {
  filename: string;
  url: string;
  mimeType?: string;
  size?: number;
  type?: AttachmentType;
  todoId?: string | null;
  projectId?: string | null;
}
