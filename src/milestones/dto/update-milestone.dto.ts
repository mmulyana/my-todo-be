export class UpdateMilestoneDto {
  name?: string;
  description?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
}
