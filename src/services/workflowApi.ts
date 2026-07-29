import { apiRequest, formatDateLabel, normalizeStatus } from "./api";

export interface ChapterApi {
  id: number;
  chapterNumber: number | null;
  title: string | null;
  chapterStatus: string | null;
  status?: string | null;
  targetPageCount?: number | null;
  publishDate?: string | null;
  projectId?: number | null;
  ownerId?: number | null;
  ownerName?: string | null;
  tasks?: TaskApi[] | null;
}


export interface SubmissionApi {
  id: number;
  title?: string | null;
  description?: string | null;
  taskId?: number | null;
  subTaskId?: number | null;
  submissionType?: string | null;
  parentSubmissionId?: number | null;
  status?: string | null;
  nameStatus?: string | null;
  productionStatus?: string | null;
  note?: string | null;
  contentUrl?: string | null;
  submittedById?: number | null;
  submittedByName?: string | null;
  submittedBy?: AccountSummaryApi | null;
  submittedAt?: string | null;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  files?: SubmissionFileApi[] | null;
  fileCount?: number | null;
  project?: ProjectSummaryApi | null;
  planning?: PlanningSummaryApi | null;
  reviews?: SubmissionReviewApi[] | null;
  tantouId?: number | null;
  tantou?: AccountSummaryApi | null;
}

export interface SubmissionReviewApi {
  id: number;
  submissionId?: number | null;
  reviewerId?: number | null;
  reviewerEmail?: string | null;
  reviewerName?: string | null;
  stage?: string | null;
  decision: string | null;
  comment: string | null;
  reviewedAt: string | null;
}

export interface AccountSummaryApi {
  id?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  username?: string | null;
  name?: string | null;
  systemRole?: Array<{ id: number; roleName: string }> | null;
}

export interface PlanningSummaryApi {
  id?: number | null;
  title?: string | null;
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}

export interface ProjectSummaryApi {
  id?: number | null;
  title?: string | null;
  name?: string | null;
  status?: string | null;
  description?: string | null;
  tantouId?: number | null;
  tantou?: AccountSummaryApi | null;
}

export interface SubmissionFileApi {
  id?: number | null;
  originalName?: string | null;
  originalFilename?: string | null;
  fileName?: string | null;
  filename?: string | null;
  path?: string | null;
  filePath?: string | null;
  url?: string | null;
  fileUrl?: string | null;
  size?: number | null;
  fileSize?: number | null;
  contentType?: string | null;
  mimeType?: string | null;
}

export interface ReviewRequest {
  submissionId: number;
  reviewerId: number;
  decision: "APPROVE" | "REJECT" | "REVISION" | string;
  comment: string;
  pacingPass: boolean;
  structurePass: boolean;
  imageFlowPass: boolean;
}

export interface TaskApi {
  id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  deadline: string | null;
  taskType?: string | null;
  assigneeId?: number | null;
  assigneeName?: string | null;
  chapterTitle?: string | null;
}

export interface SketchTaskApi {
  id: number;
  taskType: string | null;
  description: string | null;
  completedUrl: string | null;
  status: string | null;
  completedAt: string | null;
}

export interface SketchPageApi {
  id: number;
  pageNumber: number | null;
  initialSketchUrl: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PlanningApi {
  id: number;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

export interface VoteApi {
  id: number;
  submissionReviewId: number;
  voterId: number;
  voteValue: "APPROVE" | "REJECT" | string;
  comment: string | null;
  votedAt: string | null;
}

export interface VoteSummaryApi {
  submissionReviewId: number;
  approveCount: number;
  rejectCount: number;
  totalVotes: number;
  result: string | null;
}

export interface EditorProposal {
  id: number;
  title: string;
  mangaka: string;
  genre: string[];
  synopsis: string;
  pages: number;
  status: string;
  time: string;
  concepts: number;
  editorNote?: string;
}

export interface AssistantTask {
  id: number;
  page: number;
  panel: string;
  label: string;
  description: string;
  tags: string[];
  mangaka: string;
  due: string;
  priority: "high" | "medium" | "low";
  status: string;
}

export interface VoteItem {
  member: string;
  vote: "publish" | "reject";
  time: string;
}

export function getChapters(): Promise<ChapterApi[]> {
  return apiRequest<ChapterApi[]>("/chapters");
}

export function getSubmissions(): Promise<SubmissionApi[]> {
  return apiRequest<SubmissionApi[]>("/submissions");
}

export async function getMangakaSubmissions(userId?: number): Promise<SubmissionApi[]> {
  const submissions = await apiRequest<SubmissionApi[]>("/submissions");

  if (!Array.isArray(submissions)) {
    return [];
  }

  return submissions.sort((a, b) => {
    const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;

    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

export function submitToBoard(submissionId: number, tantouId: number): Promise<SubmissionApi> {
  return apiRequest<SubmissionApi>(
    `/workflow/name/${submissionId}/submit-to-board?tantouId=${tantouId}`,
    { method: "POST" },
    [200, 201],
  );
}

export function getSubmissionById(id: number): Promise<SubmissionApi> {
  return apiRequest<SubmissionApi>(`/submissions/${id}`);
}

export function getWorkflowSubmissions(status?: string): Promise<SubmissionApi[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<SubmissionApi[]>(`/workflow/name/submissions${query}`);
}

export function getSubmissionReviews(): Promise<SubmissionReviewApi[]> {
  return apiRequest<SubmissionReviewApi[]>("/submissionreviews");
}

export function getReviewsForSubmission(submissionId: number): Promise<SubmissionReviewApi[]> {
  return apiRequest<SubmissionReviewApi[]>(`/submissionreviews/submission/${submissionId}`);
}

export function getReviewsByTaskAndTantou(taskId: number, tantouId: number): Promise<SubmissionReviewApi[]> {
  return apiRequest<SubmissionReviewApi[]>(`/submissionreviews/tasks/${taskId}/tantous/${tantouId}`);
}

export function postSubmissionReview(submissionId: number, payload: { reviewerId: number, decision: string, note: string }): Promise<SubmissionReviewApi> {
  return apiRequest<SubmissionReviewApi>(`/workflow/submissions/${submissionId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, [200, 201]);
}

export function getTasks(): Promise<TaskApi[]> {
  return apiRequest<TaskApi[]>("/tasks");
}

export function getSketchTasks(): Promise<SketchTaskApi[]> {
  return apiRequest<SketchTaskApi[]>("/sketch-tasks");
}

export function getSketchPages(): Promise<SketchPageApi[]> {
  return apiRequest<SketchPageApi[]>("/sketch-pages");
}

export function getPlannings(): Promise<PlanningApi[]> {
  return apiRequest<PlanningApi[]>("/plannings");
}

export function getVotes(): Promise<VoteApi[]> {
  return apiRequest<VoteApi[]>("/votes").catch(() => []);
}

export function getVotesForSubmissionReview(submissionReviewId: number): Promise<VoteApi[]> {
  return apiRequest<VoteApi[]>(`/votes/submission-review/${submissionReviewId}`);
}

export function getVoteSummary(submissionReviewId: number): Promise<VoteSummaryApi> {
  return apiRequest<VoteSummaryApi>(`/votes/submission-review/${submissionReviewId}/summary`);
}

export function castSubmissionReviewVote(payload: {
  submissionReviewId: number;
  voterId: number;
  voteValue: "APPROVE" | "REJECT";
  comment?: string;
}): Promise<VoteApi> {
  return apiRequest<VoteApi>("/votes", {
    method: "POST",
    body: JSON.stringify(payload),
  }, [200, 201]);
}

export function reviewSubmissionByTantou(payload: ReviewRequest): Promise<SubmissionReviewApi> {
  return apiRequest<SubmissionReviewApi>("/workflow/name/review/tantou", {
    method: "POST",
    body: JSON.stringify(payload),
  }, [200, 201]);
}

export function reviewSubmissionByBoard(payload: ReviewRequest): Promise<SubmissionReviewApi> {
  return apiRequest<SubmissionReviewApi>("/workflow/name/review/board", {
    method: "POST",
    body: JSON.stringify(payload),
  }, [200, 201]);
}

export function requestRevisionByLeader(submissionId: number, leaderId: number, comment: string): Promise<unknown> {
  return apiRequest<unknown>(
    `/workflow/name/${submissionId}/request-revision?leaderId=${leaderId}&comment=${encodeURIComponent(comment)}`,
    { method: "POST" },
    [200, 201]
  );
}

export function submitIdea(userId: number, formData: FormData): Promise<SubmissionApi> {
  return apiRequest<SubmissionApi>(`/submissions/${userId}`, {
    method: "POST",
    body: formData,
  }, [200, 201]);
}

export function submissionToEditorProposal(submission: SubmissionApi): EditorProposal {
  const status = normalizeStatus(submission.status);
  return {
    id: submission.id,
    title: `Submission #${submission.id}`,
    mangaka: submission.submittedByName || "Submitted account",
    genre: ["Unspecified"],
    synopsis: submission.note || "No synopsis or content URL was provided.",
    pages: submission.fileCount || 0,
    status: status === "pending" ? "new" : status,
    time: formatDateLabel(submission.submittedAt),
    concepts: 0,
  };
}

export function taskToAssistantTask(task: TaskApi | SketchTaskApi | SubTaskApi): AssistantTask {
  const rawStatus = "subtaskStatus" in task && task.subtaskStatus ? task.subtaskStatus : task.status;
  const status = normalizeStatus(rawStatus);
  const title = "title" in task ? task.title : ("taskType" in task ? task.taskType : "");
  const description = task.description || "";
  
  let deadline = "";
  if ("deadlineDate" in task && task.deadlineDate) {
    deadline = `${task.deadlineDate} ${task.deadlineTime || ""}`.trim();
  } else {
    deadline = "deadline" in task ? (task.deadline || "") : ("completedAt" in task ? (task.completedAt || "") : "");
  }
  
  let tags = ["Production"];
  if ("productionTaskType" in task && task.productionTaskType) {
    tags = [task.productionTaskType];
  } else if ("taskType" in task && task.taskType) {
    tags = [task.taskType];
  }

  let page = 1;
  const pageMatch = description.match(/\[Page (\d+)\]/i);
  if (pageMatch) {
    page = parseInt(pageMatch[1], 10);
  }

  return {
    id: task.id,
    page,
    panel: "-",
    label: title || description || `Task #${task.id}`,
    description: description,
    tags,
    mangaka: "parentTaskId" in task ? `Task #${task.parentTaskId}` : "Unassigned",
    due: ("deadlineDate" in task && task.deadlineDate) ? deadline : formatDateLabel(deadline || ""),
    priority: status === "active" || status === "in_progress" ? "high" : "medium",
    status: status === "completed" ? "submitted" : status || "pending",
  };
}

export function voteToItem(vote: VoteApi, index: number): VoteItem {
  return {
    member: `Board Member ${index + 1}`,
    vote: vote.voteValue === "REJECT" ? "reject" : "publish",
    time: formatDateLabel(vote.votedAt),
  };
}

export interface CreateSubTaskRequest {
  requesterId: number;
  assigneeId: number;
  title: string;
  description?: string;
  productionTaskType?: string;
  deadlineDate: string;
  deadlineTime?: string;
}

export interface SubTaskApi {
  id: number;
  title: string;
  description?: string;
  productionTaskType?: string;
  status: string;
  subtaskStatus?: string;
  deadline?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  assigneeId: number;
  assigneeName?: string;
  parentTaskId?: number;
  taskId?: number;
}

export async function createSubTask(taskId: number, payload: CreateSubTaskRequest): Promise<void> {
  if (taskId === -999) {
    const mockTasks = JSON.parse(localStorage.getItem("mock_subtasks") || "[]");
    mockTasks.push({
      id: Date.now(),
      title: payload.title,
      description: payload.description,
      productionTaskType: payload.productionTaskType,
      status: "pending",
      deadline: payload.deadlineDate,
      assigneeId: payload.assigneeId,
      assigneeName: "Mock Assistant",
      parentTaskId: -999
    });
    localStorage.setItem("mock_subtasks", JSON.stringify(mockTasks));
    return;
  }

  await apiRequest<null>(`/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSubTasksForTask(taskId: number, requesterId: number): Promise<SubTaskApi[]> {
  return apiRequest<SubTaskApi[]>(`/tasks/${taskId}/subtasks?requesterId=${requesterId}`, {
    method: "GET",
  });
}

export async function getAssignedSubTasks(userId: number): Promise<SubTaskApi[]> {
  let realTasks: SubTaskApi[] = [];
  try {
    // Primary API: GET /api/users/{userId}/subtasks/assigned
    realTasks = await apiRequest<SubTaskApi[]>(`/users/${userId}/subtasks/assigned`, {
      method: "GET",
    });
  } catch (e) {
    console.warn("GET /users/{userId}/subtasks/assigned failed, trying fallback...", e);
    try {
      realTasks = await apiRequest<SubTaskApi[]>(`/users/${userId}/subtasks?requesterId=${userId}`, {
        method: "GET",
      });
    } catch (e2) {
      console.error("Fallback subtasks API failed", e2);
    }
  }
  const mockTasks = JSON.parse(localStorage.getItem("mock_subtasks") || "[]").filter((t: any) => t.assigneeId === userId);
  return [...realTasks, ...mockTasks];
}

export async function getSubTasksForAssignee(assigneeId: number, requesterId?: number): Promise<SubTaskApi[]> {
  return getAssignedSubTasks(assigneeId);
}

export async function submitSubTask(subTaskId: number, payload: { requesterId: number; note: string; files: File[] }): Promise<void> {
  const formData = new FormData();
  formData.append("requesterId", payload.requesterId.toString());
  if (payload.note) formData.append("note", payload.note);
  payload.files.forEach(file => formData.append("files", file));

  try {
    await apiRequest<unknown>(`/workflow/subtasks/${subTaskId}/submissions`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    console.warn(`POST /workflow/subtasks/${subTaskId}/submissions failed, trying status update...`, err);
    try {
      await apiRequest<unknown>(`/subtasks/${subTaskId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "submitted", note: payload.note }),
      });
    } catch (err2) {
      console.warn("API fallback failed, updating local mock state", err2);
    }
  }

  const mockTasks = JSON.parse(localStorage.getItem("mock_subtasks") || "[]");
  const idx = mockTasks.findIndex((t: any) => t.id === subTaskId);
  if (idx !== -1) {
    mockTasks[idx].status = "submitted";
    mockTasks[idx].note = payload.note;
    localStorage.setItem("mock_subtasks", JSON.stringify(mockTasks));
  }
}

export async function submitTask(taskId: number, payload: { requesterId: number; submissionType: string; note: string; files: File[] }): Promise<void> {
  const formData = new FormData();
  formData.append("requesterId", payload.requesterId.toString());
  formData.append("submissionType", payload.submissionType);
  if (payload.note) formData.append("note", payload.note);
  payload.files.forEach(file => formData.append("files", file));

  await apiRequest<unknown>(`/workflow/tasks/${taskId}/submissions`, {
    method: "POST",
    body: formData,
  });
}

export interface ActiveSubmissionFileApi {
  id: number;
  originalName: string | null;
  filePath: string | null;
  fileType: string | null;
  fileSize: number | null;
}

export interface ActiveSubmissionApi {
  id: number;
  contentUrl: string | null;
  description?: string | null;
  productionStatus: string | null;
  submittedAt: string | null;
  files: ActiveSubmissionFileApi[];
}

export interface ActiveSubTaskApi {
  id: number;
  title: string | null;
  description: string | null;
  deadlineDate: string | null;
  deadlineTime: string | null;
  subtaskStatus: string | null;
  overdue: boolean;
  submissions: ActiveSubmissionApi[];
}

export interface ActiveTaskApi {
  id: number;
  title: string | null;
  description: string | null;
  taskWorkflowStatus: string | null;
  productionTaskType: string | null;
  acceptanceCriteria: string | null;
  deadlineDate: string | null;
  deadlineTime: string | null;
  progressPercentage: number;
  subTasks: ActiveSubTaskApi[];
}

export async function getMangakaActiveTasks(mangakaId: number): Promise<ActiveTaskApi[]> {
  try {
    const res = await apiRequest<ActiveTaskApi[]>(`/tasks/mangaka/${mangakaId}`, {
      method: "GET",
    });
    return res || [];
  } catch (err) {
    console.error("Failed to fetch active tasks", err);
    return [];
  }
}
