import { apiRequest } from "./api";

export interface ProjectAccountSummary {
  id?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
}

export interface ProjectFromApi {
  id: number;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  currentPhase?: string | null;
  genre?: string | null;
  targetAudience?: string | null;
  format?: string | null;
  projectWorkflowStatus?: string | null;
  tantou?: ProjectAccountSummary | null;
  mangaka?: ProjectAccountSummary | null;
  budget?: number | null;
  allocated?: number | null;
}

export interface UpdateProjectPayload {
  title: string;
  description?: string;
  status?: string;
}

export function getProjects(): Promise<ProjectFromApi[]> {
  return apiRequest<ProjectFromApi[]>("/projects");
}

export function getProjectById(projectId: number): Promise<ProjectFromApi> {
  return apiRequest<ProjectFromApi>(`/projects/${projectId}`);
}

export function updateProject(projectId: number, payload: UpdateProjectPayload): Promise<ProjectFromApi> {
  const body: UpdateProjectPayload = { title: payload.title };
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.status !== undefined) body.status = payload.status;

  return apiRequest<ProjectFromApi>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function assignTantouToProject(projectId: number, tantouId: number): Promise<void> {
  await apiRequest<null>(`/workflow/project/${projectId}/assign-tantou/${tantouId}`, {
    method: "POST",
  });
}
