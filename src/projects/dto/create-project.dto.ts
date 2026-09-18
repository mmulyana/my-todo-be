export class CreateProjectDto {
  name: string;
  color?: string | null;
  code?: string | null;
  description?: string;
  parentId?: string | null;
}
