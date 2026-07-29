import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  AlertTriangle, ArrowUpRight, CheckCircle, Clock, FileText,
  Image, Inbox, Link2, Loader2, RefreshCw, RotateCcw, User, X, ChevronDown,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import {
  getSubmissionById,
  getWorkflowSubmissions,
  getSubmissions,
  getMangakaSubmissions,
  reviewSubmissionByTantou,
  submitToBoard,
  getReviewsByTaskAndTantou,
  type AccountSummaryApi,
  type SubmissionApi,
  type SubmissionFileApi,
} from "../../services/workflowApi";
import { tokenStorage } from "../../storage/tokenStorage";
import { getAccountProfile, type AccountProfile } from "../../services/accountApi";
import { getAllAccounts, type AdminAccount } from "../../services/adminApi";
import { Edit3 as EditIcon, Eye as EyeIcon, ListChecks, Plus, BookOpen } from "lucide-react";
import { getProjects, getProjectById, getProductionPlans, assignMangakaToProject, assignChapterToMangaka, getProjectsByTantou, updateProjectDetailsByTantou, getProductionPlansByProject, createProductionPlan, completeProductionPlan, createChapter, completeChapter, updateChapterOverdueStatus, publishChaptersByPlan, getChaptersByMangaka, createTaskUnderChapter, createSubTask, getSubTasks, type ProjectFromApi, type ProductionPlanResponse } from "../../services/projectApi";
import { ProductionPlanDialog } from "./ProductionPlanDialog";
import { CreateChapterDialog } from "./CreateChapterDialog";
import { ExtendTimelineDialog } from "./ExtendTimelineDialog";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";

function MangakaChaptersList() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const account = tokenStorage.getAccount();
      const mangakaId = account?.id;
      if (!mangakaId) {
        setError("Mangaka ID not found in localStorage session.");
        setChapters([]);
        return;
      }
      const data = await getChaptersByMangaka(mangakaId);
      setChapters(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch assigned chapters.");
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMyChapters();
  }, [fetchMyChapters]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }} className="editor-minimal-scrollbar">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--mf-text)" }}>My Chapters</h2>
          <p style={{ fontSize: 12, color: "var(--mf-text-muted)", margin: "4px 0 0" }}>Chapters assigned to you to work on</p>
        </div>
        <button
          onClick={() => void fetchMyChapters()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", fontSize: 12, fontWeight: 800, cursor: loading ? "default" : "pointer", opacity: loading ? 0.65 : 1 }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && (
        <div style={{ padding: 60, textAlign: "center", color: "var(--mf-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Loader2 size={20} style={{ animation: "editor-spin 1s linear infinite" }} />
          Loading assigned chapters...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: 24, background: "rgba(255,42,122,0.1)", border: "1px solid rgba(255,42,122,0.3)", borderRadius: 12, color: "var(--mf-red)", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={20} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{error}</span>
        </div>
      )}

      {!loading && !error && chapters.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px dashed var(--mf-border)" }}>
          <Inbox size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>No assigned chapters found.</p>
        </div>
      )}

      {!loading && !error && chapters.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {chapters.map((ch: any) => (
            <div key={ch.id} style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--mf-text)" }}>
                  Chapter {ch.chapterNumber}: {ch.title}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", borderRadius: 6 }}>
                  {ch.status || ch.chapterStatus || "ACTIVE"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "var(--mf-text-secondary)", background: "var(--mf-bg-base)", padding: 12, borderRadius: 8 }}>
                {ch.targetPageCount != null && <div>Target Pages: <strong>{ch.targetPageCount}</strong></div>}
                {ch.priority && <div>Priority: <strong>{ch.priority}</strong></div>}
                {ch.startDate && <div>Start Date: <strong>{new Date(ch.startDate).toLocaleDateString()}</strong></div>}
                {ch.endDate && <div>End Date: <strong>{new Date(ch.endDate).toLocaleDateString()}</strong></div>}
                {ch.deadline && <div>Deadline: <strong>{new Date(ch.deadline).toLocaleDateString()}</strong></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignedProjectsList() {
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<ProjectFromApi | null>(null);
  const [editGenre, setEditGenre] = useState("");
  const [editTargetAudience, setEditTargetAudience] = useState("");
  const [editFormat, setEditFormat] = useState("");
  const [updating, setUpdating] = useState(false);

  // Detail Modal & Production Plans State
  const [detailProject, setDetailProject] = useState<ProjectFromApi | null>(null);
  const [showPlansView, setShowPlansView] = useState(false);
  const [productionPlans, setProductionPlans] = useState<ProductionPlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [extendingTimelinePlan, setExtendingTimelinePlan] = useState<ProductionPlanResponse | null>(null);

  // Created Chapters Modal State
  const [selectedPlanForChapters, setSelectedPlanForChapters] = useState<ProductionPlanResponse | null>(null);
  const [chaptersForPlan, setChaptersForPlan] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  const [expandedChapterId, setExpandedChapterId] = useState<number | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string | null>(null);

  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);
  const [reviewDecision, setReviewDecision] = useState("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewingTaskId, setReviewingTaskId] = useState<number | null>(null);
  const [tantouComments, setTantouComments] = useState<any[]>([]);
  const [loadingTantouComments, setLoadingTantouComments] = useState(false);

  // Chapter Detail Modal & Mangaka List State
  const [selectedChapterDetail, setSelectedChapterDetail] = useState<any | null>(null);
  const [activeChapterTab, setActiveChapterTab] = useState<"details" | "tasks">("details");
  const [mangakaList, setMangakaList] = useState<AdminAccount[]>([]);
  const [assigningMangaka, setAssigningMangaka] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any | null>(null);
  const [activeTaskDetailTab, setActiveTaskDetailTab] = useState<"detail" | "subtask">("detail");

  // Create Task Form State
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAcceptanceCriteria, setTaskAcceptanceCriteria] = useState("");
  const [taskType, setTaskType] = useState("OUTLINE");
  const [taskDeadlineDate, setTaskDeadlineDate] = useState("");
  const [taskDeadlineTime, setTaskDeadlineTime] = useState("09:00");
  const [creatingTask, setCreatingTask] = useState(false);

  // Create SubTask Form State
  const [showCreateSubTaskDialog, setShowCreateSubTaskDialog] = useState(false);
  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [subTaskDescription, setSubTaskDescription] = useState("");
  const [subTaskType, setSubTaskType] = useState("OUTLINE");
  const [subTaskAssigneeId, setSubTaskAssigneeId] = useState("");
  const [subTaskDeadlineDate, setSubTaskDeadlineDate] = useState("");
  const [subTaskDeadlineTime, setSubTaskDeadlineTime] = useState("09:00");
  const [creatingSubTask, setCreatingSubTask] = useState(false);
  const [loadingSubTasks, setLoadingSubTasks] = useState(false);
  const [assistantList, setAssistantList] = useState<AdminAccount[]>([]);

  const fetchAssistants = useCallback(async () => {
    try {
      const accounts = await getAllAccounts();
      const filtered = accounts.filter(acc =>
        acc.systemRole?.some(role => role.roleName?.toUpperCase().includes("ASSISTANT")) ||
        acc.requestedRole?.toUpperCase().includes("ASSISTANT")
      );
      setAssistantList(filtered.length > 0 ? filtered : accounts);
    } catch {
      setAssistantList([]);
    }
  }, []);

  useEffect(() => {
    void fetchAssistants();
  }, [fetchAssistants]);

  // Periodic check for overdue chapters and publishing chapters
  useEffect(() => {
    const checkOverdueChapters = () => {
      if (!productionPlans || productionPlans.length === 0) return;
      
      productionPlans.forEach(plan => {
        // Automatically check to publish chapters by plan
        publishChaptersByPlan(plan.id).catch(console.error);
        
        if (plan.chapters && Array.isArray(plan.chapters)) {
          plan.chapters.forEach(chapter => {
            // Call API to update overdue status silently
            updateChapterOverdueStatus(chapter.id).catch(console.error);
          });
        }
      });
    };

    // Run once immediately (optional, but good for instant check), then every 5 minutes
    // But the prompt says "every 5 minites call api", so we just set the interval
    const intervalId = setInterval(checkOverdueChapters, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [productionPlans]);

  const fetchSubTasksForCurrentTask = async (taskId: number) => {
    const requesterId = tokenStorage.getAccount()?.id;
    if (!requesterId || !taskId) return;
    setLoadingSubTasks(true);
    try {
      const list = await getSubTasks(taskId, requesterId);
      if (Array.isArray(list)) {
        setSelectedTaskDetail((prev: any) => prev?.id === taskId ? { ...prev, subTasks: list } : prev);
      }
    } catch (err) {
      console.error("Failed to fetch subtasks:", err);
    } finally {
      setLoadingSubTasks(false);
    }
  };

  const handleOpenCreateSubTaskModal = () => {
    setSubTaskTitle("");
    setSubTaskDescription("");
    setSubTaskType(selectedTaskDetail?.productionTaskType || "OUTLINE");
    setSubTaskAssigneeId("");
    const today = new Date().toISOString().slice(0, 10);
    setSubTaskDeadlineDate(today);
    setSubTaskDeadlineTime("09:00");
    setShowCreateSubTaskDialog(true);
  };

  const handleCreateSubTaskSubmit = async () => {
    if (!selectedTaskDetail?.id) {
      toast.error("No task selected");
      return;
    }
    if (!subTaskTitle.trim()) {
      toast.error("Subtask title is required");
      return;
    }
    const requesterId = tokenStorage.getAccount()?.id;
    if (!requesterId) {
      toast.error("Authentication required to create subtask");
      return;
    }

    setCreatingSubTask(true);
    try {
      const formattedDeadlineTime = subTaskDeadlineTime.length === 5 ? `${subTaskDeadlineTime}:00` : subTaskDeadlineTime;

      const createdSubTask = await createSubTask(selectedTaskDetail.id, {
        requesterId,
        assigneeId: subTaskAssigneeId ? Number(subTaskAssigneeId) : null,
        title: subTaskTitle.trim(),
        description: subTaskDescription.trim(),
        productionTaskType: subTaskType,
        deadlineDate: subTaskDeadlineDate,
        deadlineTime: formattedDeadlineTime,
      });

      toast.success("Subtask created successfully!");
      setShowCreateSubTaskDialog(false);

      const currentSubTasks = Array.isArray(selectedTaskDetail.subTasks) ? selectedTaskDetail.subTasks : [];
      const updatedSubTasks = [...currentSubTasks, createdSubTask];
      setSelectedTaskDetail((prev: any) => prev ? { ...prev, subTasks: updatedSubTasks } : null);

      void fetchSubTasksForCurrentTask(selectedTaskDetail.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create subtask.");
    } finally {
      setCreatingSubTask(false);
    }
  };

  // Create Chapter Dialog State
  const [showCreateChapterDialog, setShowCreateChapterDialog] = useState(false);
  const [chNumber, setChNumber] = useState(1);
  const [chTitle, setChTitle] = useState("");
  const [chStatus, setChStatus] = useState("BACKLOG");
  const [chTargetPageCount, setChTargetPageCount] = useState(1);
  const [chStartDate, setChStartDate] = useState("");
  const [chEndDate, setChEndDate] = useState("");
  const [chPublishDate, setChPublishDate] = useState("");
  const [chDeadline, setChDeadline] = useState("");
  const [chPriority, setChPriority] = useState("Medium");
  const [creatingChapter, setCreatingChapter] = useState(false);

  // New Production Plan Dialog State
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [planDeadlineDate, setPlanDeadlineDate] = useState("");
  const [planPublishDate, setPlanPublishDate] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);

  const fetchAssignedProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const account = tokenStorage.getAccount();
      const tantouId = account?.id;
      if (!tantouId) {
        setError("Tantou ID not found in localStorage account.");
        setProjects([]);
        return;
      }
      const data = await getProjectsByTantou(tantouId);
      setProjects(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch assigned projects.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssignedProjects();
  }, [fetchAssignedProjects]);

  const handleOpenEdit = (e: React.MouseEvent, project: ProjectFromApi) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditGenre(project.genre || "");
    setEditTargetAudience(project.targetAudience || "");
    setEditFormat(project.format || "WEBTOON");
  };

  const handleOpenDetail = (project: ProjectFromApi) => {
    setDetailProject(project);
    setShowPlansView(false);
    setProductionPlans([]);
    setPlansError(null);
  };

  useEffect(() => {
    if (reviewingTaskId) {
      const currentUser = tokenStorage.getAccount();
      if (currentUser?.id) {
        setLoadingTantouComments(true);
        getReviewsByTaskAndTantou(reviewingTaskId, currentUser.id)
          .then(res => {
            setTantouComments(res || []);
          })
          .catch(err => {
            console.error("Failed to fetch tantou comments:", err);
            setTantouComments([]);
          })
          .finally(() => {
            setLoadingTantouComments(false);
          });
      }
    } else {
      setTantouComments([]);
    }
  }, [reviewingTaskId]);

  const handleFetchPlans = async (projectId: number) => {
    setShowPlansView(true);
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const plans = await getProductionPlansByProject(projectId);
      setProductionPlans(plans);
    } catch (err: any) {
      setPlansError(err?.message || "Failed to fetch production plans for this project.");
      setProductionPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchMangakas = useCallback(async () => {
    try {
      const accounts = await getAllAccounts();
      const mangakas = accounts.filter(acc =>
        acc.systemRole?.some(role => role.roleName?.toUpperCase() === "MANGAKA") ||
        acc.requestedRole?.toUpperCase() === "MANGAKA"
      );
      setMangakaList(mangakas);
    } catch {
      setMangakaList([]);
    }
  }, []);

  useEffect(() => {
    void fetchMangakas();
  }, [fetchMangakas]);

  const handleFetchCreatedChapters = async (plan: ProductionPlanResponse) => {
    setSelectedPlanForChapters(plan);
    setLoadingChapters(true);
    setChaptersError(null);
    try {
      const allPlans = await getProductionPlans();
      const matchedPlan = allPlans.find((p: any) => p.id === plan.id);
      if (matchedPlan && Array.isArray(matchedPlan.chapters)) {
        setChaptersForPlan(matchedPlan.chapters);
      } else {
        setChaptersForPlan(plan.chapters || []);
      }
    } catch (err: any) {
      setChaptersError(err?.message || "Failed to fetch chapters for this plan.");
      setChaptersForPlan(plan.chapters || []);
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleOpenChapterDetail = (ch: any) => {
    setSelectedChapterDetail(ch);
    setSelectedTaskDetail(null);
    setActiveChapterTab("details");
  };

  const handleOpenCreateTaskModal = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskAcceptanceCriteria("");
    setTaskType("OUTLINE");
    const today = new Date().toISOString().slice(0, 10);
    setTaskDeadlineDate(today);
    setTaskDeadlineTime("09:00");
    setShowCreateTaskDialog(true);
  };

  const handleCreateTaskSubmit = async () => {
    if (!selectedChapterDetail?.id) {
      toast.error("No chapter selected");
      return;
    }
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    const requesterId = tokenStorage.getAccount()?.id;
    if (!requesterId) {
      toast.error("Authentication required to create task");
      return;
    }

    setCreatingTask(true);
    try {
      // Format deadlineTime string ISO datetime e.g. "2026-08-30T09:00:00"
      const formattedDeadlineTime = `${taskDeadlineDate || new Date().toISOString().slice(0, 10)}T${taskDeadlineTime.length === 5 ? taskDeadlineTime + ":00" : taskDeadlineTime}`;

      const createdTask = await createTaskUnderChapter(selectedChapterDetail.id, {
        requesterId,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        acceptanceCriteria: taskAcceptanceCriteria.trim(),
        productionTaskType: taskType,
        deadlineDate: taskDeadlineDate,
        deadlineTime: formattedDeadlineTime,
      });

      toast.success("Task created under chapter successfully!");
      setShowCreateTaskDialog(false);

      // Update local tasks array for selected chapter
      const updatedTasks = Array.isArray(selectedChapterDetail.tasks) ? [...selectedChapterDetail.tasks, createdTask] : [createdTask];
      setSelectedChapterDetail((prev: any) => prev ? { ...prev, tasks: updatedTasks } : null);

      // Refresh chapters list
      if (selectedPlanForChapters) {
        await handleFetchCreatedChapters(selectedPlanForChapters);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleAssignMangakaToChapter = async (chapterId: number, mangakaIdStr: string) => {
    if (!mangakaIdStr) return;
    const mangakaId = Number(mangakaIdStr);
    setAssigningMangaka(true);
    try {
      await assignChapterToMangaka(chapterId, mangakaId);
      toast.success("Mangaka assigned to chapter successfully!");
      // Refresh chapters
      if (selectedPlanForChapters) {
        await handleFetchCreatedChapters(selectedPlanForChapters);
      }
      if (activeProjectForPlans) {
        await handleOpenPlansPage(activeProjectForPlans);
      }
      // Update local chapter detail
      const selectedMangaka = mangakaList.find(m => m.id === mangakaId);
      const fullName = selectedMangaka ? `${selectedMangaka.firstName} ${selectedMangaka.lastName}`.trim() : `Mangaka #${mangakaId}`;
      setSelectedChapterDetail((prev: any) => prev ? { ...prev, assigneeId: mangakaId, assigneeName: fullName } : null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign Mangaka to chapter.");
    } finally {
      setAssigningMangaka(false);
    }
  };
  const handleOpenCreateChapterModal = (plan: ProductionPlanResponse) => {
    // Pre-fill chapter dates within plan range if available
    setChNumber((chaptersForPlan.length || 0) + 1);
    setChTitle("");
    setChStatus("BACKLOG");
    setChTargetPageCount(1);
    setChStartDate(plan.startDate ? plan.startDate.slice(0, 10) : "");
    setChEndDate(plan.endDate ? plan.endDate.slice(0, 10) : "");
    setChPublishDate(plan.publishDate ? plan.publishDate.slice(0, 10) : "");
    setChDeadline(plan.deadline ? plan.deadline.slice(0, 10) : "");
    setChPriority("Medium");
    setShowCreateChapterDialog(true);
  };

  const handleCreateChapterSubmit = async () => {
    if (!selectedPlanForChapters || !activeProjectForPlans) return;
    if (!chTitle.trim()) {
      toast.error("Chapter title is required.");
      return;
    }

    const account = tokenStorage.getAccount();
    const tantouId = account?.id;
    if (!tantouId) {
      toast.error("Tantou account ID not found.");
      return;
    }

    // FE Validation for Chapter Dates:
    // production plan startDate <= chapter date <= production plan publishDate / endDate
    const pStartStr = selectedPlanForChapters.startDate ? selectedPlanForChapters.startDate.slice(0, 10) : null;
    const pEndStr = selectedPlanForChapters.publishDate || selectedPlanForChapters.endDate
      ? (selectedPlanForChapters.publishDate || selectedPlanForChapters.endDate)!.slice(0, 10)
      : null;

    const chapterDates = [
      { name: "Start Date", val: chStartDate },
      { name: "End Date", val: chEndDate },
      { name: "Publish Date", val: chPublishDate },
      { name: "Deadline", val: chDeadline },
    ];

    for (const d of chapterDates) {
      if (d.val) {
        if (pStartStr && d.val < pStartStr) {
          toast.error(`Chapter ${d.name} (${d.val}) cannot be earlier than plan start date (${pStartStr}).`);
          return;
        }
        if (pEndStr && d.val > pEndStr) {
          toast.error(`Chapter ${d.name} (${d.val}) cannot be later than plan publish/end date (${pEndStr}).`);
          return;
        }
      }
    }

    setCreatingChapter(true);
    try {
      await createChapter(
        activeProjectForPlans.id,
        {
          planId: selectedPlanForChapters.id,
          chapterNumber: chNumber,
          title: chTitle,
          chapterStatus: chStatus,
          targetPageCount: chTargetPageCount,
          startDate: chStartDate || undefined,
          endDate: chEndDate || undefined,
          publishDate: chPublishDate || undefined,
          deadline: chDeadline ? `${chDeadline}T23:59:59.000Z` : undefined,
          priority: chPriority,
        },
        tantouId
      );

      toast.success(`Chapter ${chNumber} created successfully!`);
      setShowCreateChapterDialog(false);
      await handleFetchCreatedChapters(selectedPlanForChapters);
      await handleOpenPlansPage(activeProjectForPlans);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create chapter.");
    } finally {
      setCreatingChapter(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProject) return;
    const account = tokenStorage.getAccount();
    const tantouId = account?.id;
    if (!tantouId) {
      toast.error("Tantou account ID missing.");
      return;
    }

    setUpdating(true);
    try {
      await updateProjectDetailsByTantou(editingProject.id, tantouId, {
        genre: editGenre,
        targetAudience: editTargetAudience,
        format: editFormat,
      });
      toast.success("Project details updated successfully!");
      setEditingProject(null);
      await fetchAssignedProjects();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project details");
    } finally {
      setUpdating(false);
    }
  };

  // Active Project for Dedicated Full-Page View of Production Plans
  const [activeProjectForPlans, setActiveProjectForPlans] = useState<ProjectFromApi | null>(null);

  const handleOpenPlansPage = async (project: ProjectFromApi) => {
    setActiveProjectForPlans(project);
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const plans = await getProductionPlansByProject(project.id);
      setProductionPlans(plans);
    } catch (err: any) {
      setPlansError(err?.message || "Failed to fetch production plans for this project.");
      setProductionPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePostReview = async () => {
    if (!reviewingSubmissionId) return;
    if (!reviewNote.trim()) {
      toast.error("Note is required.");
      return;
    }
    const account = tokenStorage.getAccount();
    if (!account?.id) {
      toast.error("Authentication required.");
      return;
    }

    setSubmittingReview(true);
    try {
      const { postSubmissionReview } = await import("../../services/workflowApi");
      await postSubmissionReview(reviewingSubmissionId, {
        reviewerId: account.id,
        decision: reviewDecision,
        note: reviewNote.trim()
      });
      toast.success("Review submitted successfully!");
      setReviewingSubmissionId(null);
      setReviewingTaskId(null);
      setReviewNote("");
      setReviewDecision("APPROVED");
      // Refresh data
      if (activeProjectForPlans) {
        await handleOpenPlansPage(activeProjectForPlans);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!activeProjectForPlans) return;
    if (!planTitle.trim()) {
      toast.error("Plan title is required.");
      return;
    }

    // FE Validation for Production Plan Dates following BE rules:
    // startDate <= deadlineDate < endDate <= publishDate
    if (planStartDate && planDeadlineDate && planStartDate > planDeadlineDate) {
      toast.error("Start date must be on or before deadline date.");
      return;
    }
    if (planDeadlineDate && planEndDate && planDeadlineDate >= planEndDate) {
      toast.error("Deadline date must be strictly before end date (needs at least 1 day buffer).");
      return;
    }
    if (planEndDate && planPublishDate && planEndDate > planPublishDate) {
      toast.error("End date must be on or before publish date.");
      return;
    }

    setCreatingPlan(true);
    try {
      await createProductionPlan(activeProjectForPlans.id, {
        title: planTitle,
        startDate: planStartDate || undefined,
        endDate: planEndDate || undefined,
        deadlineDate: planDeadlineDate || undefined,
        publishDate: planPublishDate || undefined,
      });
      toast.success("Production plan created successfully!");
      setShowCreatePlanDialog(false);
      setPlanTitle("");
      setPlanStartDate("");
      setPlanEndDate("");
      setPlanDeadlineDate("");
      setPlanPublishDate("");
      await handleOpenPlansPage(activeProjectForPlans);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create production plan.");
    } finally {
      setCreatingPlan(false);
    }
  };

  // Dedicated Production Plans Full-Screen Dynamic Page
  if (activeProjectForPlans) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }} className="editor-minimal-scrollbar">
        {/* Dynamic Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setActiveProjectForPlans(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--mf-bg-surface)",
                border: "1px solid var(--mf-border)",
                borderRadius: 8,
                color: "var(--mf-text)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ← Back to Projects
            </button>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "var(--mf-text)" }}>
                Production Plans — {activeProjectForPlans.title || `Project #${activeProjectForPlans.id}`}
              </h2>
              <p style={{ fontSize: 12, color: "var(--mf-text-muted)", margin: "4px 0 0" }}>
                Dedicated production plan timeline and chapter workflow breakdown
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowCreatePlanDialog(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--mf-cyan)",
                border: "none",
                borderRadius: 8,
                color: "#000",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> New Plan
            </button>
            <button
              onClick={() => void handleOpenPlansPage(activeProjectForPlans)}
              disabled={loadingPlans}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", fontSize: 12, fontWeight: 800, cursor: loadingPlans ? "default" : "pointer", opacity: loadingPlans ? 0.65 : 1 }}
            >
              <RefreshCw size={13} /> Refresh Plans
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loadingPlans && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--mf-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Loader2 size={20} style={{ animation: "editor-spin 1s linear infinite" }} />
            Loading project production plans...
          </div>
        )}

        {/* Error state */}
        {!loadingPlans && plansError && (
          <div style={{ padding: 24, background: "rgba(255,42,122,0.1)", border: "1px solid rgba(255,42,122,0.3)", borderRadius: 12, color: "var(--mf-red)", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>{plansError}</span>
          </div>
        )}

        {/* Empty state */}
        {!loadingPlans && !plansError && productionPlans.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px dashed var(--mf-border)" }}>
            <Inbox size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>No production plans found for this project.</p>
          </div>
        )}

        {/* Production Plans Content Grid */}
        {!loadingPlans && !plansError && productionPlans.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {productionPlans.map((plan) => (
              <div key={plan.id} style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-cyan)" }}>{plan.title || `Production Plan #${plan.id}`}</span>
                    {plan.planStatus && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 8px",
                        background: plan.planStatus === "ACTIVE" ? "rgba(0, 240, 255, 0.1)" : "rgba(255, 42, 122, 0.1)",
                        color: plan.planStatus === "ACTIVE" ? "var(--mf-cyan)" : "var(--mf-magenta)",
                        borderRadius: 4,
                        border: `1px solid ${plan.planStatus === "ACTIVE" ? "rgba(0, 240, 255, 0.3)" : "rgba(255, 42, 122, 0.3)"}`,
                        textTransform: "uppercase"
                      }}>
                        {plan.planStatus}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {plan.approvalStatus && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", borderRadius: 6, border: "1px solid var(--mf-cyan-border)" }}>
                        {plan.approvalStatus}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setExtendingTimelinePlan(plan);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(0, 240, 255, 0.1)",
                        border: "1px solid rgba(0, 240, 255, 0.3)",
                        borderRadius: 6,
                        color: "var(--mf-cyan)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Extend Timeline Plan
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to end this project?")) {
                          try {
                            const tantouId = tokenStorage.getAccount()?.id;
                            if (!tantouId) throw new Error("No tantou ID found");
                            await completeProductionPlan(plan.id, tantouId);
                            toast.success("Plan completed successfully");
                            if (plan.projectId) {
                              handleFetchPlans(plan.projectId);
                            }
                          } catch (err: any) {
                            toast.error("Failed to complete plan: " + (err.message || "Unknown error"));
                          }
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255, 42, 122, 0.1)",
                        border: "1px solid rgba(255, 42, 122, 0.3)",
                        borderRadius: 6,
                        color: "var(--mf-magenta)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Complete Plan
                    </button>
                    <button
                      onClick={() => void handleFetchCreatedChapters(plan)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        background: "rgba(0,210,255,0.1)",
                        border: "1px solid rgba(0,210,255,0.3)",
                        borderRadius: 6,
                        color: "var(--mf-cyan)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <BookOpen size={14} /> Created Chapter
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, background: "var(--mf-bg-base)", padding: 14, borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                  {plan.priority && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>PRIORITY</span> <strong style={{ fontSize: 13 }}>{plan.priority}</strong></div>}
                  {plan.budget != null && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>BUDGET</span> <strong style={{ fontSize: 13 }}>${plan.budget}</strong></div>}
                  {plan.startDate && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>START DATE</span> <strong style={{ fontSize: 13 }}>{new Date(plan.startDate).toLocaleString()}</strong></div>}
                  {plan.endDate && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>END DATE</span> <strong style={{ fontSize: 13 }}>{new Date(plan.endDate).toLocaleString()}</strong></div>}
                  {(plan.deadlineDate || plan.deadline) && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>DEADLINE DATE</span> <strong style={{ fontSize: 13 }}>{new Date(plan.deadlineDate || plan.deadline || "").toLocaleString()}</strong></div>}
                  {plan.publishDate && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>PUBLISH DATE</span> <strong style={{ fontSize: 13 }}>{new Date(plan.publishDate).toLocaleString()}</strong></div>}
                  {plan.risk && <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>RISK ASSESSMENT</span> <strong style={{ fontSize: 13 }}>{plan.risk}</strong></div>}
                </div>

                {plan.milestones && (
                  <div style={{ fontSize: 13, background: "var(--mf-bg-base)", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "var(--mf-cyan)", display: "block", marginBottom: 4, fontSize: 11 }}>MILESTONES</strong>
                    {plan.milestones}
                  </div>
                )}
                {plan.schedule && (
                  <div style={{ fontSize: 13, background: "var(--mf-bg-base)", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "var(--mf-cyan)", display: "block", marginBottom: 4, fontSize: 11 }}>SCHEDULE</strong>
                    {plan.schedule}
                  </div>
                )}
                {plan.chapterTimeline && (
                  <div style={{ fontSize: 13, background: "var(--mf-bg-base)", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "var(--mf-cyan)", display: "block", marginBottom: 4, fontSize: 11 }}>CHAPTER TIMELINE</strong>
                    {plan.chapterTimeline}
                  </div>
                )}
                {plan.resources && (
                  <div style={{ fontSize: 13, background: "var(--mf-bg-base)", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "var(--mf-cyan)", display: "block", marginBottom: 4, fontSize: 11 }}>RESOURCES</strong>
                    {plan.resources}
                  </div>
                )}
                {plan.assistantAllocation && (
                  <div style={{ fontSize: 13, background: "var(--mf-bg-base)", padding: 12, borderRadius: 8 }}>
                    <strong style={{ color: "var(--mf-cyan)", display: "block", marginBottom: 4, fontSize: 11 }}>ASSISTANT ALLOCATION</strong>
                    {plan.assistantAllocation}
                  </div>
                )}

                {plan.chapters && plan.chapters.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px dashed var(--mf-border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-cyan)", marginBottom: 8 }}>CHAPTER WORKFLOW ({plan.chapters.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {plan.chapters.map(c => {
                        const isExpanded = expandedChapterId === c.id;
                        return (
                          <div key={c.id} style={{ background: "var(--mf-bg-base)", borderRadius: 8, border: "1px solid var(--mf-border)", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }} onClick={() => setExpandedChapterId(isExpanded ? null : c.id)}>
                            <div style={{ fontSize: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontWeight: 800, display: "block", color: "var(--mf-text)" }}>Ch.{c.chapterNumber}: {c.title}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await completeChapter(c.id);
                                      toast.success("Chapter marked as completed!");
                                      if (plan.projectId) {
                                        handleFetchPlans(plan.projectId);
                                      }
                                    } catch (err: any) {
                                      toast.error(err.message || "Failed to mark chapter as completed");
                                    }
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    background: "rgba(0, 255, 128, 0.1)",
                                    border: "1px solid rgba(0, 255, 128, 0.3)",
                                    borderRadius: 6,
                                    color: "var(--mf-green)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                  }}
                                >
                                  <CheckCircle size={12} /> Mark Complete This Chapter
                                </button>
                                <span style={{ color: "var(--mf-cyan)", fontWeight: 800, fontSize: 11, background: "var(--mf-cyan-dim)", padding: "2px 8px", borderRadius: 4 }}>
                                  {c.chapterStatus || c.status || "ACTIVE"}
                                </span>
                                {isExpanded ? <ChevronDown size={14} color="var(--mf-text-muted)" /> : <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} color="var(--mf-text-muted)" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{ padding: "14px", borderTop: "1px solid var(--mf-border)", background: "rgba(0,0,0,0.15)", cursor: "default" }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 12, marginBottom: 16 }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>Title</span><span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{c.title}</span></div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>Assignee</span><span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{c.ownerName || "None"}</span></div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>Status</span><span style={{ color: "var(--mf-cyan)", fontWeight: 600 }}>{c.chapterStatus || c.status || "ACTIVE"}</span></div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>Target Pages</span><span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{c.targetPageCount || "N/A"}</span></div>
                                  {c.startDate && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>Start Date</span><span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{new Date(c.startDate).toLocaleDateString()}</span></div>}
                                  {c.deadline && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>Deadline</span><span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{new Date(c.deadline).toLocaleDateString()}</span></div>}
                                  {c.endDate && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", textTransform: "uppercase" }}>End Date</span><span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{new Date(c.endDate).toLocaleDateString()}</span></div>}
                                </div>


                                {c.tasks && c.tasks.length > 0 ? (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 8, textTransform: "uppercase" }}>Tasks</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                      {c.tasks.map((task: any) => (
                                        <div key={task.id} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontWeight: 800, color: "var(--mf-text)" }}>{task.title}</span>
                                            <span style={{ color: "var(--mf-cyan)", fontSize: 10, background: "var(--mf-cyan-dim)", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>{task.taskWorkflowStatus || task.status}</span>
                                          </div>
                                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", color: "var(--mf-text-muted)", fontSize: 11 }}>
                                            <div><strong>Assignee:</strong> <span style={{ color: "var(--mf-text)" }}>{task.assigneeName || "None"}</span></div>
                                            <div><strong>Type:</strong> <span style={{ color: "var(--mf-text)" }}>{task.productionTaskType}</span></div>
                                            {task.acceptanceCriteria && <div style={{ gridColumn: "1 / -1" }}><strong>Acceptance:</strong> {task.acceptanceCriteria}</div>}
                                            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                              <Clock size={12} color="var(--mf-orange)" />
                                              <strong style={{ color: "var(--mf-orange)" }}>Deadline:</strong> {task.deadlineDate ? `${task.deadlineDate} ${task.deadlineTime || ''}` : "No deadline"}
                                            </div>
                                          </div>
                                          {task.submissions && task.submissions.length > 0 && (
                                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                                              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Submissions</div>
                                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                {task.submissions.map((sub: any) => (
                                                  <div key={sub.id} style={{ background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)" }}>By {sub.submittedByName}</span>
                                                      <span style={{ fontSize: 9, color: "var(--mf-text-muted)" }}>{new Date(sub.submittedAt).toLocaleString()}</span>
                                                    </div>
                                                    {sub.note && <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginBottom: 6, fontStyle: "italic" }}>"{sub.note}"</div>}
                                                    {sub.files && sub.files.length > 0 && (
                                                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                        {sub.files.map((f: any) => (
                                                          <button type="button" key={f.id} onClick={(e) => { e.stopPropagation(); setViewingFileUrl(f.filePath); setViewingFileName(f.originalName); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--mf-cyan)", textDecoration: "none", background: "rgba(0,240,255,0.05)", padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(0,240,255,0.1)", cursor: "pointer", width: "100%", textAlign: "left" }}>
                                                            <FileText size={12} />
                                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.originalName}</span>
                                                            <span style={{ color: "var(--mf-text-muted)", fontSize: 9, marginLeft: "auto" }}>{f.fileType}</span>
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                                                      <button
                                                        onClick={(e) => { e.stopPropagation(); setReviewingSubmissionId(sub.id); setReviewingTaskId(task.id); }}
                                                        style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 6, color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(0, 240, 255, 0.2)" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 240, 255, 0.3)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 240, 255, 0.2)"; }}
                                                      >
                                                        Review Task
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 12, color: "var(--mf-text-muted)", fontStyle: "italic", background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: 8, textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)" }}>
                                    No tasks in this chapter yet.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* File Viewer Modal */}
        {viewingFileUrl && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={20} color="var(--mf-cyan)" />
                {viewingFileName || "Viewing File"}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <a href={viewingFileUrl} target="_blank" rel="noreferrer" style={{ background: "var(--mf-cyan)", color: "#000", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800, textDecoration: "none" }}>Open in New Tab</a>
                <button onClick={() => { setViewingFileUrl(null); setViewingFileName(null); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", padding: "6px", borderRadius: 6, display: "flex", alignItems: "center" }}><X size={18} /></button>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflow: "auto" }}>
              {viewingFileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img src={viewingFileUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }} />
              ) : (
                <div style={{ color: "var(--mf-text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <FileText size={48} />
                  <p style={{ margin: 0 }}>Preview not available for this file type.</p>
                  <a href={viewingFileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--mf-cyan)", fontWeight: 700, textDecoration: "none" }}>Download or Open File</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Modal */}
        <Dialog open={!!reviewingSubmissionId} onOpenChange={(open) => {
          if (!open) {
            setReviewingSubmissionId(null);
            setReviewingTaskId(null);
            setReviewNote("");
            setReviewDecision("APPROVED");
          }
        }}>
          <DialogContent className="max-w-md bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)]">
            <DialogTitle className="text-lg font-bold text-[var(--mf-text)]">
              Review Task Submission
            </DialogTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              {loadingTantouComments ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--mf-text-muted)" }}>
                  <Loader2 size={14} className="animate-spin" /> Loading past reviews...
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 8 }}>Comments</label>
                  {tantouComments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "150px", overflowY: "auto", paddingRight: 8 }}>
                      {tantouComments.map((comment: any, idx: number) => (
                        <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                            <span style={{ fontWeight: 800, color: "var(--mf-cyan)" }}>{comment.reviewerName || "You"}</span>
                            <span style={{ color: "var(--mf-text-muted)" }}>{new Date(comment.reviewedAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--mf-text)" }}>{comment.comment}</div>
                          <div style={{ fontSize: 10, marginTop: 4, color: comment.decision === "APPROVED" ? "var(--mf-green)" : "var(--mf-red)", fontWeight: 700 }}>
                            {comment.decision}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--mf-text-muted)", fontStyle: "italic", background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: 8, textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)" }}>
                      No past comments found.
                    </div>
                  )}
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 8 }}>Decision</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setReviewDecision("APPROVED")}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, border: reviewDecision === "APPROVED" ? "2px solid var(--mf-green)" : "1px solid var(--mf-border)", background: reviewDecision === "APPROVED" ? "rgba(0,255,0,0.1)" : "var(--mf-bg-base)", color: reviewDecision === "APPROVED" ? "var(--mf-green)" : "var(--mf-text-muted)", cursor: "pointer" }}
                  >
                    <CheckCircle size={16} /> APPROVED
                  </button>
                  <button
                    onClick={() => setReviewDecision("REJECTED")}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, border: reviewDecision === "REJECTED" ? "2px solid var(--mf-red)" : "1px solid var(--mf-border)", background: reviewDecision === "REJECTED" ? "rgba(255,0,0,0.1)" : "var(--mf-bg-base)", color: reviewDecision === "REJECTED" ? "var(--mf-red)" : "var(--mf-text-muted)", cursor: "pointer" }}
                  >
                    <X size={16} /> REJECTED
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Note *</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Provide feedback on the submission..."
                  rows={4}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13, resize: "none" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => { setReviewingSubmissionId(null); setReviewingTaskId(null); }}
                  disabled={submittingReview}
                  style={{ padding: "8px 16px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13, fontWeight: 700, cursor: submittingReview ? "not-allowed" : "pointer", opacity: submittingReview ? 0.6 : 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostReview}
                  disabled={submittingReview}
                  style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, cursor: submittingReview ? "not-allowed" : "pointer", opacity: submittingReview ? 0.6 : 1 }}
                >
                  {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Submit Review
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Production Plan Dialog */}
        <Dialog open={showCreatePlanDialog} onOpenChange={(open) => !open && setShowCreatePlanDialog(false)}>
          <DialogContent className="max-w-md bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)]">
            <DialogTitle className="text-lg font-bold text-[var(--mf-text)]">
              Create Production Plan
            </DialogTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Plan Title *</label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Production Plan 2026"
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    value={planStartDate}
                    max={planDeadlineDate || planEndDate || planPublishDate || undefined}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Deadline Date * (Strict &lt; End Date)</label>
                  <input
                    type="date"
                    value={planDeadlineDate}
                    min={planStartDate || undefined}
                    max={planEndDate || planPublishDate || undefined}
                    onChange={(e) => setPlanDeadlineDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>End Date (Plan Close)</label>
                  <input
                    type="date"
                    value={planEndDate}
                    min={planDeadlineDate || planStartDate || undefined}
                    max={planPublishDate || undefined}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Publish Date</label>
                  <input
                    type="date"
                    value={planPublishDate}
                    min={planEndDate || planDeadlineDate || planStartDate || undefined}
                    onChange={(e) => setPlanPublishDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setShowCreatePlanDialog(false)}
                  disabled={creatingPlan}
                  style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreatePlan()}
                  disabled={creatingPlan}
                  style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 800, cursor: creatingPlan ? "default" : "pointer", opacity: creatingPlan ? 0.7 : 1 }}
                >
                  {creatingPlan ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Created Chapters Modal */}
        <Dialog open={Boolean(selectedPlanForChapters)} onOpenChange={(open) => !open && setSelectedPlanForChapters(null)}>
          <DialogContent className="max-w-xl bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)] max-h-[80vh] overflow-y-auto">
            <DialogTitle className="text-lg font-bold text-[var(--mf-text)] border-b border-[var(--mf-border)] pb-3 flex items-center justify-between">
              <span>Created Chapters for: {selectedPlanForChapters?.title || `Plan #${selectedPlanForChapters?.id}`}</span>
              {selectedPlanForChapters && (
                <button
                  onClick={() => handleOpenCreateChapterModal(selectedPlanForChapters)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    marginRight: 24,
                    background: "var(--mf-cyan)",
                    border: "none",
                    borderRadius: 8,
                    color: "#000",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Create Chapter
                </button>
              )}
            </DialogTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {loadingChapters && (
                <div style={{ padding: 30, textAlign: "center", color: "var(--mf-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <Loader2 size={18} style={{ animation: "editor-spin 1s linear infinite" }} />
                  Loading created chapters...
                </div>
              )}

              {!loadingChapters && chaptersError && (
                <div style={{ padding: 14, background: "rgba(255,42,122,0.1)", border: "1px solid rgba(255,42,122,0.3)", borderRadius: 8, color: "var(--mf-red)", fontSize: 12, fontWeight: 700 }}>
                  {chaptersError}
                </div>
              )}

              {!loadingChapters && !chaptersError && chaptersForPlan.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-base)", borderRadius: 8, border: "1px dashed var(--mf-border)" }}>
                  <Inbox size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>No chapters created for this production plan yet.</p>
                </div>
              )}

              {!loadingChapters && !chaptersError && chaptersForPlan.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {chaptersForPlan.map((ch: any) => (
                    <div
                      key={ch.id}
                      onClick={() => handleOpenChapterDetail(ch)}
                      style={{
                        background: "var(--mf-bg-base)",
                        border: "1px solid var(--mf-border)",
                        borderRadius: 10,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      className="hover:border-[var(--mf-cyan-border)]"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>
                          Chapter {ch.chapterNumber}: {ch.title}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", borderRadius: 4 }}>
                          {ch.status || ch.chapterStatus || "ACTIVE"}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "var(--mf-text-secondary)", marginTop: 4 }}>
                        <div>Mangaka: <strong style={{ color: ch.assigneeName ? "var(--mf-cyan)" : "var(--mf-text-muted)" }}>{ch.assigneeName || "None"}</strong></div>
                        {ch.targetPageCount != null && <div>Target Pages: <strong>{ch.targetPageCount}</strong></div>}
                        {ch.priority && <div>Priority: <strong>{ch.priority}</strong></div>}
                        {ch.startDate && <div>Start Date: <strong>{new Date(ch.startDate).toLocaleDateString()}</strong></div>}
                        {ch.endDate && <div>End Date: <strong>{new Date(ch.endDate).toLocaleDateString()}</strong></div>}
                        {ch.deadline && <div>Deadline: <strong>{new Date(ch.deadline).toLocaleDateString()}</strong></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Chapter Details & Tasks Dialog */}
        <Dialog open={Boolean(selectedChapterDetail)} onOpenChange={(open) => {
          if (!open) {
            setSelectedChapterDetail(null);
            setSelectedTaskDetail(null);
          }
        }}>
          <DialogContent className={`${selectedTaskDetail ? "max-w-4xl" : "max-w-lg"} bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)] max-h-[85vh] overflow-y-auto transition-all duration-200`}>
            <div style={{ display: "flex", gap: 16, width: "100%" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <DialogTitle className="text-lg font-bold text-[var(--mf-text)] border-b border-[var(--mf-border)] pb-3">
                  Ch.{selectedChapterDetail?.chapterNumber}: {selectedChapterDetail?.title}
                </DialogTitle>
                {selectedChapterDetail && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* 2 Tabs Header */}
                    <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--mf-border)", paddingBottom: 8 }}>
                      <button
                        onClick={() => setActiveChapterTab("details")}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          background: activeChapterTab === "details" ? "var(--mf-cyan-dim)" : "transparent",
                          color: activeChapterTab === "details" ? "var(--mf-cyan)" : "var(--mf-text-secondary)",
                        }}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setActiveChapterTab("tasks")}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          background: activeChapterTab === "tasks" ? "var(--mf-cyan-dim)" : "transparent",
                          color: activeChapterTab === "tasks" ? "var(--mf-cyan)" : "var(--mf-text-secondary)",
                        }}
                      >
                        Tasks ({Array.isArray(selectedChapterDetail.tasks) ? selectedChapterDetail.tasks.length : 0})
                      </button>
                    </div>

                    {/* Tab 1: Details */}
                    {activeChapterTab === "details" && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "var(--mf-bg-base)", padding: 12, borderRadius: 10, border: "1px solid var(--mf-border)", fontSize: 13 }}>
                          <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>STATUS</span> <strong>{selectedChapterDetail.status || selectedChapterDetail.chapterStatus || "BACKLOG"}</strong></div>
                          <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>PRIORITY</span> <strong>{selectedChapterDetail.priority || "Medium"}</strong></div>
                          <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>TARGET PAGES</span> <strong>{selectedChapterDetail.targetPageCount ?? "N/A"}</strong></div>
                          <div>
                            <span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>MANGAKA</span>
                            <strong style={{ color: selectedChapterDetail.assigneeName ? "var(--mf-cyan)" : "var(--mf-text-muted)" }}>
                              {selectedChapterDetail.assigneeName || "None"}
                            </strong>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "var(--mf-text-secondary)" }}>
                          {selectedChapterDetail.startDate && <div>Start Date: <strong>{new Date(selectedChapterDetail.startDate).toLocaleDateString()}</strong></div>}
                          {selectedChapterDetail.endDate && <div>End Date: <strong>{new Date(selectedChapterDetail.endDate).toLocaleDateString()}</strong></div>}
                          {selectedChapterDetail.deadline && <div>Deadline: <strong>{new Date(selectedChapterDetail.deadline).toLocaleDateString()}</strong></div>}
                        </div>

                        {/* Mangaka Assignment Dropdown */}
                        <div style={{ borderTop: "1px dashed var(--mf-border)", paddingTop: 14 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-cyan)", display: "block", marginBottom: 6 }}>
                            Assign Responsibility to Mangaka
                          </label>
                          <select
                            disabled={assigningMangaka}
                            value={selectedChapterDetail.assigneeId || ""}
                            onChange={(e) => void handleAssignMangakaToChapter(selectedChapterDetail.id, e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13, cursor: "pointer" }}
                          >
                            <option value="">-- None (Unassigned) --</option>
                            {mangakaList.map((m: any) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName || m.username || m.name || `Mangaka #${m.id}`} (ID: {m.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Tab 2: Tasks */}
                    {activeChapterTab === "tasks" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>Chapter Tasks</span>
                          <button
                            onClick={handleOpenCreateTaskModal}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              background: "var(--mf-cyan)",
                              border: "none",
                              borderRadius: 8,
                              color: "#000",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            <Plus size={14} /> New Task
                          </button>
                        </div>

                        {(!selectedChapterDetail.tasks || selectedChapterDetail.tasks.length === 0) && (
                          <div style={{ padding: 24, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-base)", borderRadius: 8, border: "1px dashed var(--mf-border)" }}>
                            <Inbox size={28} style={{ opacity: 0.4, marginBottom: 6, margin: "0 auto" }} />
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>No tasks created for this chapter yet.</p>
                          </div>
                        )}

                        {selectedChapterDetail.tasks && selectedChapterDetail.tasks.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {selectedChapterDetail.tasks.map((task: any) => (
                              <div
                                key={task.id}
                                onClick={() => {
                                  setSelectedTaskDetail(task);
                                  setActiveTaskDetailTab("detail");
                                  void fetchSubTasksForCurrentTask(task.id);
                                }}
                                style={{
                                  background: selectedTaskDetail?.id === task.id ? "var(--mf-bg-surface)" : "var(--mf-bg-base)",
                                  border: selectedTaskDetail?.id === task.id ? "1px solid var(--mf-cyan)" : "1px solid var(--mf-border)",
                                  borderRadius: 10,
                                  padding: 12,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>{task.title}</span>
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", borderRadius: 4 }}>
                                    {task.productionTaskType || "OUTLINE"} · {task.taskWorkflowStatus || "TODO"}
                                  </span>
                                </div>
                                {task.description && <div style={{ fontSize: 12, color: "var(--mf-text-secondary)" }}>{task.description}</div>}
                                {task.acceptanceCriteria && (
                                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>
                                    Criteria: <strong>{task.acceptanceCriteria}</strong>
                                  </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>
                                  <div>Assignee: <strong style={{ color: "var(--mf-cyan)" }}>{task.assigneeName || "Unassigned"}</strong></div>
                                  {task.deadlineDate && <div>Deadline: <strong>{task.deadlineDate} {task.deadlineTime || ""}</strong></div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        onClick={() => {
                          setSelectedChapterDetail(null);
                          setSelectedTaskDetail(null);
                        }}
                        style={{ padding: "8px 16px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2nd Dialog (Vertical at the right for Task Detail & Sub Task) */}
              {selectedTaskDetail && (
                <div style={{ background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 14, width: 380, padding: 18, display: "flex", flexDirection: "column", gap: 14, maxHeight: "75vh", overflowY: "auto", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Task: {selectedTaskDetail.title}
                    </h3>
                    <button onClick={() => setSelectedTaskDetail(null)} style={{ background: "transparent", border: "none", color: "var(--mf-text-muted)", cursor: "pointer" }}>
                      <X size={16} />
                    </button>
                  </div>

                  {/* 2 Tabs for Task Detail Side Panel */}
                  <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--mf-border)", paddingBottom: 8 }}>
                    <button
                      onClick={() => setActiveTaskDetailTab("detail")}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                        background: activeTaskDetailTab === "detail" ? "var(--mf-cyan-dim)" : "transparent",
                        color: activeTaskDetailTab === "detail" ? "var(--mf-cyan)" : "var(--mf-text-secondary)",
                      }}
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => {
                        setActiveTaskDetailTab("subtask");
                        if (selectedTaskDetail?.id) {
                          void fetchSubTasksForCurrentTask(selectedTaskDetail.id);
                        }
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                        background: activeTaskDetailTab === "subtask" ? "var(--mf-cyan-dim)" : "transparent",
                        color: activeTaskDetailTab === "subtask" ? "var(--mf-cyan)" : "var(--mf-text-secondary)",
                      }}
                    >
                      Sub task ({Array.isArray(selectedTaskDetail.subTasks) ? selectedTaskDetail.subTasks.length : 0})
                    </button>
                  </div>

                  {/* TAB 1: TASK DETAIL */}
                  {activeTaskDetailTab === "detail" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>TASK TITLE</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>{selectedTaskDetail.title}</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>TYPE</span>
                            <span style={{ fontWeight: 800, color: "var(--mf-cyan)" }}>{selectedTaskDetail.productionTaskType || "OUTLINE"}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>STATUS</span>
                            <span style={{ fontWeight: 800, color: "var(--mf-green)" }}>{selectedTaskDetail.taskWorkflowStatus || "TODO"}</span>
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>ASSIGNEE</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-cyan)" }}>{selectedTaskDetail.assigneeName || "Unassigned"}</span>
                        </div>

                        {selectedTaskDetail.description && (
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>DESCRIPTION</span>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--mf-text-secondary)", lineHeight: 1.4 }}>{selectedTaskDetail.description}</p>
                          </div>
                        )}

                        {selectedTaskDetail.acceptanceCriteria && (
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>ACCEPTANCE CRITERIA</span>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--mf-text-secondary)", lineHeight: 1.4 }}>{selectedTaskDetail.acceptanceCriteria}</p>
                          </div>
                        )}

                        {(selectedTaskDetail.deadlineDate || selectedTaskDetail.deadlineTime) && (
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>DEADLINE</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)" }}>{selectedTaskDetail.deadlineDate} {selectedTaskDetail.deadlineTime || ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SUB TASK */}
                  {activeTaskDetailTab === "subtask" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-text)" }}>
                          Subtasks ({Array.isArray(selectedTaskDetail.subTasks) ? selectedTaskDetail.subTasks.length : 0})
                        </span>
                        <button
                          onClick={handleOpenCreateSubTaskModal}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 8px",
                            background: "var(--mf-cyan)",
                            border: "none",
                            borderRadius: 6,
                            color: "#000",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={12} /> New Subtask
                        </button>
                      </div>

                      {loadingSubTasks && (
                        <div style={{ padding: 12, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 11 }}>
                          Loading subtasks...
                        </div>
                      )}

                      {!loadingSubTasks && (!selectedTaskDetail.subTasks || selectedTaskDetail.subTasks.length === 0) ? (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-surface)", borderRadius: 8, border: "1px dashed var(--mf-border)" }}>
                          <Inbox size={24} style={{ opacity: 0.4, marginBottom: 4, margin: "0 auto" }} />
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>No sub tasks found for this task.</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {selectedTaskDetail.subTasks?.map((st: any, idx: number) => (
                            <div key={st.id || idx} style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-text)" }}>{st.title || `Subtask #${st.id || idx + 1}`}</span>
                                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", borderRadius: 4 }}>
                                  {st.subtaskStatus || st.status || "TODO"}
                                </span>
                              </div>
                              {st.description && <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>{st.description}</span>}
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>
                                {st.assigneeName && <div>Assignee: <strong style={{ color: "var(--mf-cyan)" }}>{st.assigneeName}</strong> (ID: {st.assigneeId})</div>}
                                {st.deadlineDate && <div>Deadline: <strong>{st.deadlineDate} {st.deadlineTime || ""}</strong></div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Task Modal */}
        <Dialog open={showCreateTaskDialog} onOpenChange={(open) => !open && setShowCreateTaskDialog(false)}>
          <DialogContent className="max-w-md bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)]">
            <DialogTitle className="text-lg font-bold text-[var(--mf-text)]">
              Create New Task for Chapter #{selectedChapterDetail?.chapterNumber}
            </DialogTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task Title..."
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task details and instructions..."
                  rows={2}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Acceptance Criteria</label>
                <input
                  type="text"
                  value={taskAcceptanceCriteria}
                  onChange={(e) => setTaskAcceptanceCriteria(e.target.value)}
                  placeholder="Criteria for completing the task..."
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                >
                  <option value="OUTLINE">OUTLINE</option>
                  <option value="NAME_WIP">NAME_WIP</option>
                  <option value="LINEART">LINEART</option>
                  <option value="INKING">INKING</option>
                  <option value="BACKGROUND">BACKGROUND</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Deadline Date</label>
                  <input
                    type="date"
                    value={taskDeadlineDate}
                    onChange={(e) => setTaskDeadlineDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Deadline Time</label>
                  <input
                    type="time"
                    value={taskDeadlineTime}
                    onChange={(e) => setTaskDeadlineTime(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setShowCreateTaskDialog(false)}
                  disabled={creatingTask}
                  style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateTaskSubmit()}
                  style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 800, cursor: creatingTask ? "default" : "pointer", opacity: creatingTask ? 0.7 : 1 }}
                >
                  {creatingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create SubTask Dialog */}
        <Dialog open={showCreateSubTaskDialog} onOpenChange={(open) => !open && setShowCreateSubTaskDialog(false)}>
          <DialogContent className="max-w-md bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)]">
            <DialogTitle className="text-lg font-bold text-[var(--mf-text)]">
              Create New Subtask for Task: {selectedTaskDetail?.title}
            </DialogTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Subtask Title *</label>
                <input
                  type="text"
                  value={subTaskTitle}
                  onChange={(e) => setSubTaskTitle(e.target.value)}
                  placeholder="Subtask title (e.g. Draw character lineart)"
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Description</label>
                <textarea
                  value={subTaskDescription}
                  onChange={(e) => setSubTaskDescription(e.target.value)}
                  placeholder="Subtask details..."
                  rows={2}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Production Task Type</label>
                <select
                  value={subTaskType}
                  onChange={(e) => setSubTaskType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                >
                  <option value="OUTLINE">OUTLINE</option>
                  <option value="NAME_WIP">NAME_WIP</option>
                  <option value="LINEART">LINEART</option>
                  <option value="INKING">INKING</option>
                  <option value="BACKGROUND">BACKGROUND</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Assignee (Assistant)</label>
                <select
                  value={subTaskAssigneeId}
                  onChange={(e) => setSubTaskAssigneeId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13, cursor: "pointer" }}
                >
                  <option value="">-- None (Unassigned) --</option>
                  {assistantList.map((acc: any) => {
                    const name = `${acc.firstName || ""} ${acc.lastName || ""}`.trim() || acc.username || acc.email || `User #${acc.id}`;
                    const roleStr = acc.systemRole?.map((r: any) => r.roleName).join(", ") || acc.requestedRole || "ASSISTANT";
                    return (
                      <option key={acc.id} value={acc.id}>
                        {name} ({roleStr}) - ID: {acc.id}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Deadline Date</label>
                  <input
                    type="date"
                    value={subTaskDeadlineDate}
                    onChange={(e) => setSubTaskDeadlineDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Deadline Time</label>
                  <input
                    type="text"
                    value={subTaskDeadlineTime}
                    onChange={(e) => setSubTaskDeadlineTime(e.target.value)}
                    placeholder="e.g. 09:00:00 or 9am"
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setShowCreateSubTaskDialog(false)}
                  disabled={creatingSubTask}
                  style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateSubTaskSubmit()}
                  disabled={creatingSubTask}
                  style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 800, cursor: creatingSubTask ? "default" : "pointer", opacity: creatingSubTask ? 0.7 : 1 }}
                >
                  {creatingSubTask ? "Creating..." : "Create Subtask"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Chapter Form Dialog */}
        <Dialog open={showCreateChapterDialog} onOpenChange={(open) => !open && setShowCreateChapterDialog(false)}>
          <DialogContent className="max-w-md bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)] max-h-[85vh] overflow-y-auto">
            <DialogTitle className="text-lg font-bold text-[var(--mf-text)]">
              Create New Chapter
            </DialogTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Chapter # *</label>
                  <input
                    type="number"
                    min={1}
                    value={chNumber}
                    onChange={(e) => setChNumber(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Title *</label>
                  <input
                    type="text"
                    value={chTitle}
                    onChange={(e) => setChTitle(e.target.value)}
                    placeholder="e.g. The Beginning"
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Chapter Status</label>
                  <select
                    value={chStatus}
                    onChange={(e) => setChStatus(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                  >
                    <option value="BACKLOG">BACKLOG</option>
                    <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="COMPLETED_NEEDS_REVIEW">COMPLETED_NEEDS_REVIEW</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Target Page Count</label>
                  <input
                    type="number"
                    min={1}
                    value={chTargetPageCount}
                    onChange={(e) => setChTargetPageCount(Math.max(1, Number(e.target.value)))}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Priority</label>
                <select
                  value={chPriority}
                  onChange={(e) => setChPriority(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium/Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {selectedPlanForChapters && (selectedPlanForChapters.startDate || selectedPlanForChapters.endDate) && (
                <div style={{ fontSize: 11, color: "var(--mf-cyan)", background: "var(--mf-cyan-dim)", padding: 8, borderRadius: 6 }}>
                  Plan range: {selectedPlanForChapters.startDate ? selectedPlanForChapters.startDate.slice(0, 10) : "N/A"} to {selectedPlanForChapters.endDate ? selectedPlanForChapters.endDate.slice(0, 10) : "N/A"}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    value={chStartDate}
                    min={selectedPlanForChapters?.startDate ? selectedPlanForChapters.startDate.slice(0, 10) : undefined}
                    max={selectedPlanForChapters?.publishDate || selectedPlanForChapters?.endDate ? (selectedPlanForChapters.publishDate || selectedPlanForChapters.endDate)!.slice(0, 10) : undefined}
                    onChange={(e) => setChStartDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>End Date</label>
                  <input
                    type="date"
                    value={chEndDate}
                    min={selectedPlanForChapters?.startDate ? selectedPlanForChapters.startDate.slice(0, 10) : undefined}
                    max={selectedPlanForChapters?.publishDate || selectedPlanForChapters?.endDate ? (selectedPlanForChapters.publishDate || selectedPlanForChapters.endDate)!.slice(0, 10) : undefined}
                    onChange={(e) => setChEndDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Publish Date</label>
                  <input
                    type="date"
                    value={chPublishDate}
                    min={selectedPlanForChapters?.startDate ? selectedPlanForChapters.startDate.slice(0, 10) : undefined}
                    max={selectedPlanForChapters?.publishDate || selectedPlanForChapters?.endDate ? (selectedPlanForChapters.publishDate || selectedPlanForChapters.endDate)!.slice(0, 10) : undefined}
                    onChange={(e) => setChPublishDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Deadline</label>
                  <input
                    type="date"
                    value={chDeadline}
                    min={selectedPlanForChapters?.startDate ? selectedPlanForChapters.startDate.slice(0, 10) : undefined}
                    max={selectedPlanForChapters?.publishDate || selectedPlanForChapters?.endDate ? (selectedPlanForChapters.publishDate || selectedPlanForChapters.endDate)!.slice(0, 10) : undefined}
                    onChange={(e) => setChDeadline(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-cyan-border)", borderRadius: 8, color: "#fff", colorScheme: "dark", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setShowCreateChapterDialog(false)}
                  disabled={creatingChapter}
                  style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateChapterSubmit()}
                  disabled={creatingChapter}
                  style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 800, cursor: creatingChapter ? "default" : "pointer", opacity: creatingChapter ? 0.7 : 1 }}
                >
                  {creatingChapter ? "Creating..." : "Create Chapter"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Extend Timeline Plan Modal */}
        {extendingTimelinePlan && (
          <ExtendTimelineDialog
            planId={extendingTimelinePlan.id}
            currentEndDate={extendingTimelinePlan.endDate}
            currentPublishDate={extendingTimelinePlan.publishDate}
            onClose={() => setExtendingTimelinePlan(null)}
            onSuccess={() => {
              setExtendingTimelinePlan(null);
              if (extendingTimelinePlan.projectId) {
                handleFetchPlans(extendingTimelinePlan.projectId);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }} className="editor-minimal-scrollbar">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--mf-text)" }}>Assigned Projects</h2>
          <p style={{ fontSize: 12, color: "var(--mf-text-muted)", margin: "4px 0 0" }}>Projects currently assigned to you as Tantou editor</p>
        </div>
        <button
          onClick={() => void fetchAssignedProjects()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", fontSize: 12, fontWeight: 800, cursor: loading ? "default" : "pointer", opacity: loading ? 0.65 : 1 }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Loader2 size={18} style={{ animation: "editor-spin 1s linear infinite" }} />
          Loading assigned projects...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: 24, background: "rgba(255,42,122,0.1)", border: "1px solid rgba(255,42,122,0.3)", borderRadius: 12, color: "var(--mf-red)", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{error}</span>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px dashed var(--mf-border)" }}>
          <Inbox size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>No projects assigned to you yet.</p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {projects.map((project) => {
            const renderField = (label: string, value: any) => {
              if (value === null || value === undefined || value === "") return null;
              let displayValue = String(value);
              if (typeof value === "string" && !isNaN(Date.parse(value)) && (label.toLowerCase().includes("date") || label.toLowerCase().includes("at"))) {
                displayValue = new Date(value).toLocaleString();
              }
              return (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "var(--mf-text-muted)", fontWeight: 600 }}>{label}:</span>
                  <span style={{ color: "var(--mf-text)", fontWeight: 700, textAlign: "right" }}>{displayValue}</span>
                </div>
              );
            };

            return (
              <div
                key={project.id}
                onClick={() => handleOpenDetail(project)}
                style={{
                  background: "var(--mf-bg-surface)",
                  border: "1px solid var(--mf-border)",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  transition: "border-color 0.2s, transform 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--mf-cyan)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--mf-border)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--mf-border)", paddingBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Project #{project.id}</span>
                    <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "var(--mf-text)" }}>{project.title || `Project #${project.id}`}</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {project.projectWorkflowStatus && (
                      <span style={{ padding: "3px 8px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", borderRadius: 6, fontSize: 10, fontWeight: 800, border: "1px solid var(--mf-cyan-border)" }}>
                        {project.projectWorkflowStatus}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleOpenEdit(e, project)}
                      title="Edit project details"
                      style={{
                        background: "rgba(0,210,255,0.1)",
                        border: "1px solid rgba(0,210,255,0.3)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        color: "var(--mf-cyan)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <EditIcon size={12} /> Edit
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {renderField("Format", project.format)}
                  {renderField("Genre", project.genre)}
                  {renderField("Target Audience", project.targetAudience)}
                  {renderField("Current Phase", project.currentPhase)}
                  {renderField("Status", project.status)}
                  {renderField("Tantou Editor", project.tantouName)}
                  {renderField("Mangaka", project.mangakaName)}
                  {renderField("Owner", project.ownerName)}
                  {renderField("Start Date", project.startDate)}
                  {renderField("Expected End Date", project.expectedEndDate)}
                  {renderField("Created At", project.createdAt)}
                  {renderField("Description", project.description)}
                </div>

                <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--mf-border)", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--mf-cyan)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <EyeIcon size={12} /> Click to view details
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Details Modal */}
      <Dialog open={Boolean(detailProject)} onOpenChange={(open) => !open && setDetailProject(null)}>
        <DialogContent className="max-w-2xl bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)] max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold text-[var(--mf-text)] flex items-center justify-between border-b border-[var(--mf-border)] pb-3">
            <span>Project Details: {detailProject?.title || `Project`}</span>
          </DialogTitle>

          {detailProject && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--mf-bg-base)", padding: 12, borderRadius: 8, border: "1px solid var(--mf-border)" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{detailProject.title}</div>
                </div>
                <button
                  onClick={() => {
                    const prj = detailProject;
                    setDetailProject(null);
                    void handleOpenPlansPage(prj);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: "var(--mf-cyan)",
                    border: "none",
                    borderRadius: 8,
                    color: "#000",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <ListChecks size={15} /> Open Production Plans Page
                </button>
              </div>

              {/* Detail fields list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--mf-bg-base)", padding: 16, borderRadius: 8, border: "1px solid var(--mf-border)" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "var(--mf-cyan)" }}>Project Specifications</h4>
                {[
                  ["Title", detailProject.title],
                  ["Format", detailProject.format],
                  ["Genre", detailProject.genre],
                  ["Target Audience", detailProject.targetAudience],
                  ["Current Phase", detailProject.currentPhase],
                  ["Workflow Status", detailProject.projectWorkflowStatus],
                  ["Status", detailProject.status],
                  ["Tantou Editor", detailProject.tantouName],
                  ["Mangaka", detailProject.mangakaName],
                  ["Owner", detailProject.ownerName],
                  ["Start Date", detailProject.startDate ? new Date(detailProject.startDate).toLocaleString() : null],
                  ["Expected End Date", detailProject.expectedEndDate ? new Date(detailProject.expectedEndDate).toLocaleString() : null],
                  ["Created At", detailProject.createdAt ? new Date(detailProject.createdAt).toLocaleString() : null],
                  ["Description", detailProject.description],
                ].map(([label, value]) => {
                  if (value === null || value === undefined || value === "") return null;
                  return (
                    <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "var(--mf-text-muted)", fontWeight: 600 }}>{label}:</span>
                      <span style={{ color: "var(--mf-text)", fontWeight: 700, textAlign: "right" }}>{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={Boolean(editingProject)} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="max-w-md bg-[var(--mf-bg-surface)] text-[var(--mf-text)] border-[var(--mf-border)]">
          <DialogTitle className="text-lg font-bold text-[var(--mf-text)]">
            Update Project Details ({editingProject?.title || `#${editingProject?.id}`})
          </DialogTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Genre</label>
              <input
                type="text"
                value={editGenre}
                onChange={(e) => setEditGenre(e.target.value)}
                placeholder="e.g. comedy, action"
                style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Target Audience</label>
              <input
                type="text"
                value={editTargetAudience}
                onChange={(e) => setEditTargetAudience(e.target.value)}
                placeholder="e.g. kids, shonen, seinen"
                style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", display: "block", marginBottom: 4 }}>Format</label>
              <select
                value={editFormat}
                onChange={(e) => setEditFormat(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }}
              >
                <option value="WEBTOON">WEBTOON</option>
                <option value="WEEKLY_SHONEN">WEEKLY_SHONEN</option>
                <option value="MONTHLY_SEINEN">MONTHLY_SEINEN</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setEditingProject(null)}
                disabled={updating}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveEdit()}
                disabled={updating}
                style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 800, cursor: updating ? "default" : "pointer", opacity: updating ? 0.7 : 1 }}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  pending_tantou_review: { label: "Pending Tantou Review", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  in_revision: { label: "In Revision", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  revision: { label: "In Revision", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  pending_board_review: { label: "Voting In Progress", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
  on_going: { label: "Pending to Board", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
  approved: { label: "Approved by Board", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
  rejected: { label: "Rejected", color: "var(--mf-red)", bg: "rgba(255,42,122,0.14)" },
};

function normalizeStatus(status?: string | null): string {
  return (status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
}

function statusLabel(status?: string | null): string {
  const normalized = normalizeStatus(status);
  return statusConfig[normalized]?.label || status || "N/A";
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = normalizeStatus(status);
  const s = statusConfig[normalized] || statusConfig.pending;
  return (
    <span style={{ padding: "3px 10px", background: s.bg, color: s.color, fontSize: 10, fontWeight: 800, borderRadius: 100, letterSpacing: "0.06em", border: `1px solid ${s.color}35`, whiteSpace: "nowrap" }}>
      {statusLabel(status)}
    </span>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function displayText(value?: string | number | null, empty = "Not provided"): string {
  if (value === null || value === undefined || value === "") return empty;
  return String(value);
}

type AuthorLookupState = {
  names: Record<number, { name: string; email?: string | null }>;
  loadingIds: Set<number>;
  failedIds: Set<number>;
  detailBySubmissionId: Record<number, SubmissionApi>;
  loadingDetailIds: Set<number>;
  failedDetailIds: Set<number>;
};

function accountDisplayName(account?: AccountSummaryApi | AccountProfile | null): string | null {
  if (!account) return null;
  const fullName = `${account.firstName || ""} ${account.lastName || ""}`.trim();
  if ("name" in account && account.name) return account.name;
  if (fullName) return fullName;
  if ("username" in account && account.username) return account.username;
  return account.email || null;
}

function nestedAuthorAccounts(submission: any): Array<AccountSummaryApi | null | undefined> {
  return [
    submission.submittedBy && typeof submission.submittedBy === "object" ? submission.submittedBy : null,
    submission.account && typeof submission.account === "object" ? submission.account : null,
    submission.createdBy && typeof submission.createdBy === "object" ? submission.createdBy : null,
    submission.mangaka && typeof submission.mangaka === "object" ? submission.mangaka : null,
  ];
}

function submissionForAuthorResolution(submission: SubmissionApi, lookup?: AuthorLookupState): SubmissionApi {
  const detail = lookup?.detailBySubmissionId[submission.id];
  return detail ? { ...submission, ...detail } : submission;
}

function nestedAuthorAccount(submission: SubmissionApi): AccountSummaryApi | null {
  return nestedAuthorAccounts(submission).find((account) => Boolean(account && accountDisplayName(account))) || null;
}

function extractId(val: any): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string" && !isNaN(Number(val))) return Number(val);
  return null;
}

function authorId(submission: any): number | null {
  const nestedId = nestedAuthorAccounts(submission).find((account) => typeof account?.id === "number")?.id;
  return nestedId
    ?? extractId(submission.submittedBy)
    ?? extractId(submission.submitted_by)
    ?? extractId(submission.account)
    ?? extractId(submission.createdBy)
    ?? extractId(submission.created_by)
    ?? extractId(submission.mangaka)
    ?? extractId(submission.submittedById)
    ?? extractId(submission.accountId)
    ?? extractId(submission.createdById)
    ?? extractId(submission.mangakaId)
    ?? null;
}

function needsAuthorLookup(submission: SubmissionApi): boolean {
  return !nestedAuthorAccount(submission) && Boolean(authorId(submission));
}

function hasNoAuthorData(submission: SubmissionApi): boolean {
  return !nestedAuthorAccount(submission) && !authorId(submission);
}

function needsSubmissionDetailLookup(submission: SubmissionApi): boolean {
  return hasNoAuthorData(submission);
}

function submitterName(submission: SubmissionApi, lookup: AuthorLookupState): string {
  if (submission.submittedByName && submission.submittedByName !== "null null" && submission.submittedByName.trim() !== "") {
    return submission.submittedByName;
  }
  if (submission.submittedBy) {
    const nameStr = [submission.submittedBy.firstName, submission.submittedBy.lastName].filter(Boolean).join(" ").trim();
    if (nameStr && nameStr !== "null null") return nameStr;
    if (submission.submittedBy.email) return submission.submittedBy.email;
    if (submission.submittedBy.username) return submission.submittedBy.username;
    if (submission.submittedBy.name) return submission.submittedBy.name;
  }
  // If the backend injects an unmapped field, try to find it (as a last resort)
  const anySub = submission as any;
  if (anySub.mangakaName) return anySub.mangakaName;
  if (anySub.authorName) return anySub.authorName;
  if (anySub.creatorName) return anySub.creatorName;

  const resolvedSubmission = submissionForAuthorResolution(submission, lookup);
  const nested = nestedAuthorAccount(resolvedSubmission);
  const nestedName = accountDisplayName(nested);
  if (nestedName) return nestedName;

  if (lookup.loadingDetailIds.has(submission.id)) return "Loading author...";

  const id = authorId(resolvedSubmission);
  if (!id) {
    const keys = Object.keys(submission).filter(k => submission[k as keyof SubmissionApi] != null);
    return "N/A (keys: " + keys.join(", ") + ")";
  }
  if (lookup.names[id]?.name) return lookup.names[id].name;
  if (lookup.loadingIds.has(id)) return "Loading author...";
  if (lookup.failedIds.has(id)) return `Mangaka #${id}`;
  return `Mangaka #${id}`;
}

function formatBytes(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function fileName(file: SubmissionFileApi): string {
  return displayText(file.originalName || file.originalFilename || file.fileName || file.filename, "N/A");
}

function filePath(file: SubmissionFileApi): string | null {
  return file.url || file.fileUrl || file.path || file.filePath || null;
}

function fileSize(file: SubmissionFileApi): number | null | undefined {
  return file.size ?? file.fileSize;
}

function fileContentType(file: SubmissionFileApi): string {
  return displayText(file.contentType || file.mimeType, "N/A");
}

function hasValue(value?: string | number | null): boolean {
  return value !== null && value !== undefined && value !== "";
}

function isBrowserUrl(value: string): boolean {
  return /^(https?:\/\/|data:image\/|blob:|\/)/i.test(value);
}

function isPsdFile(file: SubmissionFileApi): boolean {
  const contentType = (file.contentType || file.mimeType || "").toLowerCase();
  const name = fileName(file).toLowerCase();
  return contentType.includes("photoshop") || contentType.includes("psd") || contentType.includes("vnd.adobe.photoshop") || name.endsWith(".psd");
}

function isImageFile(file: SubmissionFileApi): boolean {
  if (isPsdFile(file)) return false;
  const contentType = (file.contentType || file.mimeType || "").toLowerCase();
  const path = filePath(file) || fileName(file);
  const supportedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
  return supportedImageTypes.includes(contentType) || /\.(png|jpe?g|gif|webp|svg)$/i.test(path);
}

function hasPlanningData(submission: SubmissionApi): boolean {
  const planning = submission.planning;
  return Boolean(planning && (
    hasValue(planning.id)
    || hasValue(planning.title)
    || hasValue(planning.name)
    || hasValue(planning.status)
    || hasValue(planning.startDate)
    || hasValue(planning.endDate)
  ));
}

function hasProjectData(submission: SubmissionApi): boolean {
  const project = submission.project;
  return Boolean(project && (
    hasValue(project.id)
    || hasValue(project.title)
    || hasValue(project.name)
    || hasValue(project.status)
    || hasValue(project.description)
  ));
}

function FieldRow({ label, value, badge }: { label: string; value?: string | number | null | undefined; badge?: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--mf-bg-deep)", borderRadius: 8, border: "1px solid var(--mf-border)" }}>
      <div style={{ fontSize: 10, color: "var(--mf-text-muted)", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.45, wordBreak: "break-word" }}>
        {badge ? badge : displayText(value, "N/A")}
      </div>
    </div>
  );
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 20, padding: 20, background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", ...style }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 4, height: 14, background: "var(--mf-cyan)", borderRadius: 2 }} />
        {title}
      </div>
      {children}
    </div>
  );
}

function filterSubmissions(submissions: SubmissionApi[], filter: string): SubmissionApi[] {
  return submissions.filter((submission) => {
    const status = normalizeStatus(submission.status);
    if (filter === "New Proposals") return status === "pending" || status === "pending_tantou_review" || status === "submitted";
    if (filter === "In Revision") return status === "revision" || status === "in_revision";
    if (filter === "Escalated to Board") return status === "pending_board_review" || status === "on_going" || status === "rejected";
    if (filter === "Approved") return status === "approved";
    return true;
  });
}

function boardVotingActionLabel(status?: string | null): string {
  switch (normalizeStatus(status)) {
    case "pending_board_review": return "Board Voting";
    case "on_going": return "Submit to Board";
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    default: return "Start Board Voting";
  }
}

function proposalActionLabel(status?: string | null, filter?: string): string {
  const normalized = normalizeStatus(status);
  if (filter === "Escalated to Board") return boardVotingActionLabel(status);
  if (["pending", "pending_tantou_review", "submitted"].includes(normalized)) return "Approve";
  return statusLabel(status);
}

function FileCard({ file }: { file: SubmissionFileApi }) {
  const path = filePath(file);
  const canOpen = Boolean(path && isBrowserUrl(path));
  const canPreview = Boolean(path && canOpen && isImageFile(file));
  const isPsd = isPsdFile(file);
  const isPdf = fileContentType(file).toLowerCase().includes("pdf") || fileName(file).toLowerCase().endsWith(".pdf");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewOpen || !path) {
      if (objectUrl && objectUrl.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
      setFetchError(null);
      return;
    }

    // Strip backend origin to use Vite proxy and bypass CORS
    const fetchPath = path.replace(/https?:\/\/[^\/]+(\/uploads\/)/, "$1");

    let active = true;
    const loadBlob = async () => {
      setLoadingPreview(true);
      setFetchError(null);
      try {
        const token = tokenStorage.getToken();
        const res = await fetch(fetchPath, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const blob = await res.blob();

        const displayBlob = (isPdf && blob.type !== "application/pdf")
          ? new Blob([blob], { type: "application/pdf" })
          : blob;

        const url = URL.createObjectURL(displayBlob);
        if (active) setObjectUrl(url);
      } catch (err) {
        if (active) {
          console.error("Preview fetch error", err);
          setFetchError(err instanceof Error ? err.message : String(err));
          setObjectUrl(path);
        }
      } finally {
        if (active) setLoadingPreview(false);
      }
    };

    if (path.startsWith("http") || path.startsWith("/")) {
      loadBlob();
    } else {
      setObjectUrl(path);
    }

    return () => { active = false; };
  }, [previewOpen, path, isPdf]);

  return (
    <>
      <div
        onClick={() => { if (canOpen && !isPsd) setPreviewOpen(true); }}
        style={{ background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s", cursor: (canOpen && !isPsd) ? "pointer" : "default" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
        <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--mf-bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          {canPreview ? (
            <img src={path || ""} alt={fileName(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <FileText size={40} color="var(--mf-text-muted)" />
          )}
          {canOpen && (
            <a href={path || undefined} target="_blank" rel="noreferrer" title="Open in new tab" onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{fileName(file)}</div>
          <div style={{ fontSize: 11, color: "var(--mf-text-muted)", fontWeight: 700 }}>{formatBytes(fileSize(file))} • {fileContentType(file).split("/").pop()?.toUpperCase()}</div>
          {isPsd && <div style={{ fontSize: 10, color: "var(--mf-magenta)", fontWeight: 800, marginTop: 4 }}>NO PREVIEW</div>}
        </div>
      </div>

      {previewOpen && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent style={{ maxWidth: "90vw", height: "90vh", padding: 0, overflow: "hidden", backgroundColor: "#0a0a0a", borderColor: "#222" }}>
            <DialogTitle className="sr-only">Preview {fileName(file)}</DialogTitle>
            {loadingPreview ? (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>
                <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : isPdf ? (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
                {fetchError && (
                  <div style={{ padding: 10, background: "#fff3f3", color: "#d32f2f", fontSize: 12, borderBottom: "1px solid #ffcdd2" }}>
                    Warning: Failed to load file securely ({fetchError}). The preview below might be empty or blocked by the browser.
                    <a href={path || ""} target="_blank" rel="noreferrer" style={{ marginLeft: 8, textDecoration: "underline", fontWeight: "bold" }}>Open File Manually</a>
                  </div>
                )}
                <object data={objectUrl || ""} type="application/pdf" style={{ width: "100%", flex: 1, border: "none" }}>
                  <embed src={objectUrl || ""} type="application/pdf" style={{ width: "100%", height: "100%", border: "none" }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 20 }}>
                    <p style={{ color: "#000", marginBottom: 12 }}>Trình duyệt của bạn không hỗ trợ hiển thị PDF trực tiếp.</p>
                    <a href={path || ""} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", background: "var(--mf-cyan)", color: "#000", borderRadius: 8, textDecoration: "none", fontWeight: 800 }}>Tải xuống / Mở trong Tab mới</a>
                  </div>
                </object>
              </div>
            ) : canPreview ? (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <img src={objectUrl || ""} alt={fileName(file)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>Preview not available for this file type.</div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ProposalFeed({
  filter,
  submissions,
  escalatingId,
  error,
  authorLookup,
  onTantouEscalate,
  onStartBoardVoting,
  onReview,
}: {
  filter: string;
  submissions: SubmissionApi[];
  escalatingId: number | null;
  error: string | null;
  authorLookup: AuthorLookupState;
  onTantouEscalate: (submission: SubmissionApi) => void;
  onStartBoardVoting: (submission: SubmissionApi) => void;
  onReview?: (submission: SubmissionApi) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const filtered = useMemo(() => filterSubmissions(submissions, filter), [filter, submissions]);
  const selectedSubmission = filtered.find((submission) => submission.id === selected) || filtered[0];
  const effectiveSelected = selectedSubmission?.id ?? null;

  if (filtered.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-text-muted)" }}>
        <Inbox size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>No submissions found</p>
      </div>
    );
  }

  const selectedStatus = normalizeStatus(selectedSubmission?.status);
  const canTantouEscalate = filter === "New Proposals" && ["pending", "pending_tantou_review", "submitted"].includes(selectedStatus);
  const canSubmitToBoard = filter === "Escalated to Board" && selectedStatus === "on_going";
  const canRunPrimaryAction = canTantouEscalate || canSubmitToBoard;
  const resolvedSelectedSubmission = selectedSubmission ? submissionForAuthorResolution(selectedSubmission, authorLookup) : selectedSubmission;
  const files = resolvedSelectedSubmission?.files || [];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ width: 350, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900 }}>{filter}</h2>
            <p style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ padding: "4px 10px", background: "var(--mf-cyan-dim)", border: "1px solid var(--mf-cyan)35", borderRadius: 7, fontSize: 10, color: "var(--mf-cyan)", fontWeight: 800, flexShrink: 0, lineHeight: 1 }}>{filtered.length}</div>
        </div>
        <div className="editor-minimal-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {filtered.map((submission) => (
            <button
              key={submission.id}
              onClick={() => setSelected(submission.id)}
              style={{ display: "block", width: "100%", padding: "12px 13px", marginBottom: 7, background: effectiveSelected === submission.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)", border: `1px solid ${effectiveSelected === submission.id ? "var(--mf-cyan)35" : "var(--mf-border)"}`, borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", lineHeight: 1.3, flex: 1 }}>{displayText(submission.title, "Untitled Submission")}</span>
                <StatusBadge status={submission.status} />
              </div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 7, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <User size={10} /><span>{submitterName(submission, authorLookup)}</span><span style={{ opacity: 0.4 }}>·</span><Clock size={10} /><span>{formatDateTime(submission.submittedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSubmission && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <div className="editor-minimal-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "30px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
            {error && (
              <div style={{ padding: 14, background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", borderRadius: 10, color: "var(--mf-magenta)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            {/* Header Block */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <StatusBadge status={selectedSubmission.status} />
                  <span style={{ fontSize: 11, color: "var(--mf-text-muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {normalizeStatus(selectedSubmission.status) === "pending" || normalizeStatus(selectedSubmission.status) === "pending_tantou_review" ? "Awaiting your review" : "In Progress"}
                  </span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: "var(--mf-text)" }}>{displayText(selectedSubmission.title, "Untitled Submission")}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, fontSize: 12, color: "var(--mf-text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} />{formatDateTime(selectedSubmission.submittedAt)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={14} />{submitterName(selectedSubmission, authorLookup)}</span>
                </div>
              </div>
            </div>

            {/* SYNOPSIS */}
            <Section title="SYNOPSIS" style={{ background: "var(--mf-bg-deep)" }}>
              <div style={{ fontSize: 14, color: "var(--mf-text-secondary)", lineHeight: 1.6, wordBreak: "break-word" }}>
                {selectedSubmission.contentUrl || selectedSubmission.description || selectedSubmission.note || (
                  <span style={{ color: "var(--mf-text-muted)" }}>No synopsis provided.</span>
                )}
              </div>
              {selectedSubmission.contentUrl && isBrowserUrl(selectedSubmission.contentUrl) && (
                <a href={selectedSubmission.contentUrl} target="_blank" rel="noreferrer" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(0, 230, 230, 0.1)", borderRadius: 8, color: "var(--mf-cyan)", fontSize: 12, fontWeight: 800, textDecoration: "none", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(0, 230, 230, 0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(0, 230, 230, 0.1)"}>
                  <Link2 size={14} /> Open attached link
                </a>
              )}
            </Section>

            {/* METADATA */}
            {(hasPlanningData(resolvedSelectedSubmission || selectedSubmission) || hasProjectData(resolvedSelectedSubmission || selectedSubmission)) && (
              <Section title="METADATA">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {hasProjectData(resolvedSelectedSubmission || selectedSubmission) && (
                    <>
                      <FieldRow label="PROJECT" value={resolvedSelectedSubmission?.project?.title || resolvedSelectedSubmission?.project?.name || selectedSubmission.project?.title || "N/A"} />
                      <FieldRow label="PROJECT STATUS" value={resolvedSelectedSubmission?.project?.status || selectedSubmission.project?.status || "N/A"} />
                    </>
                  )}
                  {hasPlanningData(resolvedSelectedSubmission || selectedSubmission) && (
                    <>
                      <FieldRow label="PLANNING" value={resolvedSelectedSubmission?.planning?.title || resolvedSelectedSubmission?.planning?.name || selectedSubmission.planning?.title || "N/A"} />
                      <FieldRow label="DEADLINE" value={formatDateTime(resolvedSelectedSubmission?.planning?.endDate || selectedSubmission.planning?.endDate)} />
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* UPLOADED FILES */}
            <Section title={`UPLOADED FILES (${files.length})`}>
              {files.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mf-text-muted)", fontSize: 13, padding: 10 }}>
                  <Image size={15} /> No uploaded files found.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                  {files.map((file, index) => <FileCard key={file.id ?? `${fileName(file)}-${index}`} file={file} />)}
                </div>
              )}
            </Section>
          </div>

          {/* Sticky Action Bar */}
          <div style={{ position: "sticky", bottom: 0, padding: "16px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(10, 10, 10, 0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 12, zIndex: 10 }}>
            <button
              onClick={() => canTantouEscalate ? onTantouEscalate(selectedSubmission) : onStartBoardVoting(selectedSubmission)}
              disabled={!canRunPrimaryAction || escalatingId === selectedSubmission.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: canRunPrimaryAction ? "linear-gradient(135deg, var(--mf-cyan), #0099ff)" : "var(--mf-bg-surface)", border: canRunPrimaryAction ? "none" : "1px solid var(--mf-border)", borderRadius: 100, color: canRunPrimaryAction ? "#000" : "var(--mf-text-muted)", fontSize: 14, fontWeight: 900, cursor: canRunPrimaryAction && escalatingId !== selectedSubmission.id ? "pointer" : "not-allowed", boxShadow: canRunPrimaryAction ? "0 4px 16px rgba(0,230,230,0.3)" : "none", opacity: escalatingId === selectedSubmission.id ? 0.75 : 1, transition: "transform 0.1s" }}
              onMouseDown={e => { if (canRunPrimaryAction && e.currentTarget) e.currentTarget.style.transform = "scale(0.97)" }}
              onMouseUp={e => { if (canRunPrimaryAction && e.currentTarget) e.currentTarget.style.transform = "none" }}
              onMouseLeave={e => { if (canRunPrimaryAction && e.currentTarget) e.currentTarget.style.transform = "none" }}
            >
              {escalatingId === selectedSubmission.id ? <><Loader2 size={15} /> {canTantouEscalate ? "Escalating..." : "Starting voting..."}</> : canRunPrimaryAction ? <><ArrowUpRight size={15} /> {proposalActionLabel(selectedSubmission.status, filter)}</> : <><CheckCircle size={15} /> {proposalActionLabel(selectedSubmission.status, filter)}</>}
            </button>
            {onReview && (
              <button
                onClick={() => onReview(selectedSubmission)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "transparent", border: "1px solid rgba(255, 128, 0, 0.5)", borderRadius: 100, color: "var(--mf-orange)", fontSize: 14, fontWeight: 800, cursor: "pointer", opacity: 0.9 }}
              >
                <RotateCcw size={15} /> Review & Revise
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approved List (accordion) ─────────────────────────────────────────────────

function ApprovedList({
  submissions,
  onRefresh,
}: {
  submissions: SubmissionApi[];
  onRefresh: () => void;
}) {
  const approved = useMemo(
    () => submissions.filter((s) => normalizeStatus(s.status) === "approved"),
    [submissions],
  );
  const [openId, setOpenId] = useState<number | null>(null);
  const [escalatingId, setEscalatingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string; ok: boolean } | null>(null);

  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [user, setUser] = useState<AccountProfile | null>(null);
  const [planProjectId, setPlanProjectId] = useState<number | null>(null);

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
    const account = tokenStorage.getAccount();
    if (account?.id) {
      getAccountProfile(account.id).then(setUser).catch(console.error);
    }
  }, [submissions]);

  function showToast(text: string, ok: boolean) {
    const id = Date.now();
    setToastMsg({ id, text, ok });
    window.setTimeout(() => setToastMsg((t) => (t?.id === id ? null : t)), 4000);
  }

  async function handleEscalate(submission: SubmissionApi) {
    const tantouId = tokenStorage.getAccount()?.id;
    if (!tantouId) {
      showToast("Cannot escalate: Tantou account ID not found in session.", false);
      return;
    }
    setEscalatingId(submission.id);
    try {
      await submitToBoard(submission.id, tantouId);
      showToast(`"${submission.title || "Untitled Submission"}" submitted to Editorial Board successfully!`, true);
      setOpenId(null);
      onRefresh();
    } catch (err) {
      const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to submit to board.";
      showToast(msg, false);
    } finally {
      setEscalatingId(null);
    }
  }

  if (approved.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-text-muted)" }}>
        <CheckCircle size={40} style={{ opacity: 0.25 }} />
        <p style={{ fontSize: 14 }}>No approved submissions</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Toast notification */}
      {toastMsg && (
        <div
          key={toastMsg.id}
          style={{
            position: "fixed", top: 24, right: 24, zIndex: 99999,
            padding: "14px 20px",
            background: toastMsg.ok ? "rgba(0,230,180,0.12)" : "rgba(255,42,122,0.12)",
            border: `1px solid ${toastMsg.ok ? "rgba(0,230,180,0.4)" : "rgba(255,42,122,0.4)"}`,
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            color: toastMsg.ok ? "var(--mf-green)" : "var(--mf-magenta)",
            fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 10,
            maxWidth: 420,
            animation: "approved-toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {toastMsg.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toastMsg.text}
        </div>
      )}

      <style>{`
        @keyframes approved-toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes approved-dropdown-open {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .approved-row-btn:hover .approved-row-title { color: var(--mf-cyan) !important; }
      `}</style>

      <div className="editor-minimal-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Count header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.01em", margin: 0 }}>Approved</h2>
          <span style={{ padding: "3px 10px", background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)35", borderRadius: 100, fontSize: 11, fontWeight: 800, color: "var(--mf-magenta)" }}>
            {approved.length}
          </span>
        </div>

        {approved.map((s) => {
          const isOpen = openId === s.id;
          const isEscalating = escalatingId === s.id;
          const files = s.files || [];

          const relatedProject = s.project?.id ? projects.find(p => p.id === s.project!.id) : projects.find(p => p.title === s.title);
          const currentUserId = user?.id || tokenStorage.getAccount()?.id;

          let assignedTantouId = relatedProject?.tantou?.id;
          if (!assignedTantouId && relatedProject) {
            try {
              const rawCache = window.localStorage.getItem("board_project_tantou_assignments");
              if (rawCache) {
                const parsed = JSON.parse(rawCache);
                if (parsed[relatedProject.id]?.tantouId) {
                  assignedTantouId = parsed[relatedProject.id].tantouId;
                }
              }
            } catch (err) { }
          }

          const isAssignedToMe = Boolean(assignedTantouId && currentUserId && assignedTantouId === currentUserId);

          return (
            <div
              key={s.id}
              style={{
                background: isOpen ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)",
                border: `1px solid ${isOpen ? "var(--mf-magenta)40" : "var(--mf-border)"}`,
                borderRadius: 16,
                transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.25)" : "none",
              }}
            >
              {/* Row header — clickable */}
              <button
                className="approved-row-btn"
                onClick={() => setOpenId(isOpen ? null : s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  width: "100%", padding: "18px 22px",
                  background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {/* Chevron */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isOpen ? "var(--mf-magenta-dim)" : "var(--mf-bg-deep)",
                  border: `1px solid ${isOpen ? "var(--mf-magenta)40" : "var(--mf-border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  <ChevronDown
                    size={14}
                    color={isOpen ? "var(--mf-magenta)" : "var(--mf-text-muted)"}
                    style={{ transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>

                {/* Title + badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="approved-row-title"
                    style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)", transition: "color 0.15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {displayText(s.title, "Untitled Submission")}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={10} /> {s.submittedByName || s.submittedBy?.email || s.submittedBy?.username || "Unknown"}
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} /> {formatDateTime(s.submittedAt)}
                    </span>
                  </div>
                </div>

                {/* Right-side badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {files.length > 0 && (
                    <span style={{ padding: "3px 9px", background: "var(--mf-bg-deep)", border: "1px solid var(--mf-border)", borderRadius: 100, fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)" }}>
                      {files.length} file{files.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <StatusBadge status={s.status} />
                </div>
              </button>

              {/* Dropdown detail */}
              {isOpen && (
                <div style={{
                  borderTop: "1px solid var(--mf-border)",
                  padding: "20px 24px",
                  animation: "approved-dropdown-open 0.22s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>

                    {/* LEFT — Text info & button */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Submitted By */}
                      <div style={{ padding: "10px 12px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 3 }}>SUBMITTED BY</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)", display: "flex", alignItems: "center", gap: 5 }}>
                          <User size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.submittedByName || s.submittedBy?.email || s.submittedBy?.username || "Unknown"}
                          </span>
                        </div>
                      </div>
                      {/* Date + Status */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 8 }}>
                        <div style={{ padding: "10px 12px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 3 }}>DATE</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={10} style={{ flexShrink: 0, opacity: 0.6 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {formatDateTime(s.submittedAt)}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: "10px 12px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 3 }}>STATUS</div>
                          <div><StatusBadge status={s.status} /></div>
                        </div>
                      </div>

                      {/* Synopsis */}
                      {(s.contentUrl || s.description || s.note) && (
                        <div style={{ padding: "12px 14px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 6 }}>SYNOPSIS</div>
                          <div style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.65, wordBreak: "break-word" }}>
                            {s.contentUrl || s.description || s.note}
                          </div>
                          {s.contentUrl && isBrowserUrl(s.contentUrl) && (
                            <a
                              href={s.contentUrl} target="_blank" rel="noreferrer"
                              style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(0,230,230,0.08)", borderRadius: 6, color: "var(--mf-cyan)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                            >
                              <Link2 size={11} /> Open link
                            </a>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ marginTop: 4, display: "flex", gap: 10 }}>
                        {isAssignedToMe && relatedProject && (
                          <button
                            onClick={() => setPlanProjectId(relatedProject.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                              background: "var(--mf-bg-surface)", color: "var(--mf-text)", border: "1px solid var(--mf-border)", borderRadius: 8,
                              fontSize: 13, fontWeight: 800, cursor: "pointer"
                            }}
                          >
                            Production Plan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* RIGHT — File thumbnails */}
                    {files.length > 0 && (
                      <div style={{ flex: 1, minWidth: 0, borderLeft: "1px solid var(--mf-border)", paddingLeft: 32 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 10 }}>
                          UPLOADED FILES ({files.length})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
                          {files.map((file, idx) => {
                            const path = filePath(file);
                            const canPreview = Boolean(path && isImageFile(file));
                            const isPsd = isPsdFile(file);
                            return (
                              <div key={file.id ?? idx} style={{
                                background: "var(--mf-bg-deep)", border: "1px solid var(--mf-border)",
                                borderRadius: 12, overflow: "hidden",
                              }}>
                                <div style={{
                                  width: "100%", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center",
                                  position: "relative", overflow: "hidden", background: "var(--mf-bg-surface)",
                                }}>
                                  {canPreview ? (
                                    <img src={path || ""} alt={fileName(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <FileText size={32} color="var(--mf-text-muted)" />
                                  )}
                                  {path && (
                                    <a href={path} target="_blank" rel="noreferrer"
                                      style={{
                                        position: "absolute", bottom: 6, right: 6,
                                        width: 28, height: 28, borderRadius: 7,
                                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                        textDecoration: "none", transition: "background 0.15s",
                                      }}
                                    >
                                      <ArrowUpRight size={13} />
                                    </a>
                                  )}
                                </div>
                                <div style={{ padding: "8px 10px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", wordBreak: "break-word", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{fileName(file)}</div>
                                  <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>{formatBytes(fileSize(file))} · {fileContentType(file).split("/").pop()?.toUpperCase()}</div>
                                  {isPsd && <div style={{ fontSize: 9, color: "var(--mf-magenta)", fontWeight: 800, marginTop: 2 }}>NO PREVIEW</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {planProjectId && (
        <ProductionPlanDialog
          projectId={planProjectId}
          onClose={() => setPlanProjectId(null)}
          onSuccess={() => setPlanProjectId(null)}
        />
      )}
    </div>
  );
}

function ProjectDetailsModal({
  project,
  onClose,
  onSuccess,
}: {
  project: ProjectFromApi;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const plan = project.productionPlan;

  const [description, setDescription] = useState(project.description || "");
  const [mangakaId, setMangakaId] = useState(project.mangaka?.id?.toString() || "");
  const [priority, setPriority] = useState(plan?.priority || "Medium");
  const [deadline, setDeadline] = useState(plan?.deadline ? plan.deadline.substring(0, 10) : "");
  const [chapterTimeline, setChapterTimeline] = useState(plan?.chapterTimeline || "");
  const [saving, setSaving] = useState(false);

  const [availableMangakas, setAvailableMangakas] = useState<AdminAccount[]>([]);
  const [loadingMangakas, setLoadingMangakas] = useState(true);

  useEffect(() => {
    getAllAccounts()
      .then(accounts => {
        const mangakas = accounts.filter(a => a.systemRole?.some(r => r.roleName === 'MANGAKA') || a.requestedRole === 'MANGAKA');
        setAvailableMangakas(mangakas.length > 0 ? mangakas : accounts);
      })
      .catch(() => setAvailableMangakas([]))
      .finally(() => setLoadingMangakas(false));
  }, []);

  const fieldStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    outline: "none",
    transition: "border-color 0.15s ease",
    marginTop: 8,
    boxSizing: "border-box"
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: 10,
    fontWeight: 800,
    color: "var(--mf-text-muted)",
    marginBottom: 8,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mangakaId && mangakaId !== project.mangaka?.id?.toString()) {
        await assignMangakaToProject(project.id, Number(mangakaId));

        // Update local storage cache
        try {
          const cachedStr = localStorage.getItem("project_mangaka_assignments") || "{}";
          const cached = JSON.parse(cachedStr);
          const chosen = availableMangakas.find(a => a.id.toString() === mangakaId);
          const chosenName = chosen
            ? (chosen.firstName || chosen.lastName ? `${chosen.firstName} ${chosen.lastName}`.trim() : (chosen.username || chosen.email || ""))
            : `Mangaka #${mangakaId}`;
          cached[project.id] = {
            id: Number(mangakaId),
            name: chosenName,
            status: "MANGAKA_ASSIGNED",
            deadline: plan?.deadline,
            chapterId: (project as any).cachedChapterId
          };
          localStorage.setItem("project_mangaka_assignments", JSON.stringify(cached));
        } catch (e) { }
      }

      toast.success("Project updated and assigned successfully!");
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err: any) {
      toast.error("Failed to update: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200,
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: 640, boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 32px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--mf-cyan)", flexShrink: 0
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>
                {project.title || "Project Details"}
              </div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
                Update production details
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--mf-text-muted)",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"; e.currentTarget.style.color = "var(--mf-cyan)"; e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>MANGAKA ASSIGNMENT</label>
            <select
              className="mf-select"
              value={mangakaId}
              onChange={(e) => setMangakaId(e.target.value)}
              style={{ ...fieldStyle, appearance: "auto" }}
            >
              <option value="" style={{ background: "var(--mf-bg-deep)" }}>-- Select Mangaka --</option>
              {loadingMangakas ? (
                <option disabled>Loading members...</option>
              ) : (
                availableMangakas.map(m => (
                  <option key={m.id} value={m.id} style={{ background: "var(--mf-bg-deep)" }}>
                    {m.firstName || m.lastName ? `${m.firstName} ${m.lastName}` : (m.username || m.email)} (ID: {m.id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 100, resize: "vertical", lineHeight: 1.5 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description..."
              onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={labelStyle}>PRIORITY</label>
              <select
                style={fieldStyle}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <option value="High" style={{ background: "var(--mf-bg-deep)" }}>High</option>
                <option value="Medium" style={{ background: "var(--mf-bg-deep)" }}>Medium</option>
                <option value="Low" style={{ background: "var(--mf-bg-deep)" }}>Low</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>DEADLINE</label>
              <input
                type="date"
                style={fieldStyle}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>CHAPTER TIMELINE</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }}
              value={chapterTimeline}
              onChange={(e) => setChapterTimeline(e.target.value)}
              placeholder="Outline chapter deadlines..."
              onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              color: "var(--mf-text)",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "border-color 0.15s ease"
            }}
            onMouseEnter={e => !saving && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
            onMouseLeave={e => !saving && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 22px",
              background: "var(--mf-cyan)",
              border: "none",
              borderRadius: 10,
              color: "#000",
              fontSize: 13,
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 0 15px rgba(0,240,255,0.4)",
            }}
          >
            {saving ? "Saving..." : "Save Details"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Tantou Submissions Section ────────────────────────────────────────────────

function ReviewModal({
  submission,
  onClose,
  onDone,
}: {
  submission: SubmissionApi;
  onClose: () => void;
  onDone: () => void;
}) {
  const [pacingPass, setPacingPass] = useState(true);
  const [structurePass, setStructurePass] = useState(true);
  const [imageFlowPass, setImageFlowPass] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const files = submission.files || [];

  async function handleDecision(decision: "APPROVE" | "REJECT") {
    const reviewerId = tokenStorage.getAccount()?.id;
    if (!reviewerId) {
      setSubmitError("Cannot review: logged-in account ID not found.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reviewSubmissionByTantou({
        submissionId: submission.id,
        reviewerId,
        decision,
        comment,
        pacingPass,
        structurePass,
        imageFlowPass,
      });
      onDone();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Review failed.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: 780, boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column"
      }}>
        {/* Header Section */}
        <div style={{
          padding: "24px 32px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--mf-cyan)", flexShrink: 0
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>
                {displayText(submission.title, "Untitled Submission")}
              </div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
                Review Submission
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--mf-text-muted)",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"; e.currentTarget.style.color = "var(--mf-cyan)"; e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* File Previews */}
          {files.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 14 }}>
                UPLOADED FILES ({files.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                {files.map((file, idx) => {
                  const path = filePath(file);
                  const canPreview = Boolean(path && isImageFile(file));
                  const isPsd = isPsdFile(file);
                  return (
                    <div key={file.id ?? idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ width: "100%", aspectRatio: "3/4", background: "rgba(255,255,255,0.01)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                        {canPreview ? (
                          <img src={path || ""} alt={fileName(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <FileText size={36} color="var(--mf-text-muted)" />
                        )}
                        {path && (
                          <a href={path} target="_blank" rel="noreferrer"
                            style={{ position: "absolute", bottom: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}
                          >
                            <ArrowUpRight size={13} />
                          </a>
                        )}
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", wordBreak: "break-word", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName(file)}</div>
                        <div style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>{formatBytes(fileSize(file))}</div>
                        {isPsd && <div style={{ fontSize: 10, color: "var(--mf-magenta)", fontWeight: 800, marginTop: 4 }}>NO PREVIEW</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Fields */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 14 }}>
              REVIEW CRITERIA
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
              {([
                { label: "Pacing", value: pacingPass, onChange: setPacingPass },
                { label: "Structure", value: structurePass, onChange: setStructurePass },
                { label: "Image Flow", value: imageFlowPass, onChange: setImageFlowPass },
              ] as const).map(({ label, value, onChange }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 10, color: "var(--mf-text-muted)", fontWeight: 800, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={value ? "true" : "false"}
                      onChange={(e) => onChange(e.target.value === "true")}
                      style={{
                        width: "100%", padding: "8px 32px 8px 12px",
                        background: value ? "rgba(0,230,180,0.1)" : "rgba(255,42,122,0.08)",
                        border: `1px solid ${value ? "rgba(0,230,180,0.35)" : "rgba(255,42,122,0.35)"}`,
                        borderRadius: 8, color: value ? "var(--mf-green)" : "var(--mf-magenta)",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        appearance: "none", WebkitAppearance: "none", outline: "none"
                      }}
                    >
                      <option value="true" style={{ background: "var(--mf-bg-deep)", color: "var(--mf-green)" }}>✓ Pass</option>
                      <option value="false" style={{ background: "var(--mf-bg-deep)", color: "var(--mf-magenta)" }}>✗ Not Pass</option>
                    </select>
                    <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "var(--mf-green)" : "var(--mf-magenta)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>COMMENT</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your review comments here..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  boxSizing: "border-box"
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(255,42,109,0.1)",
              border: "1px solid rgba(255,42,109,0.3)",
              color: "var(--mf-magenta)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700
            }}>
              {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button
              onClick={() => void handleDecision("APPROVE")}
              disabled={submitting}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", background: "var(--mf-cyan)",
                border: "none", borderRadius: 10, color: "#000",
                fontSize: 13, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                boxShadow: "0 0 15px rgba(0,240,255,0.3)",
              }}
            >
              {submitting ? <Loader2 size={15} className="mf-spin" /> : <ThumbsUp size={15} />}
              APPROVE
            </button>
            <button
              onClick={() => void handleDecision("REJECT")}
              disabled={submitting}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                color: "var(--mf-text)", fontSize: 13, fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.borderColor = "rgba(255,42,122,0.8)"; e.currentTarget.style.color = "var(--mf-magenta)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "var(--mf-text)"; }}
            >
              {submitting ? <Loader2 size={15} className="mf-spin" /> : <ThumbsDown size={15} />}
              REJECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionPlanList() {
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [assignChapterPlanId, setAssignChapterPlanId] = useState<number | null>(null);
  const [assignChapterProjectId, setAssignChapterProjectId] = useState<number | null>(null);
  const [assignChapterId, setAssignChapterId] = useState<number | null>(null);
  const [viewProjectId, setViewProjectId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use dynamic import so it doesn't break static chunking further up
      const { getChapters, getSubmissions } = await import("../../services/workflowApi");
      const [plans, allChapters, allSubmissions] = await Promise.all([
        getProductionPlans(),
        getChapters().catch(() => []), // Fallback to empty array if fails
        getSubmissions().catch(() => []) // Fetch submissions to get true submitters
      ]);

      const projectChapters = new Map<number, any>();
      for (const ch of allChapters) {
        if (ch.projectId) projectChapters.set(ch.projectId, ch);
      }

      // Fetch project details for each plan in parallel (guaranteed not to crash since they have a production plan)
      const projectPromises = plans.map(plan =>
        getProjectById(plan.projectId)
          .then(proj => {
            proj.productionPlan = plan;

            // Map flat fields from backend ProjectResponse to the frontend mangaka object
            const projAny = proj as any;
            if (projAny.mangakaId && projAny.mangakaName) {
              proj.mangaka = {
                id: projAny.mangakaId,
                name: projAny.mangakaName
              };
            }

            // Override ownerName with the true submitter from the voting round
            const sub = allSubmissions.find(s => s.title === proj.title && s.status === "APPROVED");
            if (sub) {
              const submitterName = sub.submittedByName || sub.submittedBy?.name || sub.submittedBy?.username || (sub.submittedById ? `User #${sub.submittedById}` : undefined);
              if (submitterName) {
                proj.ownerName = submitterName;
              }
            }

            return proj;
          })
          .catch(() => {
            // Fallback project representation if API fails
            return {
              id: plan.projectId,
              title: plan.projectTitle,
              productionPlan: plan,
              status: "ACTIVE",
            } as ProjectFromApi;
          })
      );

      const allProjects = await Promise.all(projectPromises);

      // Restore Mangaka from Chapters AND Cache
      try {
        const cachedStr = window.localStorage.getItem("project_mangaka_assignments") || "{}";
        const cached = JSON.parse(cachedStr);
        for (const p of allProjects) {
          const ch = projectChapters.get(p.id);

          if (ch) {
            // Removed incorrect fallback that set mangaka to chapter owner (Tantou)
            if (ch.chapterStatus) p.projectWorkflowStatus = ch.chapterStatus;
            if (ch.publishDate && p.productionPlan) p.productionPlan.deadline = ch.publishDate;
            (p as any).cachedChapterId = ch.id;
          } else if (cached[p.id]) {
            if (!p.mangaka) p.mangaka = { id: cached[p.id].id, name: cached[p.id].name };
            if (cached[p.id].status) p.projectWorkflowStatus = cached[p.id].status;
            if (cached[p.id].deadline && p.productionPlan) p.productionPlan.deadline = cached[p.id].deadline;
            if (cached[p.id].chapterId) (p as any).cachedChapterId = cached[p.id].chapterId;
          }
        }
      } catch (e) { }

      // Filter only projects that have a production plan (should be all since we queried from plans)
      const withPlans = allProjects.filter(p => p.productionPlan != null);
      setProjects(withPlans);
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to load projects/plans.";
      setError(message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.01em", margin: 0 }}>Production Plans</h2>
          <p style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Overview of active production plans and chapter assignments</p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", fontSize: 12, fontWeight: 800, cursor: loading ? "default" : "pointer", opacity: loading ? 0.65 : 1 }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="editor-minimal-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--mf-text-muted)", paddingTop: 60 }}>
            <Loader2 size={20} style={{ animation: "editor-spin 1s linear infinite" }} /> Loading production plans...
          </div>
        )}
        {!loading && error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mf-magenta)", padding: "16px 20px", background: "rgba(255,42,122,0.08)", borderRadius: 12, border: "1px solid rgba(255,42,122,0.2)" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {!loading && !error && projects.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--mf-text-muted)", paddingTop: 60 }}>
            <Inbox size={44} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: 14 }}>No production plans found</p>
          </div>
        )}
        {!loading && !error && projects.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {projects.map((p) => {
              const plan = p.productionPlan!;
              return (
                <div
                  key={p.id}
                  onClick={() => setViewProjectId(p.id)}
                  style={{
                    background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
                    borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
                    cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s",
                    ...{ ":hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transform: "translateY(-2px)" } }
                  }}
                >
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mf-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "-0.01em" }}>{p.title || `Project #${p.id}`}</div>
                        <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>
                          Submitted by: <span style={{ color: "var(--mf-text-secondary)", fontWeight: 700 }}>{p.ownerName || `Owner #${p.ownerId || "N/A"}`}</span>
                        </div>
                      </div>
                      <span style={{ padding: "3px 10px", background: plan.priority === "High" ? "rgba(255,42,122,0.1)" : "var(--mf-cyan-dim)", color: plan.priority === "High" ? "var(--mf-magenta)" : "var(--mf-cyan)", fontSize: 10, fontWeight: 800, borderRadius: 100, border: `1px solid ${plan.priority === "High" ? "rgba(255,42,122,0.3)" : "var(--mf-cyan)35"}` }}>
                        {plan.priority || "Medium"} Priority
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: "var(--mf-text-muted)", marginBottom: 4 }}>PROJECT STATUS</div>
                        <div style={{ fontSize: 13, color: "var(--mf-text-secondary)" }}>{p.projectWorkflowStatus || "N/A"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: "var(--mf-text-muted)", marginBottom: 4 }}>DEADLINE</div>
                        <div style={{ fontSize: 13, color: "var(--mf-text-secondary)" }}>{formatDateTime(plan.deadline)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "16px 24px", background: "var(--mf-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--mf-magenta-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-magenta)", fontWeight: 800, fontSize: 12 }}>
                        {p.mangaka ? (p.mangaka.name?.[0] || "M") : "N/A"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--mf-text-secondary)" }}>{p.mangaka ? p.mangaka.name : "No Mangaka"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {!p.mangaka && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignChapterPlanId(plan.id);
                            setAssignChapterProjectId(p.id);
                            setAssignChapterId((p as any).cachedChapterId || null);
                          }}
                          style={{ padding: "8px 16px", borderRadius: 8, background: "var(--mf-cyan)", border: "none", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                        >
                          + Assign Chapter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {assignChapterPlanId && assignChapterProjectId && (
        <CreateChapterDialog
          projectId={assignChapterProjectId}
          planId={assignChapterPlanId}
          chapterId={assignChapterId}
          initialTitle={projects.find(p => p.id === assignChapterProjectId)?.title || ""}
          initialMangakaId={projects.find(p => p.id === assignChapterProjectId)?.mangaka?.id || null}
          onClose={() => {
            setAssignChapterPlanId(null);
            setAssignChapterProjectId(null);
            setAssignChapterId(null);
          }}
          onSuccess={() => {
            setAssignChapterPlanId(null);
            setAssignChapterProjectId(null);
            setAssignChapterId(null);
            void loadData();
          }}
        />
      )}

      {viewProjectId && projects.find(p => p.id === viewProjectId) && (
        <ProjectDetailsModal
          project={projects.find(p => p.id === viewProjectId)!}
          onClose={() => setViewProjectId(null)}
          onSuccess={() => {
            setViewProjectId(null);
            void loadData(); // Reload to refresh the list and show assignments for the Tantou
          }}
        />
      )}
    </div>
  );
}

// ─── Main EditorDashboard ───────────────────────────────────────────────────
export function EditorDashboard() {
  const cachedRole = tokenStorage.getUserRole() || "";
  const isMangakaUser = cachedRole.toUpperCase() === "MANGAKA";

  const [activeNav, setActiveNav] = useState(() => isMangakaUser ? "My Chapters" : "Notifications");
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<number | null>(null);
  const [authorNames, setAuthorNames] = useState<Record<number, { name: string; email?: string | null }>>({});
  const [loadingAuthorIds, setLoadingAuthorIds] = useState<Set<number>>(new Set());
  const [failedAuthorIds, setFailedAuthorIds] = useState<Set<number>>(new Set());
  const [submissionDetails, setSubmissionDetails] = useState<Record<number, SubmissionApi>>({});
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<number>>(new Set());
  const [failedDetailIds, setFailedDetailIds] = useState<Set<number>>(new Set());
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionApi | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const tantouAccount = tokenStorage.getAccount();
      const currentTantouId = tantouAccount?.id;

      const [rows, reviews] = await Promise.all([
        getSubmissions(),
        import("../../services/workflowApi").then(m => m.getSubmissionReviews())
      ]);

      const reviewMap = new Map<number, number>();
      for (const r of reviews) {
        if (r.decision === "REJECTED" || r.decision === "REJECT") {
          const subId = Number(r.submissionId);
          reviewMap.set(subId, (reviewMap.get(subId) || 0) + 1);
        }
      }

      const updatedRows = rows
        .filter(s => {
          if (!currentTantouId) return false;
          const assignedId = s.tantouId ?? s.tantou?.id ?? (s as any).editorId ?? s.project?.tantouId ?? s.project?.tantou?.id;
          return Number(assignedId) === Number(currentTantouId);
        })
        .map(s => {
          const rejectCount = reviewMap.get(s.id) || 0;
          if (rejectCount >= 2 && s.status !== "APPROVED") {
            return { ...s, status: "REJECTED" };
          }
          return s;
        });

      setSubmissions(updatedRows);
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to load submissions.";
      setError(message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubmissions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubmissions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ids = submissions
        .filter(needsSubmissionDetailLookup)
        .map((submission) => submission.id)
        .filter((id) => !submissionDetails[id] && !loadingDetailIds.has(id) && !failedDetailIds.has(id));
      const missingIds = Array.from(new Set(ids));
      if (missingIds.length === 0) return;

      setLoadingDetailIds((current) => new Set([...current, ...missingIds]));

      missingIds.forEach((id) => {
        getSubmissionById(id)
          .then((detail) => {
            setSubmissionDetails((current) => ({
              ...current,
              [id]: detail,
            }));
          })
          .catch(() => {
            setFailedDetailIds((current) => new Set([...current, id]));
          })
          .finally(() => {
            setLoadingDetailIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          });
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [submissions, submissionDetails, loadingDetailIds, failedDetailIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const resolvedSubmissions = submissions.map((submission) => submissionForAuthorResolution(submission, {
        names: authorNames,
        loadingIds: loadingAuthorIds,
        failedIds: failedAuthorIds,
        detailBySubmissionId: submissionDetails,
        loadingDetailIds,
        failedDetailIds,
      }));
      const ids = Array.from(new Set(resolvedSubmissions.filter(needsAuthorLookup).map(authorId).filter((id): id is number => typeof id === "number")));
      const missingIds = ids.filter((id) => !authorNames[id] && !loadingAuthorIds.has(id) && !failedAuthorIds.has(id));
      if (missingIds.length === 0) return;

      setLoadingAuthorIds((current) => new Set([...current, ...missingIds]));

      missingIds.forEach((id) => {
        getAccountProfile(id)
          .then((account) => {
            const name = accountDisplayName(account) || `Mangaka #${id}`;
            setAuthorNames((current) => ({
              ...current,
              [id]: { name, email: account.email },
            }));
          })
          .catch(() => {
            setFailedAuthorIds((current) => new Set([...current, id]));
          })
          .finally(() => {
            setLoadingAuthorIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          });
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [submissions, submissionDetails, loadingDetailIds, failedDetailIds, authorNames, loadingAuthorIds, failedAuthorIds]);

  async function handleTantouEscalate(submission: SubmissionApi) {
    const reviewerId = tokenStorage.getAccount()?.id;
    if (!reviewerId) {
      setActionError("Cannot escalate because the logged-in Tantou account ID was not found.");
      return;
    }

    setEscalatingId(submission.id);
    setActionError(null);
    try {
      await reviewSubmissionByTantou({
        submissionId: submission.id,
        reviewerId,
        decision: "APPROVE",
        comment: "Recommended to Editorial Board",
        pacingPass: true,
        structurePass: true,
        imageFlowPass: true,
      });
      await loadSubmissions();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to escalate submission.";
      setActionError(message);
    } finally {
      setEscalatingId(null);
    }
  }

  async function handleStartBoardVoting(submission: SubmissionApi) {
    const tantouId = tokenStorage.getAccount()?.id;
    if (!tantouId) {
      setActionError("Cannot start board voting because the logged-in Tantou account ID was not found.");
      return;
    }

    setEscalatingId(submission.id);
    setActionError(null);
    try {
      await submitToBoard(submission.id, tantouId);
      await loadSubmissions();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to start board voting.";
      setActionError(message);
    } finally {
      setEscalatingId(null);
    }
  }

  const isMyChaptersView = activeNav === "My Chapters" || (isMangakaUser && activeNav === "Notifications");
  const isNotificationsView = activeNav === "Notifications" && !isMangakaUser;
  const isProductionPlanView = activeNav === "Production Plan";
  const isApprovedView = activeNav === "Approved";

  return (
    <AppLayout role="editor" activeNav={isMangakaUser && activeNav === "Notifications" ? "My Chapters" : activeNav} onNavClick={setActiveNav}>
      <style>{`
        .editor-minimal-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .editor-minimal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .editor-minimal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .editor-minimal-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
        }
        @keyframes editor-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: "flex", height: "100%", overflow: "hidden", flexDirection: "column" }}>
        {/* Top bar — hidden for Production Plan, My Chapters & Notifications view */}
        {!isProductionPlanView && !isNotificationsView && !isMyChaptersView && (
          <div style={{ flexShrink: 0, borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 10, padding: "14px 22px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeNav === "Approved" ? "var(--mf-magenta)" : activeNav === "Escalated to Board" ? "var(--mf-green)" : activeNav === "In Revision" ? "var(--mf-orange)" : "var(--mf-cyan)" }} />
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>{activeNav}</span>
            <button
              onClick={() => void loadSubmissions()}
              disabled={loading}
              style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 11px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", fontSize: 12, fontWeight: 800, cursor: loading ? "default" : "pointer", opacity: loading ? 0.65 : 1 }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        )}

        {/* My Chapters view (for Mangaka role) */}
        {isMyChaptersView && <MangakaChaptersList />}

        {/* Notifications view */}
        {isNotificationsView && <AssignedProjectsList />}

        {/* Production Plan view */}
        {isProductionPlanView && <ProductionPlanList />}

        {/* Approved accordion view */}
        {isApprovedView && !isProductionPlanView && !loading && (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ApprovedList
              submissions={submissions}
              onRefresh={() => void loadSubmissions()}
            />
          </div>
        )}
        {isApprovedView && !isProductionPlanView && loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--mf-text-muted)" }}>
            <Loader2 size={18} style={{ animation: "editor-spin 1s linear infinite" }} />
            Loading approved submissions...
          </div>
        )}

        {/* Regular ProposalFeed views (all except Approved, Production Plan, My Chapters & Notifications) */}
        {!isProductionPlanView && !isApprovedView && !isNotificationsView && !isMyChaptersView && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {loading && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--mf-text-muted)" }}>
                <Loader2 size={18} style={{ animation: "editor-spin 1s linear infinite" }} />
                Loading editor submissions...
              </div>
            )}
            {!loading && error && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-magenta)", padding: 24, textAlign: "center" }}>
                <AlertTriangle size={34} />
                <div style={{ fontSize: 14, fontWeight: 800 }}>{error}</div>
              </div>
            )}
            {!loading && !error && submissions.length === 0 && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-text-muted)" }}>
                <Inbox size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>No submissions found</p>
              </div>
            )}
            {!loading && !error && submissions.length > 0 && (
              <ProposalFeed
                filter={activeNav}
                submissions={submissions}
                escalatingId={escalatingId}
                error={actionError}
                authorLookup={{
                  names: authorNames,
                  loadingIds: loadingAuthorIds,
                  failedIds: failedAuthorIds,
                  detailBySubmissionId: submissionDetails,
                  loadingDetailIds,
                  failedDetailIds,
                }}
                onTantouEscalate={(submission) => void handleTantouEscalate(submission)}
                onStartBoardVoting={(submission) => void handleStartBoardVoting(submission)}
                onReview={(submission) => setReviewingSubmission(submission)}
              />
            )}
          </div>
        )}
      </div>

      {reviewingSubmission && (
        <ReviewModal
          submission={reviewingSubmission}
          onClose={() => setReviewingSubmission(null)}
          onDone={() => {
            setReviewingSubmission(null);
            void loadSubmissions();
          }}
        />
      )}
    </AppLayout>
  );
}
