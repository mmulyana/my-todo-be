export class CreateProjectDto {
  name: string;
  description?: string;
  parentId?: string | null;
}
