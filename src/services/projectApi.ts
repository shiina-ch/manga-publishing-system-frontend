import { apiRequest } from "./api";
import { tokenStorage } from "../storage/tokenStorage";
import type { ChapterApi } from "./workflowApi";

export interface ProductionPlan {
  id: number;
  title?: string | null;
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
  publishDate?: string | null;
  deadlineDate?: string | null;
  chapters?: ChapterApi[] | null;
  planStatus?: string | null;
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
  ownerId?: number | null;
  ownerName?: string | null;
  genre?: string | null;
  targetAudience?: string | null;
  format?: string | null;
  projectWorkflowStatus?: string | null;
  productionPlan?: ProductionPlan | null;
  tantou?: ProjectAccountSummary | null;
  mangaka?: ProjectAccountSummary | null;
  tantouId?: number | null;
  tantouName?: string | null;
  mangakaId?: number | null;
  mangakaName?: string | null;
  budget?: number | null;
  allocated?: number | null;
}

export interface CreateProjectPayload {
  title: string;
  genre?: string;
  targetAudience?: string;
  format?: string;
  tantouId?: number | null;
}

export function createProject(payload: CreateProjectPayload, editorId: number): Promise<ProjectFromApi> {
  return apiRequest<ProjectFromApi>(`/workflow/projects?editorId=${editorId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateProjectPayload {
  title: string;
  description?: string;
  status?: string;
}

export function getProjects(): Promise<ProjectFromApi[]> {
  return apiRequest<ProjectFromApi[]>("/projects");
}

export function getProjectsByTantou(tantouId: number): Promise<ProjectFromApi[]> {
  return apiRequest<ProjectFromApi[]>(`/projects/tantou/${tantouId}`);
}

export interface UpdateProjectDetailsTantouPayload {
  genre?: string;
  targetAudience?: string;
  format?: string;
}

export function updateProjectDetailsByTantou(projectId: number, tantouId: number, payload: UpdateProjectDetailsTantouPayload): Promise<ProjectFromApi> {
  return apiRequest<ProjectFromApi>(`/workflow/projects/${projectId}/details?tantouId=${tantouId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
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

export interface UpdateProjectBoardPayload {
  projectWorkflowStatus?: string;
  tantouId?: number;
}

export function updateProjectByBoard(projectId: number, editorId: number, payload: UpdateProjectBoardPayload): Promise<ProjectFromApi> {
  return apiRequest<ProjectFromApi>(`/workflow/projects/${projectId}/board?editorId=${editorId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
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

export async function assignChapterToMangaka(chapterId: number, mangakaId: number): Promise<void> {
  const requesterId = tokenStorage.getAccount()?.id;
  if (!requesterId) throw new Error("Authentication required to assign a chapter");

  await apiRequest<null>(`/workflow/chapters/${chapterId}/assign`, {
    method: "POST",
    body: JSON.stringify({ mangakaId, requesterId }),
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
  chapterStatus?: string;
  targetPageCount: number;
  startDate?: string;
  endDate?: string;
  publishDate?: string;
  deadline?: string;
  priority?: string;
}

export async function createChapter(projectId: number, payload: CreateChapterPayload, requesterId?: number): Promise<ChapterApi> {
  const accountId = requesterId || tokenStorage.getAccount()?.id;
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

export function completeChapter(chapterId: number): Promise<any> {
  return apiRequest<any>(`/chapters/${chapterId}/completed`, {
    method: "PUT",
  });
}

export function updateChapterOverdueStatus(chapterId: number): Promise<any> {
  return apiRequest<any>(`/chapters/${chapterId}/update-overdue`, {
    method: "PUT",
  });
}

export function publishChaptersByPlan(planId: number): Promise<any> {
  return apiRequest<any>(`/chapters/publish-by-plan/${planId}`, {
    method: "PUT",
  });
}

export function getPublishedChapters(): Promise<any[]> {
  return apiRequest<any[]>(`/chapters/published`);
}

export interface CreateProductionPlanPayload {
  title: string;
  startDate?: string;
  endDate?: string;
  deadlineDate?: string;
  publishDate?: string;
}

export function createProductionPlan(projectId: number, payload: CreateProductionPlanPayload, requesterId?: number): Promise<any> {
  const accountId = requesterId || tokenStorage.getAccount()?.id;
  if (!accountId) throw new Error("Authentication required to create a production plan");

  return apiRequest<any>(`/v1/projects/${projectId}/production-plans?requesterId=${accountId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ProductionPlanResponse extends ProductionPlan {
  projectId: number;
  projectTitle: string;
}

export function getProductionPlans(): Promise<ProductionPlanResponse[]> {
  return apiRequest<ProductionPlanResponse[]>("/v1/production-plans");
}

export function getProductionPlansByProject(projectId: number): Promise<ProductionPlanResponse[]> {
  return apiRequest<ProductionPlanResponse[]>(`/v1/projects/${projectId}/production-plans`);
}

export function completeProductionPlan(planId: number, requesterId: number): Promise<ProductionPlanResponse> {
  return apiRequest<ProductionPlanResponse>(`/v1/production-plans/${planId}/complete?requesterId=${requesterId}`, {
    method: "PUT",
  });
}

export interface ExtendTimelinePayload {
  newEndDate: string;
  publishDate?: string;
  reasonCode: string;
  reasonNote: string;
}

export function extendProductionPlanTimeline(planId: number, requesterId: number, payload: ExtendTimelinePayload): Promise<ProductionPlanResponse> {
  return apiRequest<ProductionPlanResponse>(`/v1/production-plans/${planId}/extend?requesterId=${requesterId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getChaptersByMangaka(mangakaId: number): Promise<any[]> {
  return apiRequest<any[]>(`/workflow/mangaka/${mangakaId}/chapters`);
}

export interface CreateTaskPayload {
  requesterId: number;
  title: string;
  description: string;
  acceptanceCriteria: string;
  productionTaskType: string;
  deadlineDate: string;
  deadlineTime: string;
}

export function createTaskUnderChapter(chapterId: number, payload: CreateTaskPayload): Promise<any> {
  return apiRequest<any>(`/workflow/chapters/${chapterId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface CreateSubTaskPayload {
  requesterId: number;
  assigneeId?: number | null;
  title: string;
  description: string;
  productionTaskType: string;
  deadlineDate: string;
  deadlineTime: string;
}

export function createSubTask(taskId: number, payload: CreateSubTaskPayload): Promise<any> {
  return apiRequest<any>(`/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSubTasks(taskId: number, requesterId: number): Promise<any[]> {
  return apiRequest<any[]>(`/tasks/${taskId}/subtasks?requesterId=${requesterId}`);
}

