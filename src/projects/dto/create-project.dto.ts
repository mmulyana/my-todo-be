export class CreateProjectDto {
  name: string;
  code?: string | null;
  description?: string;
  parentId?: string | null;
}
