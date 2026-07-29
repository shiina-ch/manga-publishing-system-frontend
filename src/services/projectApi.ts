import { apiRequest } from "./api";
import { tokenStorage } from "../storage/tokenStorage";
import type { ChapterApi } from "./workflowApi";

export interface ProductionPlan {
  id: number;
  milestones?: string | null;
  schedule?: string | null;
  chapterTimeline?: string | null;
  deadline?: string | null;
  resources?: string | null;
  budget?: number | null;
  assistantAllocation?: string | null;
  priority?: string | null;
  risk?: string | null;
  approvalStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  chapters?: ChapterApi[] | null;
}

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
  productionPlan?: ProductionPlan | null;
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

export async function assignMangakaToProject(projectId: number, mangakaId: number): Promise<void> {
  await apiRequest<null>(`/workflow/project/${projectId}/assign-mangaka/${mangakaId}`, {
    method: "POST",
  });
}

export interface ProductionPlanPayload {
  milestones?: string;
  schedule?: string;
  chapterTimeline?: string;
  deadline?: string;
  resources?: string;
  budget?: number;
  assistantAllocation?: string;
  priority?: string;
  risk?: string;
}

export interface CreateChapterPayload {
  planId: number;
  chapterNumber: number;
  title: string;
  targetPageCount: number;
  startDate: string;
  endDate: string;
  publishDate: string;
}

export async function createChapter(projectId: number, payload: CreateChapterPayload): Promise<ChapterApi> {
  const accountId = tokenStorage.getAccount()?.id;
  if (!accountId) throw new Error("Authentication required to create a chapter");

  return apiRequest<ChapterApi>(`/workflow/chapters?requesterId=${accountId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateChapter(chapterId: number, payload: CreateChapterPayload): Promise<ChapterApi> {
  return apiRequest<ChapterApi>(`/chapters/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createProductionPlan(projectId: number, payload: ProductionPlanPayload): Promise<any> {
  return apiRequest<any>(`/projects/${projectId}/production-plans`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

