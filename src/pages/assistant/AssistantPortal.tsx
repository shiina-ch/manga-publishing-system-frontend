import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  ClipboardList, CheckCircle, AlertTriangle, Send,
  FileText, Upload, Link as LinkIcon, Image as ImageIcon,
  Clock, User, X, Sparkles, CheckSquare, Layers, Folder,
  ShieldCheck, RefreshCw, File as FileIcon
} from "lucide-react";
import {
  getAssignedSubTasks,
  submitSubTask,
  taskToAssistantTask,
  type AssistantTask
} from "../../services/workflowApi";
import { tokenStorage } from "../../storage/tokenStorage";

const tagColor: Record<string, string> = {
  "Background Art": "var(--mf-cyan)",
  "Coloring": "var(--mf-magenta)",
  "Screentone": "var(--mf-orange)",
  "Effects": "var(--mf-green)",
  "Production": "var(--mf-cyan)",
};

const priorityColor: Record<string, string> = {
  high: "var(--mf-magenta)",
  medium: "var(--mf-orange)",
  low: "var(--mf-text-muted)",
};

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "In Progress", color: "var(--mf-cyan)" },
  in_progress: { label: "In Progress", color: "var(--mf-cyan)" },
  pending: { label: "Pending", color: "var(--mf-text-muted)" },
  submitted: { label: "Submitted", color: "var(--mf-green)" },
  todo: { label: "To Do", color: "var(--mf-text-muted)" },
  review: { label: "Review", color: "var(--mf-orange)" },
  done: { label: "Done", color: "var(--mf-green)" },
};

export function AssistantPortal() {
  const [activeNav, setActiveNav] = useState("My Task");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [allTasks, setAllTasks] = useState<AssistantTask[]>([]);
  const [submittedTasks, setSubmittedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form submission state
  const [submitNote, setSubmitNote] = useState("");
  const [submissionType, setSubmissionType] = useState("FINAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    const account = tokenStorage.getAccount();
    if (!account || !account.id) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    try {
      const tasks = await getAssignedSubTasks(account.id);
      const mapped = tasks.map(taskToAssistantTask);
      setAllTasks(mapped);

      // Track already submitted tasks
      const submittedIds = new Set<number>();
      mapped.forEach(t => {
        if (t.status === "submitted" || t.status === "completed") {
          submittedIds.add(t.id);
        }
      });
      setSubmittedTasks(submittedIds);

      if (mapped.length > 0 && selectedTaskId === null) {
        setSelectedTaskId(mapped[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load assigned sub-tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, []);

  const activeTask = allTasks.find(t => t.id === selectedTaskId) || null;

  // Reset form when active task changes
  useEffect(() => {
    setSubmitNote("");
    setSubmissionType("FINAL");
    setSelectedFile(null);
    setFilePreview(null);
  }, [selectedTaskId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    
    const account = tokenStorage.getAccount();
    if (!account || !account.id) {
      toast.error("User not logged in");
      return;
    }

    if (!selectedFile && !submitNote.trim()) {
      toast.error("Please attach a file or add submission notes.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSubTask(activeTask.id, {
        requesterId: account.id,
        note: submitNote,
        files: selectedFile ? [selectedFile] : [],
      });

      toast.success(`Sub-task "${activeTask.label}" submitted successfully!`);
      setSubmittedTasks(prev => new Set([...prev, activeTask.id]));
      setAllTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: "submitted" } : t));
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit work.");
    } finally {
      setSubmitting(false);
    }
  };

  const navBadges = {
    "My Task": allTasks.length,
  };

  return (
    <AppLayout role="assistant" activeNav="My Task" onNavClick={(label) => setActiveNav(label)} navBadges={navBadges}>
      <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--mf-bg-deep)" }}>

        {/* Left Column: Sub-task List */}
        <div style={{
          width: 320,
          flexShrink: 0,
          borderRight: "1px solid var(--mf-border)",
          background: "var(--mf-bg-base)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* List Header */}
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid var(--mf-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
                <ClipboardList size={18} color="var(--mf-green)" />
                My Task
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 800, color: "var(--mf-green)",
                background: "var(--mf-green-dim)", padding: "2px 10px", borderRadius: 10,
                border: "1px solid rgba(57, 255, 138, 0.3)"
              }}>
                {allTasks.length} {allTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--mf-text-muted)" }}>Assigned sub-tasks from Mangaka</p>
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mf-text-muted)", fontSize: 13 }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 10px", display: "block" }} />
                Loading assigned sub-tasks...
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mf-magenta)", fontSize: 13 }}>
                <AlertTriangle size={24} style={{ margin: "0 auto 8px", display: "block" }} />
                {error}
              </div>
            ) : allTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mf-text-muted)", fontSize: 13 }}>
                <CheckSquare size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.5 }} />
                No sub-tasks assigned yet.
              </div>
            ) : (
              allTasks.map(task => {
                const isSubmitted = submittedTasks.has(task.id) || task.status === "submitted";
                const isSelected = selectedTaskId === task.id;
                const statusInfo = isSubmitted ? { label: "Submitted", color: "var(--mf-green)" } : (statusMap[task.status] || statusMap.pending);

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTaskId(task.id)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setSelectedTaskId(task.id); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "16px",
                      marginBottom: 10,
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(57, 255, 138, 0.1), rgba(57, 255, 138, 0.02))"
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isSelected ? "rgba(57, 255, 138, 0.4)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: isSelected ? "0 8px 24px rgba(57, 255, 138, 0.08)" : "none"
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, width: 4, height: "100%",
                        background: "var(--mf-green)",
                        boxShadow: "0 0 10px var(--mf-green)"
                      }} />
                    )}

                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.4, flex: 1 }}>
                        {task.label}
                      </span>
                      <div
                        title={`Priority: ${task.priority}`}
                        style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: priorityColor[task.priority] || priorityColor.low,
                          flexShrink: 0, marginTop: 4,
                          boxShadow: `0 0 8px ${priorityColor[task.priority] || priorityColor.low}`
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={12} />
                      Page {task.page} · Due {task.due}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {task.tags.map(tag => (
                        <span key={tag} style={{
                          padding: "2px 8px",
                          background: `${tagColor[tag] || "rgba(255,255,255,0.5)"}15`,
                          border: `1px solid ${tagColor[tag] || "rgba(255,255,255,0.5)"}30`,
                          borderRadius: 100,
                          fontSize: 10,
                          color: tagColor[tag] || "rgba(255,255,255,0.7)",
                          fontWeight: 700,
                        }}>
                          {tag}
                        </span>
                      ))}
                      <span style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: statusInfo.color,
                        fontWeight: 800,
                        background: `${statusInfo.color}15`,
                        padding: "2px 8px",
                        borderRadius: 100,
                        border: `1px solid ${statusInfo.color}30`
                      }}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Work & Task Submission Workspace */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "28px 36px", gap: 24 }}>
          {activeTask ? (
            <>
              {/* Task Header Banner */}
              <div style={{
                background: "linear-gradient(135deg, rgba(57,255,138,0.08) 0%, rgba(0,240,255,0.03) 100%)",
                border: "1px solid rgba(57, 255, 138, 0.2)",
                borderRadius: 18,
                padding: "22px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
                boxShadow: "0 12px 30px rgba(0,0,0,0.2)"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: "var(--mf-green)",
                      background: "var(--mf-green-dim)", padding: "3px 10px", borderRadius: 100,
                      border: "1px solid rgba(57,255,138,0.3)", letterSpacing: "0.04em"
                    }}>
                      Sub-task #{activeTask.id}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", margin: 0 }}>
                    {activeTask.label}
                  </h1>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {(() => {
                    const isSubmitted = submittedTasks.has(activeTask.id) || activeTask.status === "submitted";
                    const statusInfo = isSubmitted ? { label: "Submitted", color: "var(--mf-green)" } : (statusMap[activeTask.status] || statusMap.pending);
                    
                    return (
                      <div style={{
                        padding: "8px 16px", borderRadius: 100, background: `${statusInfo.color}15`,
                        border: `1px solid ${statusInfo.color}40`, color: statusInfo.color,
                        fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8
                      }}>
                        {isSubmitted ? <ShieldCheck size={16} /> : <Clock size={16} />}
                        {statusInfo.label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Task Details Card */}
              <div style={{
                background: "var(--mf-bg-surface)",
                border: "1px solid var(--mf-border)",
                borderRadius: 18,
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 18
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={14} color="var(--mf-cyan)" />
                  Task Information & Instructions
                </div>

                {/* Info Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 4 }}>Deadline / Due Date</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mf-orange)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} />
                      {activeTask.due || "No Deadline Set"}
                    </div>
                  </div>
                </div>

                {/* Description Box */}
                {activeTask.description && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                      Mangaka Notes / Instructions:
                    </div>
                    <div style={{
                      padding: "16px 18px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.85)",
                      whiteSpace: "pre-wrap"
                    }}>
                      {activeTask.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Work Submission Panel */}
              <div style={{
                background: "var(--mf-bg-surface)",
                border: "1px solid var(--mf-border)",
                borderRadius: 18,
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 20
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 8 }}>
                    <Send size={16} color="var(--mf-green)" />
                    Submit Your Finished Work
                  </div>
                  {submittedTasks.has(activeTask.id) && (
                    <span style={{ fontSize: 11, color: "var(--mf-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={13} /> You can resubmit or update your work below
                    </span>
                  )}
                </div>

                <form onSubmit={handleWorkSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* Drag & Drop File Upload Area */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.06em" }}>
                      ATTACH WORK FILE (.PNG, .JPG, .PSD, .CLIP, .ZIP, .PDF)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.psd,.clip,.zip,.pdf"
                      style={{ display: "none" }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "28px 20px",
                        border: "2px dashed rgba(57, 255, 138, 0.3)",
                        borderRadius: 14,
                        background: "rgba(57, 255, 138, 0.02)",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--mf-green)";
                        e.currentTarget.style.background = "rgba(57, 255, 138, 0.05)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "rgba(57, 255, 138, 0.3)";
                        e.currentTarget.style.background = "rgba(57, 255, 138, 0.02)";
                      }}
                    >
                      <Upload size={28} color="var(--mf-green)" style={{ margin: "0 auto 10px", display: "block" }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {selectedFile ? selectedFile.name : "Click or drag & drop to upload artwork file"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>
                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Supports PNG, JPG, PSD, CLIP, ZIP up to 50MB"}
                      </div>
                    </div>

                    {/* Image Thumbnail Preview */}
                    {filePreview && (
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.4)", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={filePreview} alt="Preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedFile?.name}</div>
                          <div style={{ fontSize: 10, color: "var(--mf-green)" }}>Ready to submit</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                          style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, color: "var(--mf-text-muted)", cursor: "pointer", padding: 6 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submission Type Selection */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.06em" }}>
                      SUBMISSION TYPE
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={submissionType}
                        onChange={e => setSubmissionType(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 10,
                          color: "#fff",
                          fontSize: 13,
                          outline: "none",
                          appearance: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="ROUGH_SKETCH" style={{ background: "var(--mf-bg-base)", color: "#fff" }}>Rough Sketch</option>
                        <option value="REVISION" style={{ background: "var(--mf-bg-base)", color: "#fff" }}>Revision</option>
                        <option value="FINAL" style={{ background: "var(--mf-bg-base)", color: "#fff" }}>Final</option>
                        <option value="TASK_LEVEL" style={{ background: "var(--mf-bg-base)", color: "#fff" }}>Task Level</option>
                      </select>
                      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--mf-text-muted)" }}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Submission Notes Textarea */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.06em" }}>
                      SUBMISSION REMARKS / NOTES FOR MANGAKA
                    </label>
                    <textarea
                      value={submitNote}
                      onChange={e => setSubmitNote(e.target.value)}
                      placeholder="Add details for the Mangaka (e.g. Finished line art for background buildings, added atmospheric fog on separate layer...)"
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Action Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "linear-gradient(135deg, var(--mf-green) 0%, #00E6B4 100%)",
                      border: "none",
                      borderRadius: 12,
                      color: "#000",
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: submitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      letterSpacing: "0.04em",
                      boxShadow: "0 0 25px rgba(57, 255, 138, 0.35)",
                      transition: "all 0.2s ease",
                      opacity: submitting ? 0.7 : 1
                    }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Submitting Work...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> SUBMIT TASK WORK
                      </>
                    )}
                  </button>

                  <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={13} color="var(--mf-orange)" />
                    <span style={{ fontSize: 11, color: "var(--mf-text-muted)", lineHeight: 1.4 }}>
                      Submitting work will notify the Mangaka and update your sub-task status in the project workspace.
                    </span>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "var(--mf-text-muted)"
            }}>
              <ClipboardList size={48} color="var(--mf-green)" style={{ marginBottom: 16, opacity: 0.6 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>No Task Selected</h3>
              <p style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5 }}>
                Select an assigned sub-task from the left list to view instructions and submit your completed work.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
