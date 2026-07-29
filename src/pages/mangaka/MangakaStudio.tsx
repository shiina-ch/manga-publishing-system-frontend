import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  Brush,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Plus,
  User,
  Users,
  X,
  ArrowUpRight,
  ChevronUp,
  UserPlus,
  Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import { getMangakaSubmissions, getSubmissionById, getChapters, type SubmissionApi, type ChapterApi, type TaskApi, submitIdea, type SubmissionReviewApi, getMangakaActiveTasks, type ActiveTaskApi, getReviewsForSubmission, postSubmissionReview, submitTask } from "../../services/workflowApi";
import { getChaptersByMangaka, createTaskUnderChapter, createSubTask, getSubTasks } from "../../services/projectApi";
import { getAllAccounts, type AdminAccount } from "../../services/adminApi";
import { tokenStorage } from "../../storage/tokenStorage";
import { RefreshCw, AlertTriangle, Inbox } from "lucide-react";

function MangakaMyChapters() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "tasks">("details");
  // Task Detail Modal State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any | null>(null);
  const [activeTaskDetailTab, setActiveTaskDetailTab] = useState<"detail" | "subtask">("detail");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAcceptanceCriteria, setTaskAcceptanceCriteria] = useState("");
  const [taskType, setTaskType] = useState("OUTLINE");
  const [taskDeadlineDate, setTaskDeadlineDate] = useState("");
  const [taskDeadlineTime, setTaskDeadlineTime] = useState("09:00");
  const [creatingTask, setCreatingTask] = useState(false);

  // Create SubTask Form State
  const [showCreateSubTask, setShowCreateSubTask] = useState(false);
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
    setShowCreateSubTask(true);
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
      setShowCreateSubTask(false);

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

  const handleOpenCreateTaskModal = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskAcceptanceCriteria("");
    setTaskType("OUTLINE");
    const today = new Date().toISOString().slice(0, 10);
    setTaskDeadlineDate(today);
    setTaskDeadlineTime("09:00");
    setShowCreateTask(true);
  };

  const handleCreateTaskSubmit = async () => {
    if (!selectedChapter?.id) {
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
      const formattedDeadlineTime = `${taskDeadlineDate || new Date().toISOString().slice(0, 10)}T${taskDeadlineTime.length === 5 ? taskDeadlineTime + ":00" : taskDeadlineTime}`;

      const createdTask = await createTaskUnderChapter(selectedChapter.id, {
        requesterId,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        acceptanceCriteria: taskAcceptanceCriteria.trim(),
        productionTaskType: taskType,
        deadlineDate: taskDeadlineDate,
        deadlineTime: formattedDeadlineTime,
      });

      toast.success("Task created under chapter successfully!");
      setShowCreateTask(false);

      const updatedTasks = Array.isArray(selectedChapter.tasks) ? [...selectedChapter.tasks, createdTask] : [createdTask];
      setSelectedChapter((prev: any) => prev ? { ...prev, tasks: updatedTasks } : null);

      await fetchMyChapters();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const fetchMyChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const account = tokenStorage.getAccount();
      const mangakaId = account?.id;
      if (!mangakaId) {
        setError("Mangaka ID not found in session.");
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
  };

  useEffect(() => {
    void fetchMyChapters();
  }, []);

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "var(--mf-text)", letterSpacing: "-0.01em" }}>My Chapters</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", margin: "4px 0 0" }}>Chapters assigned to you for production</p>
        </div>
        <button
          onClick={() => void fetchMyChapters()}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", fontSize: 12, fontWeight: 800, cursor: loading ? "default" : "pointer", opacity: loading ? 0.65 : 1 }}
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
        <div style={{ padding: 20, background: "rgba(255,42,122,0.1)", border: "1px solid rgba(255,42,122,0.3)", borderRadius: 12, color: "var(--mf-red)", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{error}</span>
        </div>
      )}

      {!loading && !error && chapters.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px dashed var(--mf-border)" }}>
          <Inbox size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>No chapters assigned to you yet.</p>
        </div>
      )}

      {!loading && !error && chapters.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {chapters.map((ch: any) => (
            <div
              key={ch.id}
              onClick={() => {
                setSelectedChapter(ch);
                setSelectedTaskDetail(null);
                setActiveTab("details");
              }}
              style={{
                background: "var(--mf-bg-surface)",
                border: "1px solid var(--mf-border)",
                borderRadius: 14,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="hover:border-[var(--mf-cyan-border)]"
            >
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
                {ch.publishDate && <div>Publish Date: <strong>{new Date(ch.publishDate).toLocaleDateString()}</strong></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chapter Detail & Tasks Modal for Mangaka */}
      {selectedChapter && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, gap: 16 }}>
          <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, width: "100%", maxWidth: 540, padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--mf-text)" }}>
                Ch.{selectedChapter.chapterNumber}: {selectedChapter.title}
              </h3>
              <button onClick={() => { setSelectedChapter(null); setSelectedTaskDetail(null); }} style={{ background: "transparent", border: "none", color: "var(--mf-text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* 2 Tabs Header */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--mf-border)", paddingBottom: 8 }}>
              <button
                onClick={() => setActiveTab("details")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "details" ? "var(--mf-cyan-dim)" : "transparent",
                  color: activeTab === "details" ? "var(--mf-cyan)" : "var(--mf-text-secondary)",
                }}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "tasks" ? "var(--mf-cyan-dim)" : "transparent",
                  color: activeTab === "tasks" ? "var(--mf-cyan)" : "var(--mf-text-secondary)",
                }}
              >
                Tasks ({Array.isArray(selectedChapter.tasks) ? selectedChapter.tasks.length : 0})
              </button>
            </div>

            {/* Tab 1: Details */}
            {activeTab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "var(--mf-bg-base)", padding: 12, borderRadius: 10, border: "1px solid var(--mf-border)", fontSize: 13 }}>
                  <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>STATUS</span> <strong>{selectedChapter.status || selectedChapter.chapterStatus || "ACTIVE"}</strong></div>
                  <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>PRIORITY</span> <strong>{selectedChapter.priority || "Medium"}</strong></div>
                  <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>TARGET PAGES</span> <strong>{selectedChapter.targetPageCount ?? "N/A"}</strong></div>
                  <div><span style={{ color: "var(--mf-text-muted)", fontSize: 11, display: "block" }}>MANGAKA</span> <strong style={{ color: "var(--mf-cyan)" }}>{selectedChapter.assigneeName || "Assigned"}</strong></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "var(--mf-text-secondary)" }}>
                  {selectedChapter.startDate && <div>Start Date: <strong>{new Date(selectedChapter.startDate).toLocaleDateString()}</strong></div>}
                  {selectedChapter.endDate && <div>End Date: <strong>{new Date(selectedChapter.endDate).toLocaleDateString()}</strong></div>}
                  {selectedChapter.deadline && <div>Deadline: <strong>{new Date(selectedChapter.deadline).toLocaleDateString()}</strong></div>}
                  {selectedChapter.publishDate && <div>Publish Date: <strong>{new Date(selectedChapter.publishDate).toLocaleDateString()}</strong></div>}
                </div>
              </div>
            )}

            {/* Tab 2: Tasks */}
            {activeTab === "tasks" && (
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
                {(!selectedChapter.tasks || selectedChapter.tasks.length === 0) ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-base)", borderRadius: 8, border: "1px dashed var(--mf-border)" }}>
                    <Inbox size={28} style={{ opacity: 0.4, marginBottom: 6 }} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>No tasks found for this chapter.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedChapter.tasks.map((task: any) => (
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
                        className="hover:border-[var(--mf-cyan-border)]"
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
              <button onClick={() => { setSelectedChapter(null); setSelectedTaskDetail(null); }} style={{ padding: "8px 16px", background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>

          {/* 2nd Dialog (Vertical at the right for Task Detail & Sub Task) */}
          {selectedTaskDetail && (
            <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-cyan-border)", borderRadius: 16, width: 440, padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Task: {selectedTaskDetail.title}
                </h3>
                <button onClick={() => setSelectedTaskDetail(null)} style={{ background: "transparent", border: "none", color: "var(--mf-text-muted)", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>

              {/* 2 Tabs for Task Detail Side Panel */}
              <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--mf-border)", paddingBottom: 8 }}>
                <button
                  onClick={() => setActiveTaskDetailTab("detail")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 13,
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
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 13,
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
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>TASK TITLE</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>{selectedTaskDetail.title}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>TYPE</span>
                        <span style={{ fontWeight: 800, color: "var(--mf-cyan)" }}>{selectedTaskDetail.productionTaskType || "OUTLINE"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>STATUS</span>
                        <span style={{ fontWeight: 800, color: "var(--mf-green)" }}>{selectedTaskDetail.taskWorkflowStatus || "TODO"}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>ASSIGNEE</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-cyan)" }}>{selectedTaskDetail.assigneeName || "Unassigned"}</span>
                    </div>

                    {selectedTaskDetail.description && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>DESCRIPTION</span>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mf-text-secondary)", lineHeight: 1.5 }}>{selectedTaskDetail.description}</p>
                      </div>
                    )}

                    {selectedTaskDetail.acceptanceCriteria && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>ACCEPTANCE CRITERIA</span>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mf-text-secondary)", lineHeight: 1.5 }}>{selectedTaskDetail.acceptanceCriteria}</p>
                      </div>
                    )}

                    {(selectedTaskDetail.deadlineDate || selectedTaskDetail.deadlineTime) && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", display: "block" }}>DEADLINE</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)" }}>{selectedTaskDetail.deadlineDate} {selectedTaskDetail.deadlineTime || ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SUB TASK */}
              {activeTaskDetailTab === "subtask" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>
                      Subtasks ({Array.isArray(selectedTaskDetail.subTasks) ? selectedTaskDetail.subTasks.length : 0})
                    </span>
                    <button
                      onClick={handleOpenCreateSubTaskModal}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        background: "var(--mf-cyan)",
                        border: "none",
                        borderRadius: 6,
                        color: "#000",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={13} /> New Subtask
                    </button>
                  </div>

                  {loadingSubTasks && (
                    <div style={{ padding: 16, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>
                      Loading subtasks...
                    </div>
                  )}

                  {!loadingSubTasks && (!selectedTaskDetail.subTasks || selectedTaskDetail.subTasks.length === 0) ? (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--mf-text-muted)", background: "var(--mf-bg-base)", borderRadius: 8, border: "1px dashed var(--mf-border)" }}>
                      <Inbox size={28} style={{ opacity: 0.4, marginBottom: 6, margin: "0 auto" }} />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>No sub tasks found for this task.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedTaskDetail.subTasks?.map((st: any, idx: number) => (
                        <div key={st.id || idx} style={{ background: "var(--mf-bg-base)", border: "1px solid var(--mf-border)", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
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
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--mf-text)" }}>
                Create New Task for Chapter #{selectedChapter?.chapterNumber}
              </h3>
              <button onClick={() => setShowCreateTask(false)} style={{ background: "transparent", border: "none", color: "var(--mf-text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

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
                placeholder="Task details..."
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
                placeholder="Criteria for completing task..."
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
                onClick={() => setShowCreateTask(false)}
                disabled={creatingTask}
                style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateTaskSubmit()}
                disabled={creatingTask}
                style={{ padding: "8px 16px", background: "var(--mf-cyan)", border: "none", borderRadius: 8, color: "#000", fontSize: 12, fontWeight: 800, cursor: creatingTask ? "default" : "pointer", opacity: creatingTask ? 0.7 : 1 }}
              >
                {creatingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create SubTask Modal */}
      {showCreateSubTask && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mf-border)", paddingBottom: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--mf-text)" }}>
                Create New Subtask for Task: {selectedTaskDetail?.title}
              </h3>
              <button onClick={() => setShowCreateSubTask(false)} style={{ background: "transparent", border: "none", color: "var(--mf-text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                  onClick={() => setShowCreateSubTask(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}

function submissionTitle(submission: SubmissionApi): string {
  return (
    submission.title?.trim()
    || `Submission #${submission.id}`
  );
}

function formatSubmissionDate(value?: string | null): string {
  if (!value) return "Submitted date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

const chapterStatusMap: Record<string, { label: string; color: string }> = {
  approved: { label: "Approved", color: "var(--mf-green)" },
  "in-revision": { label: "In Revision", color: "var(--mf-orange)" },
  in_revision: { label: "In Revision", color: "var(--mf-orange)" },
  revision: { label: "In Revision", color: "var(--mf-orange)" },
  request_revision: { label: "In Revision", color: "var(--mf-orange)" },
  requested_revision: { label: "In Revision", color: "var(--mf-orange)" },
  "under-review": { label: "Under Review", color: "var(--mf-cyan)" },
  pending_board_review: { label: "Under Preview", color: "var(--mf-cyan)" },
  pending: { label: "SUBMITTED · PENDING EDITOR REVIEW", color: "var(--mf-orange)" },
  rejected: { label: "Rejected", color: "var(--mf-red)" },
  submitted: { label: "Submitted", color: "var(--mf-cyan)" },
};

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon size={26} color="var(--mf-text-muted)" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>{title}</h2>
        <p style={{ fontSize: 13, color: "var(--mf-text-muted)", lineHeight: 1.6, margin: 0 }}>{description}</p>
      </div>
    </div>
  );
}

function DelegateSubTaskModal({
  task: initialTask = null,
  tasks = [],
  onClose,
  onSuccess,
}: {
  task?: TaskApi | null;
  tasks?: TaskApi[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [emailSearch, setEmailSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskApi | null>(initialTask);

  const [title, setTitle] = useState(initialTask ? `Help with: ${initialTask.title || "Task"}` : "");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [pageNumber, setPageNumber] = useState<number | "">("");
  const [productionTaskType, setProductionTaskType] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setTitle(`Help with: ${selectedTask.title || "Task"}`);
    }
  }, [selectedTask]);

  const handleSearch = async () => {
    if (!emailSearch.trim()) return;
    setSearching(true);
    setSearchMessage(null);
    setAssigneeId(null);
    try {
      const { searchAccountByEmail } = await import("../../services/accountApi");
      const account = await searchAccountByEmail(emailSearch.trim());
      setAssigneeId(account.id);
      setSearchMessage(`Found assistant: ${account.firstName || ""} ${account.lastName || ""}`.trim() || `Found account ID: ${account.id}`);
    } catch (err: any) {
      setSearchMessage(err.message || "Failed to find assistant by email.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    const requesterId = tokenStorage.getAccount()?.id;
    if (!requesterId) {
      setError("Your session is unavailable. Please log in again.");
      return;
    }
    if (!selectedTask) {
      setError("Please select a parent task to delegate.");
      return;
    }
    if (!assigneeId) {
      setError("Please search and select an assistant first.");
      return;
    }
    if (!title.trim()) {
      setError("SubTask title is required.");
      return;
    }
    if (!deadlineDate) {
      setError("Deadline date is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createSubTask(selectedTask.id, {
        requesterId,
        assigneeId,
        title: title.trim(),
        description: pageNumber !== "" ? `${description}\n[Page ${pageNumber}]`.trim() : description,
        productionTaskType: productionTaskType || "OUTLINE",
        deadlineDate,
        deadlineTime: deadlineTime.trim() || "09:00:00",
      });
      toast.success("Task successfully delegated to assistant!");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to delegate task.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 500, outline: "none", transition: "border-color 0.15s ease",
    boxSizing: "border-box" as const
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "24px 32px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-cyan)", flexShrink: 0 }}>
              <UserPlus size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Delegate Task</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Assign a SubTask to an Assistant</div>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: submitting ? "not-allowed" : "pointer", color: "var(--mf-text-muted)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
            onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"; e.currentTarget.style.color = "var(--mf-cyan)"; e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.3)"; } }}
            onMouseLeave={e => { if (!submitting) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } }}
          ><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {initialTask ? (
            <div style={{ padding: "16px", background: "rgba(0, 240, 255, 0.05)", border: "1px solid rgba(0, 240, 255, 0.15)", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-cyan)", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Parent Task</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{initialTask.title}</div>
              <div style={{ fontSize: 13, color: "var(--mf-text-muted)" }}>Deadline: {initialTask.deadline ? new Date(initialTask.deadline).toLocaleDateString() : "No deadline"}</div>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>SELECT PARENT TASK</label>
              <div style={{ position: "relative" }}>
                <select
                  value={selectedTask?.id || ""}
                  onChange={e => {
                    if (Number(e.target.value) === -999) {
                      setSelectedTask({ id: -999, title: "Test Mock Task", chapterTitle: "Test Chapter", deadline: "2026-12-31" } as any);
                    } else {
                      const found = tasks.find(t => t.id === Number(e.target.value));
                      setSelectedTask(found || null);
                    }
                  }}
                  style={{
                    width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff",
                    fontSize: 14, fontWeight: 500, outline: "none", appearance: "none"
                  }}
                >
                  <option value="" disabled style={{ background: "var(--mf-bg-surface)" }}>-- Select an Active Task --</option>
                  <option value="-999" style={{ background: "var(--mf-bg-surface)", color: "var(--mf-cyan)" }}>
                    [Test Mode] Mock Parent Task
                  </option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id} style={{ background: "var(--mf-bg-surface)" }}>
                      [{t.chapterTitle}] {t.title}
                    </option>
                  ))}
                </select>
                {selectedTask && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--mf-text-muted)" }}>
                    Task Deadline: {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : "No deadline"}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>ASSISTANT EMAIL</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" value={emailSearch} onChange={e => setEmailSearch(e.target.value)} placeholder="Enter assistant's email..." style={{ ...fieldStyle, flex: 1 }} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} onKeyDown={e => { if (e.key === 'Enter') void handleSearch(); }} />
              <button onClick={() => void handleSearch()} disabled={searching || !emailSearch.trim()} style={{ padding: "0 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: (searching || !emailSearch.trim()) ? "not-allowed" : "pointer", opacity: (searching || !emailSearch.trim()) ? 0.5 : 1 }}>
                {searching ? "..." : "Search"}
              </button>
            </div>
            {searchMessage && (
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: assigneeId ? "var(--mf-green)" : "var(--mf-orange)" }}>
                {searchMessage}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>PAGE NUMBER</label>
              <input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value === "" ? "" : Number(e.target.value))} placeholder="E.g. 1" style={fieldStyle} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div style={{ flex: 3 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>QUICK TASK TYPE</label>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {[
                  { id: "LINEART", label: "Line Art" },
                  { id: "BACKGROUND", label: "Background" },
                  { id: "INKING", label: "Inking / Color" },
                  { id: "OUTLINE", label: "Effects / FX" }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setProductionTaskType(type.id);
                      setTitle(type.label);
                    }}
                    style={{
                      padding: "10px 14px",
                      background: productionTaskType === type.id ? "rgba(0, 240, 255, 0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${productionTaskType === type.id ? "var(--mf-cyan)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 10,
                      color: productionTaskType === type.id ? "var(--mf-cyan)" : "var(--mf-text-muted)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>SUBTASK TITLE</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Draw backgrounds for pages 10-15" style={fieldStyle} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>DESCRIPTION (OPTIONAL)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide any details or instructions for the assistant..." rows={3} style={{ ...fieldStyle, resize: "vertical" }} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>DEADLINE DATE</label>
              <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} style={fieldStyle} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>DEADLINE TIME (OPTIONAL)</label>
              <input type="time" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} style={fieldStyle} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
          </div>
          {error && <div style={{ padding: "12px 16px", borderRadius: 10, color: "var(--mf-magenta)", background: "rgba(255,42,109,0.1)", border: "1px solid rgba(255,42,109,0.3)", fontSize: 13, fontWeight: 700 }}>{error}</div>}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={onClose} disabled={submitting} style={{ padding: "12px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "var(--mf-text)", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", transition: "border-color 0.15s ease" }} onMouseEnter={e => { if (!submitting) e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }} onMouseLeave={e => { if (!submitting) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}>Cancel</button>
            <button onClick={() => void handleSubmit()} disabled={submitting} style={{ padding: "12px 24px", background: "var(--mf-cyan)", border: "none", borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 15px rgba(0,240,255,0.3)" }}>
              {submitting && <Loader2 size={16} className="mf-spin" />}
              Delegate Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MangakaTasks({ tasks, loading, authenticatedAccountId }: { tasks: ActiveTaskApi[]; loading?: boolean; authenticatedAccountId?: number }) {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<{ url: string, submissionId: number } | null>(null);
  
  const [reviews, setReviews] = useState<SubmissionReviewApi[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewDecision, setNewReviewDecision] = useState("APPROVED");
  const [newReviewNote, setNewReviewNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (viewingSubmission) {
      setReviewsLoading(true);
      console.log("Fetching reviews for submission:", viewingSubmission.submissionId);
      getReviewsForSubmission(viewingSubmission.submissionId)
        .then(res => {
          console.log("Fetched reviews:", res);
          setReviews(res || []);
        })
        .catch(err => console.error("Error fetching reviews:", err))
        .finally(() => setReviewsLoading(false));
    } else {
      setReviews([]);
    }
  }, [viewingSubmission]);

  const handlePostReview = async () => {
    if (!viewingSubmission || !authenticatedAccountId) {
      toast.error("Missing required information to post a review.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await postSubmissionReview(viewingSubmission.submissionId, {
        reviewerId: authenticatedAccountId,
        decision: newReviewDecision,
        note: newReviewNote
      });
      setReviews(prev => [...prev, res]);
      setNewReviewNote("");
      toast.success("Review posted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to post review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 size={32} color="var(--mf-magenta)" className="spinner" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 48 }}>
        <EmptyState
          icon={Calendar}
          title="No tasks assigned"
          description="When your Tantou assigns you a chapter, tasks will appear here."
        />
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {tasks.map(t => (
          <div key={t.id} style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 12, overflow: "hidden" }}>
            {/* Main Task Header */}
            <div 
              style={{ padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }}
              onClick={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mf-text-secondary)", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                    {t.productionTaskType}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{t.title}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--mf-cyan)", background: "var(--mf-cyan-dim)", padding: "4px 8px", borderRadius: 4 }}>
                    {t.taskWorkflowStatus}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSubmitTaskId(t.id); }} style={{ padding: "6px 12px", background: "var(--mf-cyan)", border: "none", borderRadius: 6, color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Submit Task</button>
                  {expandedTaskId === t.id ? <ChevronUp size={20} color="var(--mf-text-secondary)" /> : <ChevronRight size={20} color="var(--mf-text-secondary)" />}
                </div>
              </div>
              
              {t.description && <div style={{ fontSize: 13, color: "var(--mf-text-muted)", lineHeight: 1.5 }}>{t.description}</div>}
              {t.acceptanceCriteria && <div style={{ fontSize: 13, color: "var(--mf-text-muted)", lineHeight: 1.5 }}><strong>Acceptance:</strong> {t.acceptanceCriteria}</div>}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 12, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} /> {t.deadlineDate ? t.deadlineDate : "No deadline"} {t.deadlineTime}
                </div>
                <div style={{ fontSize: 12, color: "var(--mf-text-secondary)", fontWeight: 700 }}>
                  {t.subTasks?.length || 0} Subtasks
                </div>
              </div>
            </div>

            {/* Subtasks Dropdown */}
            {expandedTaskId === t.id && t.subTasks && t.subTasks.length > 0 && (
              <div style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid var(--mf-border)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                {t.subTasks.map(sub => {
                  const submission = sub.submissions && sub.submissions.length > 0 ? sub.submissions[0] : null;
                  return (
                    <div key={sub.id} style={{ padding: 16, background: "var(--mf-bg-base)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>{sub.title}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: sub.subtaskStatus === "COMPLETED" ? "var(--mf-green-dim)" : "var(--mf-green-dim)", color: sub.subtaskStatus === "COMPLETED" ? "var(--mf-green)" : "var(--mf-green)" }}>
                          {sub.subtaskStatus}
                        </div>
                      </div>
                      {sub.description && <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginBottom: 8 }}>{sub.description}</div>}
                      <div style={{ fontSize: 12, color: "var(--mf-text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <Clock size={12} /> Deadline: {sub.deadlineDate} {sub.deadlineTime}
                      </div>

                      {submission && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", marginBottom: 6 }}>Latest Submission:</div>
                          {submission.contentUrl && (
                            <div style={{ fontSize: 12, color: "var(--mf-cyan)", marginBottom: 4 }}>
                              <button onClick={() => setViewingSubmission({ url: submission.contentUrl!, submissionId: submission.id })} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                                {submission.contentUrl}
                              </button>
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: "var(--mf-text-muted)", display: "flex", justifyContent: "space-between" }}>
                            <span>Status: {submission.productionStatus}</span>
                            <span>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ""}</span>
                          </div>
                          
                          {submission.files && submission.files.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                              {submission.files.map(f => (
                                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                                  <FileText size={14} color="var(--mf-text-secondary)" />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: "var(--mf-text)", fontWeight: 600 }}>{f.originalName}</div>
                                    <div style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>{f.fileType} • {f.fileSize ? Math.round(f.fileSize / 1024) + " KB" : ""}</div>
                                  </div>
                                  {f.filePath && (
                                    <button 
                                      onClick={() => setViewingSubmission({ url: f.filePath!, submissionId: submission.id })} 
                                      style={{ background: "rgba(255, 42, 109, 0.1)", border: "1px solid var(--mf-magenta)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--mf-magenta)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease" }}
                                      onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-magenta)"; e.currentTarget.style.color = "#000"; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 42, 109, 0.1)"; e.currentTarget.style.color = "var(--mf-magenta)"; }}
                                    >
                                      View
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {viewingSubmission && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", padding: 48, backdropFilter: "blur(5px)", gap: 24 }} onClick={() => setViewingSubmission(null)}>
          <button style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", transition: "all 0.2s ease", zIndex: 10 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onClick={() => setViewingSubmission(null)}>
            <X size={24} />
          </button>
          
          <div style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--mf-bg-surface)", borderRadius: 12, overflow: "hidden", position: "relative" }} onClick={e => e.stopPropagation()}>
            <img src={viewingSubmission.url} alt="Submission" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
          
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--mf-bg-surface)", borderRadius: 12, padding: 24, overflowY: "auto", border: "1px solid var(--mf-border)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 800 }}>Reviews</h2>
            
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {reviewsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <Loader2 size={24} color="var(--mf-magenta)" className="spinner" />
                </div>
              ) : reviews.length === 0 ? (
                <div style={{ fontSize: 14, color: "var(--mf-text-muted)", textAlign: "center", padding: 24 }}>No reviews yet.</div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} style={{ background: "var(--mf-bg-base)", padding: 16, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)" }}>{r.reviewerEmail || r.reviewerName || `User ${r.reviewerId}`}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: r.decision === "APPROVED" ? "var(--mf-green-dim)" : r.decision === "REJECTED" ? "var(--mf-magenta-dim)" : "var(--mf-orange-dim)", color: r.decision === "APPROVED" ? "var(--mf-green)" : r.decision === "REJECTED" ? "var(--mf-magenta)" : "var(--mf-orange)" }}>
                        {r.decision}
                      </span>
                    </div>
                    {r.comment && <div style={{ fontSize: 13, color: "var(--mf-text-muted)" }}>{r.comment}</div>}
                    <div style={{ fontSize: 10, color: "var(--mf-text-secondary)", marginTop: 8 }}>
                      {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : ""}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--mf-border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Post a Review</h3>
              
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6 }}>DECISION</label>
                <select 
                  value={newReviewDecision} 
                  onChange={e => setNewReviewDecision(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "var(--mf-bg-base)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", outline: "none" }}
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6 }}>NOTE</label>
                <textarea 
                  value={newReviewNote}
                  onChange={e => setNewReviewNote(e.target.value)}
                  placeholder="Enter your review notes..."
                  rows={4}
                  style={{ width: "100%", padding: "10px 14px", background: "var(--mf-bg-base)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", outline: "none", resize: "vertical" }}
                />
              </div>

              <button 
                onClick={() => void handlePostReview()}
                disabled={submittingReview}
                style={{ width: "100%", padding: "12px", background: "var(--mf-cyan)", color: "#000", fontWeight: 800, borderRadius: 8, border: "none", cursor: submittingReview ? "not-allowed" : "pointer", opacity: submittingReview ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
              >
                {submittingReview && <Loader2 size={16} className="mf-spin" />}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
      
      {submitTaskId && (
        <SubmitTaskModal 
          taskId={submitTaskId} 
          onClose={() => setSubmitTaskId(null)} 
          onSuccess={() => {
            setSubmitTaskId(null);
            // Optionally refresh tasks
          }} 
        />
      )}
    </>
  );
}

function SubmitTaskModal({ taskId, onClose, onSuccess }: { taskId: number, onClose: () => void, onSuccess: () => void }) {
  const [submissionType, setSubmissionType] = useState("TASK_LEVEL");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const account = tokenStorage.getAccount();
    if (!account?.id) {
      setError("Your session is unavailable. Please log in again.");
      return;
    }
    if (files.length === 0) {
      setError("Please upload at least one file.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitTask(taskId, {
        requesterId: account.id,
        submissionType,
        note: note.trim(),
        files
      });
      toast.success("Task submitted successfully!");
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "An error occurred during submission.");
      toast.error("Failed to submit task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 32px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--mf-cyan-dim)", border: "1px solid rgba(0,240,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-cyan)" }}>
              <Plus size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Submit Task</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Submit files for review</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 10, cursor: "pointer", color: "var(--mf-text-muted)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }} onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-magenta-dim)"; e.currentTarget.style.color = "var(--mf-magenta)"; e.currentTarget.style.borderColor = "rgba(255,42,122,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {error && <div style={{ padding: "12px 16px", background: "rgba(255,42,109,0.1)", border: "1px solid rgba(255,42,109,0.3)", color: "var(--mf-magenta)", borderRadius: 10, fontSize: 13, marginBottom: 20, fontWeight: 700 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>SUBMISSION TYPE</label>
              <select value={submissionType} onChange={e => setSubmissionType(e.target.value)} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, outline: "none" }}>
                <option value="ROUGH_SKETCH">ROUGH_SKETCH</option>
                <option value="REVISION">REVISION</option>
                <option value="FINAL">FINAL</option>
                <option value="TASK_LEVEL">TASK_LEVEL</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>NOTE (OPTIONAL)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes for the reviewer..." rows={3} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 500, lineHeight: 1.6, resize: "vertical", outline: "none" }} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>UPLOAD FILES</label>
              <div style={{ position: "relative" }}>
                <input type="file" multiple onChange={handleFileChange} id="task-file-upload" style={{ display: "none" }} />
                <label htmlFor="task-file-upload" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 16px", background: "rgba(255, 255, 255, 0.02)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 12, cursor: "pointer", transition: "all 0.15s ease" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--mf-cyan)"; e.currentTarget.style.background = "rgba(0,240,255,0.02)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)"; }}>
                  <FileText size={24} color="var(--mf-text-muted)" style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text-secondary)" }}>Choose Files</span>
                  <span style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>Image or storyboard files</span>
                </label>
              </div>

              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                      <FileText size={15} color="var(--mf-text-muted)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                        <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "var(--mf-magenta)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button type="button" onClick={onClose} style={{ padding: "10px 18px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "var(--mf-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}>Cancel</button>
              <button type="submit" disabled={isSubmitting} style={{ padding: "10px 22px", background: "var(--mf-cyan)", border: "none", borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? "Submitting..." : "Submit Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ScriptDrafts() {
  return (
    <EmptyState
      icon={FileText}
      title="No script drafts available"
      description="Script and character draft data will appear here after a real API-backed workflow is available."
    />
  );
}

function DelegationPanel({
  tasks,
  authenticatedAccountId,
}: {
  tasks: TaskApi[];
  authenticatedAccountId?: number;
}) {
  const [delegatedSubTasks, setDelegatedSubTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (tasks.length === 0 || !authenticatedAccountId) return;
    let active = true;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const { getSubTasksForTask } = await import("../../services/workflowApi");
        const listPromises = tasks.map(task =>
          getSubTasksForTask(task.id, authenticatedAccountId)
            .then((list: any[]) =>
              (list || []).map(st => ({
                ...st,
                parentTaskTitle: task.title,
                chapterTitle: task.chapterTitle,
              }))
            )
            .catch(() => [])
        );
        const results = await Promise.all(listPromises);
        if (active) {
          setDelegatedSubTasks(results.flat());
        }
      } catch (err) {
        console.error("Error loading delegated tasks", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchAll();

    return () => {
      active = false;
    };
  }, [tasks, authenticatedAccountId, refreshKey]);

  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Assistant Delegation</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Manage work assigned to your assistant team</p>
        </div>
        <button
          onClick={() => setShowDelegateModal(true)}
          style={{
            padding: "10px 18px",
            background: "var(--mf-magenta)",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 0 15px var(--mf-magenta-glow)",
          }}
        >
          <Plus size={15} /> Delegate Task
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ color: "var(--mf-text-muted)", textAlign: "center", padding: 36 }}>Loading delegated tasks...</div>
        ) : delegatedSubTasks.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No tasks delegated yet"
            description="Click 'Delegate Task' above to start assigning work to assistants."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {delegatedSubTasks.map(st => (
              <div key={st.id} style={{ padding: "18px 20px", background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-secondary)", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                    [{st.chapterTitle || "Chapter"}] SubTask of: {st.parentTaskTitle || "Parent Task"}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{st.title}</div>
                  <div style={{ fontSize: 13, color: "var(--mf-text-muted)" }}>Assigned to: <strong style={{ color: "var(--mf-cyan)" }}>{st.assigneeName || "Unknown Assistant"}</strong></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "var(--mf-text-muted)" }}>
                    {st.subtaskStatus || "CREATED"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mf-text-muted)" }}>
                    Due: {st.deadlineDate ? new Date(st.deadlineDate).toLocaleDateString() : "TBD"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDelegateModal && (
        <DelegateSubTaskModal
          tasks={tasks}
          onClose={() => setShowDelegateModal(false)}
          onSuccess={() => {
            setShowDelegateModal(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

function PageCompilation() {
  return (
    <EmptyState
      icon={Layers}
      title="No chapter compilation available"
      description="Page layers and chapter compilation status will appear here after they are backed by real Mangaka data."
    />
  );
}

function SubmittedChaptersList({
  submissions,
  loading,
  error,
  onSubmissionClick
}: {
  submissions: SubmissionApi[];
  loading: boolean;
  error: string | null;
  onSubmissionClick: (s: SubmissionApi) => void;
}) {
  if (loading) {
    return <div style={{ color: "var(--mf-text-muted)", textAlign: "center", padding: 36 }}>Loading submissions...</div>;
  }

  if (error && submissions.length === 0) {
    return <div style={{ color: "var(--mf-magenta)", padding: 18 }}>{error}</div>;
  }

  if (submissions.length === 0) {
    return <div style={{ color: "var(--mf-text-muted)", textAlign: "center", padding: 36 }}>No submissions yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {submissions.map(submission => {
        const rawStatus = submission.nameStatus || submission.status || "PENDING";
        const statusKey = rawStatus.toLowerCase();
        const status = chapterStatusMap[statusKey] || { label: rawStatus, color: "var(--mf-cyan)" };
        const fileLabel = typeof submission.fileCount === "number"
          ? `${submission.fileCount} file${submission.fileCount === 1 ? "" : "s"}`
          : "Files unavailable";

        return (
          <div
            key={submission.id}
            onClick={() => onSubmissionClick(submission)}
            style={{ padding: "18px 20px", background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 20, cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s", ...{ ":hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transform: "translateY(-2px)" } } }}
          >
            <div style={{ width: 56, height: 70, borderRadius: 8, background: "linear-gradient(160deg, var(--mf-magenta-dim), var(--mf-bg-deep))", border: "1px solid var(--mf-magenta)30", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={22} color="var(--mf-magenta)" style={{ opacity: 0.7 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--mf-text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {submissionTitle(submission)}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--mf-text-muted)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {formatSubmissionDate(submission.submittedAt)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FileText size={11} /> {fileLabel}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} /> {submission.submittedByName || "Me"}</span>
              </div>
            </div>
            <div style={{ padding: "6px 14px", background: `${status.color}18`, border: `1px solid ${status.color}40`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: status.color, flexShrink: 0 }}>
              {status.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmitIdeaModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (submission: SubmissionApi) => void;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const account = tokenStorage.getAccount();
    if (account?.id === null || account?.id === undefined) {
      setError("Your session is unavailable. Please log in again.");
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      setError("Please enter a title (at least 3 characters).");
      return;
    }
    if (files.length === 0) {
      setError("Please upload at least one file.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (note.trim()) {
        formData.append("note", note.trim());
      }
      files.forEach(file => {
        formData.append("files", file);
      });

      const createdSubmission = await submitIdea(account.id, formData);
      toast.success("Submission successfully uploaded!");
      onSuccess(createdSubmission);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err && typeof err.message === "string"
        ? err.message
        : "An error occurred during submission.";
      setError(message);
      toast.error("Failed to submit idea.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
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
              background: "var(--mf-magenta-dim)",
              border: "1px solid rgba(255,42,122,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--mf-magenta)", flexShrink: 0
            }}>
              <Plus size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Submit New Project</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
                Upload details and files for your new idea
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
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
            onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-magenta-dim)"; e.currentTarget.style.color = "var(--mf-magenta)"; e.currentTarget.style.borderColor = "rgba(255,42,122,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(255,42,109,0.1)",
              border: "1px solid rgba(255,42,109,0.3)",
              color: "var(--mf-magenta)",
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 20,
              fontWeight: 700
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title Input */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>TITLE</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Project title"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  outline: "none",
                  transition: "border-color 0.15s ease"
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-magenta)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {/* Synopsis Input */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>SYNOPSIS</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Synopsis for the editor..."
                rows={3}
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
                  transition: "border-color 0.15s ease"
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-magenta)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {/* Custom Premium File Upload Card */}
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>UPLOAD FILES</label>
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  id="idea-file-upload"
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="idea-file-upload"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "28px 16px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--mf-magenta)"; e.currentTarget.style.background = "rgba(255,42,122,0.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)"; }}
                >
                  <FileText size={24} color="var(--mf-text-muted)" style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text-secondary)" }}>Choose Files</span>
                  <span style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>Image or storyboard files</span>
                </label>
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 10
                    }}>
                      <FileText size={15} color="var(--mf-text-muted)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                        <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--mf-magenta)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "var(--mf-text)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "10px 22px",
                  background: "var(--mf-magenta)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: "0 0 15px var(--mf-magenta-glow)",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SubmissionDetailsModal({
  submission,
  reviews = [],
  onClose
}: {
  submission: SubmissionApi;
  reviews?: SubmissionReviewApi[];
  onClose: () => void;
}) {
  const [details, setDetails] = useState<SubmissionApi | null>(null);

  useEffect(() => {
    let active = true;
    getSubmissionById(submission.id)
      .then((data: any) => {
        if (active && data) {
          setDetails(data);
        }
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [submission.id]);

  const activeSubmission = details || submission;
  const rawStatus = activeSubmission.nameStatus || activeSubmission.status || "PENDING";
  const statusKey = rawStatus.toLowerCase();
  const status = chapterStatusMap[statusKey] || { label: rawStatus, color: "var(--mf-cyan)" };
  const files = activeSubmission.files || [];
  const isImageFile = (file: any) => {
    const name = (file.originalName || file.originalFilename || file.fileName || file.filename || "").toLowerCase();
    return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".webp");
  };
  const getFilePath = (file: any) => {
    return file.url || file.fileUrl || file.path || file.filePath || null;
  };

  const firstImageFile = files.find(isImageFile);
  const thumbnailSrc = firstImageFile ? getFilePath(firstImageFile) : null;
  const firstImageName = firstImageFile ? (firstImageFile.originalName || firstImageFile.originalFilename || firstImageFile.fileName || firstImageFile.filename || "Preview Image") : "";
  const firstImageSize = firstImageFile ? (typeof firstImageFile.size === "number" ? firstImageFile.size : firstImageFile.fileSize) : 0;
  const firstImageSizeStr = firstImageSize ? `${(firstImageSize / 1024).toFixed(1)} KB` : "";

  const allReviews: SubmissionReviewApi[] = (details?.reviews as any[]) || activeSubmission.reviews || reviews || [];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: thumbnailSrc ? 800 : 520, boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
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
              background: "var(--mf-magenta-dim)",
              border: "1px solid rgba(255,42,122,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--mf-magenta)", flexShrink: 0
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>{submissionTitle(activeSubmission)}</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <User size={13} color="var(--mf-text-muted)" /> {activeSubmission.submittedByName || "Unknown"}
                <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                <Clock size={13} color="var(--mf-text-muted)" /> {formatSubmissionDate(activeSubmission.submittedAt)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
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
            onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-magenta-dim)"; e.currentTarget.style.color = "var(--mf-magenta)"; e.currentTarget.style.borderColor = "rgba(255,42,122,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "28px 32px 32px", display: "flex", gap: 28, flexDirection: "row", flexWrap: "wrap" }}>
          {/* Left Column - Details */}
          <div style={{
            width: thumbnailSrc ? 460 : 456,
            borderRight: thumbnailSrc ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            paddingRight: thumbnailSrc ? 28 : 0,
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}>

            {/* Status Card (Now on top, full width) */}
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>STATUS</div>
              <div style={{
                alignSelf: "flex-start",
                background: `${status.color}15`,
                border: `1px solid ${status.color}30`,
                color: status.color,
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 900,
                textAlign: "center"
              }}>
                {status.label}
              </div>
            </div>

            {/* Date Card (Now below, full width) */}
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 12,
              padding: "16px 20px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>DATE</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={14} color="var(--mf-text-muted)" />
                {formatSubmissionDate(activeSubmission.submittedAt)}
              </div>
            </div>

            {/* Synopsis Card */}
            {(activeSubmission.note || activeSubmission.description) && (
              <div style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: "16px 20px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>SYNOPSIS</div>
                <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>
                  {activeSubmission.note || activeSubmission.description}
                </div>
              </div>
            )}

            {/* Reviews & Feedback List Card */}
            {allReviews.length > 0 && (
              <div style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em" }}>REVIEWS & FEEDBACK ({allReviews.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {allReviews.map((r, idx) => {
                    const dec = (r.decision || "").toUpperCase();
                    const color = dec === "APPROVED" ? "var(--mf-green)" : dec === "REJECTED" ? "var(--mf-red)" : "var(--mf-orange)";
                    const reviewerName = r.reviewerName || r.reviewerEmail || (r.reviewerId ? `Reviewer #${r.reviewerId}` : "Reviewer");
                    return (
                      <div key={r.id || idx} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{reviewerName}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: `${color}20`, color, border: `1px solid ${color}40` }}>
                            {r.decision || "REVIEWED"}
                          </span>
                        </div>
                        {r.comment && (
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                            {r.comment}
                          </div>
                        )}
                        {r.reviewedAt && (
                          <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 6 }}>
                            {formatSubmissionDate(r.reviewedAt)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Attached Files & Preview */}
          {files.length > 0 && (
            <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.05em" }}>UPLOADED FILES ({files.length})</div>

              {/* Thumbnail Container card wrapper */}
              {thumbnailSrc ? (
                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}>
                  <div style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    background: "rgba(0,0,0,0.3)",
                    overflow: "hidden",
                    position: "relative",
                    aspectRatio: "3/4",
                    maxHeight: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <img
                      src={thumbnailSrc}
                      alt="Submission preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <a href={thumbnailSrc} target="_blank" rel="noreferrer"
                      style={{
                        position: "absolute", bottom: 10, right: 10,
                        width: 32, height: 32, borderRadius: "50%",
                        background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", textDecoration: "none"
                      }}
                    >
                      <ArrowUpRight size={15} />
                    </a>
                  </div>

                  {/* Thumbnail Info */}
                  <div style={{ padding: "0 2px 2px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={firstImageName}>
                      {firstImageName}
                    </div>
                    {firstImageSizeStr && (
                      <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>
                        {firstImageSizeStr} · {firstImageName.split(".").pop()?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}              {/* Other Files list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {files.filter(f => !thumbnailSrc || f !== firstImageFile).map((file, idx) => {
                  const name = file.originalName || file.originalFilename || file.fileName || file.filename || "Unknown file";
                  const size = typeof file.size === "number" ? file.size : file.fileSize;
                  const sizeStr = size ? `${(size / 1024).toFixed(1)} KB` : "";
                  const path = getFilePath(file);
                  return (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10
                    }}>
                      <FileText size={15} color="var(--mf-text-muted)" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                        {sizeStr && <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>{sizeStr}</div>}
                      </div>
                      {path && (
                        <a href={path} target="_blank" rel="noreferrer" style={{ color: "var(--mf-text-muted)", display: "flex", alignItems: "center" }}>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitView({
  submissions,
  reviews = [],
  loading,
  error,
  onRefreshRequested,
}: {
  submissions: SubmissionApi[];
  reviews?: SubmissionReviewApi[];
  loading: boolean;
  error: string | null;
  onRefreshRequested: () => void;
}) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionApi | null>(null);
  const [showSuccessConfirmation, setShowSuccessConfirmation] = useState(false);

  const openSubmitModal = () => {
    setShowSuccessConfirmation(false);
    setShowSubmitModal(true);
  };

  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Submissions</h2>
        <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Manage your submissions and new ideas</p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--mf-border)", paddingBottom: 10 }}>
        <button
          style={{
            padding: "8px 16px",
            background: "var(--mf-bg-elevated)",
            border: "1px solid var(--mf-border-bright)",
            borderRadius: 8,
            color: "var(--mf-text)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "default",
          }}
        >
          Submitted
        </button>
        <button
          onClick={openSubmitModal}
          style={{
            padding: "10px 18px",
            background: "var(--mf-magenta)",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 0 15px var(--mf-magenta-glow)",
          }}
        >
          <Plus size={15} /> Submit Idea
        </button>
      </div>

      {showSuccessConfirmation && (
        <div style={{ marginBottom: 18, padding: "13px 16px", background: "var(--mf-green-dim)", border: "1px solid var(--mf-green)40", borderRadius: 10, color: "var(--mf-green)", fontSize: 13, fontWeight: 700 }}>
          Submitted successfully. Your idea has been sent to the editor.
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        <SubmittedChaptersList
          submissions={submissions}
          loading={loading}
          error={error}
          onSubmissionClick={setSelectedSubmission}
        />
      </div>

      {showSubmitModal && (
        <SubmitIdeaModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => {
            setShowSuccessConfirmation(true);
            setShowSubmitModal(false);
            onRefreshRequested();
          }}
        />
      )}

      {selectedSubmission && (
        <SubmissionDetailsModal
          submission={selectedSubmission}
          reviews={reviews.filter(r => Number(r.submissionId) === Number(selectedSubmission.id))}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}

export function MangakaStudio() {
  const [activeNav, setActiveNav] = useState("My Chapters");
  const [refreshKey, setRefreshKey] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [allReviews, setAllReviews] = useState<any[]>([]);

  const account = tokenStorage.getAccount();
  const authenticatedAccountId = account?.id;

  useEffect(() => {
    if (authenticatedAccountId === undefined) {
      return;
    }

    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return { rows: [], reviews: [] };
        setSubmissions([]);
        setSubmissionsError(null);
        setSubmissionsLoading(true);
        return Promise.all([
          getMangakaSubmissions(authenticatedAccountId),
          import("../../services/workflowApi").then(m => m.getSubmissionReviews())
        ]).then(([rows, reviews]) => ({ rows, reviews }));
      })
      .then(({ rows, reviews }) => {
        if (!cancelled) {
          setAllReviews(reviews);
          const reviewMap = new Map<number, number>();
          for (const r of reviews) {
            if (r.decision === "REJECTED" || r.decision === "REJECT") {
              const subId = Number(r.submissionId);
              reviewMap.set(subId, (reviewMap.get(subId) || 0) + 1);
            }
          }
          const updatedRows = rows.map(s => {
            const rejectCount = reviewMap.get(s.id) || 0;
            if (rejectCount >= 2 && s.status !== "APPROVED") {
              return { ...s, status: "REJECTED" };
            }
            return s;
          });
          setSubmissions(updatedRows);
          setSubmissionsError(null);
        }
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setSubmissionsError(err.message || "Failed to load submissions.");
      })
      .finally(() => {
        if (!cancelled) setSubmissionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticatedAccountId, refreshKey]);

  const [tasks, setTasks] = useState<any[]>([]);
  const [assignedProjectIds, setAssignedProjectIds] = useState<Set<number>>(new Set());
  const [activeTasks, setActiveTasks] = useState<ActiveTaskApi[]>([]);
  const [activeTasksLoading, setActiveTasksLoading] = useState(false);

  useEffect(() => {
    if (authenticatedAccountId !== undefined) {
      setActiveTasksLoading(true);
      getMangakaActiveTasks(authenticatedAccountId)
        .then(res => setActiveTasks(res))
        .catch(console.error)
        .finally(() => setActiveTasksLoading(false));
    }
  }, [authenticatedAccountId, refreshKey]);

  useEffect(() => {
    if (authenticatedAccountId === undefined) return;

    const projectIds = new Set<number>();
    submissions.forEach(submission => {
      if (typeof submission.project?.id === "number") projectIds.add(submission.project.id);
    });
    try {
      const cachedStr = window.localStorage.getItem("project_mangaka_assignments") || "{}";
      const cached = JSON.parse(cachedStr);
      for (const [pId, assignment] of Object.entries(cached)) {
        if ((assignment as any).id === authenticatedAccountId) projectIds.add(Number(pId));
      }
    } catch (e) { }

    getChapters().then(allChapters => {
      const myTasks: any[] = [];

      allChapters.forEach(ch => {
        if (ch.ownerId === authenticatedAccountId && ch.projectId) {
          projectIds.add(ch.projectId);
        }
      });

      allChapters.forEach(ch => {
        if (ch.projectId && projectIds.has(ch.projectId)) {
          if (ch.tasks) {
            ch.tasks.forEach(t => {
              myTasks.push({ ...t, chapterTitle: ch.title || `Chapter ${ch.chapterNumber}` });
            });
          }
        }
      });
      setAssignedProjectIds(projectIds);
      setTasks(myTasks);
    }).catch(console.error);
  }, [submissions, authenticatedAccountId]);

  const projectCount = assignedProjectIds.size;
  const taskCount = activeTasks.length;

  const navBadges = useMemo<Record<string, number>>(() => ({
    "My Series": projectCount,
    "Active Tasks": taskCount,
  }), [projectCount, taskCount]);

  const hasAuthenticatedAccount = authenticatedAccountId !== undefined;
  const submissionsViewError = hasAuthenticatedAccount
    ? submissionsError
    : "Your session is unavailable. Please log in again.";
  const submissionsForView = hasAuthenticatedAccount ? submissions : [];

  return (
    <AppLayout role="mangaka" activeNav={activeNav} onNavClick={setActiveNav} navBadges={navBadges}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "14px 28px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)40", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brush size={17} color="var(--mf-magenta)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>Mangaka Workspace</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeNav === "My Chapters" && <MangakaMyChapters />}
          {activeNav === "Submission History" && (
            <SubmitView
              submissions={submissionsForView}
              reviews={allReviews}
              loading={hasAuthenticatedAccount && submissionsLoading}
              error={submissionsViewError}
              onRefreshRequested={() => setRefreshKey(previous => previous + 1)}
            />
          )}
          {activeNav === "Active Tasks" && <MangakaTasks tasks={activeTasks} loading={activeTasksLoading} authenticatedAccountId={authenticatedAccountId} />}
          {activeNav === "Drafts & Storyboards" && <ScriptDrafts />}
          {activeNav === "My Series" && <DelegationPanel tasks={tasks} authenticatedAccountId={authenticatedAccountId} />}
          {activeNav === "Compile Chapter" && <PageCompilation />}
        </div>
      </div>
    </AppLayout>
  );
}
