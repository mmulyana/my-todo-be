export class CreateMilestoneDto {
  name: string;
  description?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
}
