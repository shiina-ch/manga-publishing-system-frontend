import { apiRequest, formatDateLabel, normalizeStatus } from "./api";

export interface ChapterApi {
  id: number;
  chapterNumber: number | null;
  title: string | null;
  chapterStatus: string | null;
  targetPageCount?: number | null;
  publishDate?: string | null;
  projectId?: number | null;
  ownerId?: number | null;
  ownerName?: string | null;
}

export interface SubmissionApi {
  id: number;
  taskId?: number | null;
  subTaskId?: number | null;
  submissionType?: string | null;
  parentSubmissionId?: number | null;
  status: string | null;
  note: string | null;
  submittedById?: number | null;
  submittedByName?: string | null;
  submittedAt: string | null;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  files?: SubmissionFileApi[] | null;
  fileCount?: number | null;
  project?: ProjectSummaryApi | null;
  planning?: PlanningSummaryApi | null;
}

export interface SubmissionReviewApi {
  id: number;
  submissionId?: number | null;
  reviewerId?: number | null;
  reviewerEmail?: string | null;
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
  decision: "APPROVE" | "REJECT";
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

export function getMangakaSubmissions(): Promise<SubmissionApi[]> {
  return apiRequest<SubmissionApi[]>("/submissions");
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

export function taskToAssistantTask(task: TaskApi | SketchTaskApi): AssistantTask {
  const status = normalizeStatus(task.status);
  const title = "title" in task ? task.title : task.taskType;
  const description = task.description || "";
  const deadline = "deadline" in task ? task.deadline : task.completedAt;

  return {
    id: task.id,
    page: 0,
    panel: "-",
    label: title || description || `Task #${task.id}`,
    tags: [("taskType" in task && task.taskType) || "Production"],
    mangaka: "Unassigned",
    due: formatDateLabel(deadline),
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
