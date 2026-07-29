import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import { getMangakaSubmissions, getChapters, type SubmissionApi, type ChapterApi, type TaskApi, submitIdea } from "../../services/workflowApi";
import { tokenStorage } from "../../storage/tokenStorage";

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

function MangakaTasks({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No tasks assigned"
        description="When your Tantou assigns you a chapter, tasks will appear here."
      />
    );
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {tasks.map(t => (
        <div key={t.id} style={{ padding: 16, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "var(--mf-text-secondary)", fontWeight: 700 }}>{t.chapterTitle}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--mf-cyan)", background: "var(--mf-cyan-dim)", padding: "4px 8px", borderRadius: 4 }}>
              {t.status}
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{t.title}</div>
          {t.description && <div style={{ fontSize: 13, color: "var(--mf-text-muted)" }}>{t.description}</div>}
        </div>
      ))}
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

function DelegationPanel() {
  return (
    <EmptyState
      icon={Users}
      title="No delegation workflow available"
      description="Assistant delegation is hidden until assignments, assignees, task tags, and persistence are provided by the API."
    />
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
        const rawStatus = submission.status || "PENDING";
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
        borderRadius: 16, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Submit New Project</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {error && <div style={{ padding: "10px 14px", background: "rgba(255,42,109,0.1)", border: "1px solid var(--mf-magenta)50", color: "var(--mf-magenta)", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--mf-text-muted)", marginBottom: 6 }}>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title" style={{ width: "100%", padding: "10px 14px", background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 14 }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--mf-text-muted)", marginBottom: 6 }}>Synopsis</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Synopsis for the editor..." rows={3} style={{ width: "100%", padding: "10px 14px", background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 14, resize: "vertical" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--mf-text-muted)", marginBottom: 6 }}>Files</label>
            <input type="file" multiple onChange={handleFileChange} style={{ width: "100%", padding: "10px 14px", background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13 }} />
            {files.length > 0 && <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 6 }}>{files.length} file(s) selected</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: "10px 20px", background: "var(--mf-magenta)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 800, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmissionDetailsModal({
  submission,
  onClose
}: {
  submission: SubmissionApi;
  onClose: () => void;
}) {
  const rawStatus = submission.status || "PENDING";
  const statusKey = rawStatus.toLowerCase();
  const status = chapterStatusMap[statusKey] || { label: rawStatus, color: "var(--mf-cyan)" };
  const files = submission.files || [];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: 600, boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mf-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{submissionTitle(submission)}</div>
            <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Submission Details</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: "12px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 4 }}>STATUS</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: status.color }}>{status.label}</div>
            </div>
            <div style={{ padding: "12px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 4 }}>DATE SUBMITTED</div>
              <div style={{ fontSize: 13 }}>{formatSubmissionDate(submission.submittedAt)}</div>
            </div>
          </div>

          {(submission.note || submission.description) && (
            <div style={{ padding: "12px", background: "var(--mf-bg-deep)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6 }}>SYNOPSIS / NOTE</div>
              <div style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.5 }}>
                {submission.note || submission.description}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8 }}>ATTACHED FILES ({files.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {files.map((file, idx) => {
                  const name = file.originalName || file.originalFilename || file.fileName || file.filename || "Unknown file";
                  const size = typeof file.size === "number" ? file.size : file.fileSize;
                  const sizeStr = size ? `${(size / 1024).toFixed(1)} KB` : "";
                  return (
                    <div key={idx} style={{ padding: "10px 14px", background: "var(--mf-bg-deep)", border: "1px solid var(--mf-border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
                      <FileText size={16} color="var(--mf-cyan)" />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                        {sizeStr && <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>{sizeStr}</div>}
                      </div>
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
  loading,
  error,
  onRefreshRequested,
}: {
  submissions: SubmissionApi[];
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
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}

const tabs = [
  { id: "schedule", label: "Production Schedule", icon: Calendar },
  { id: "script", label: "Script Drafts", icon: FileText },
  { id: "delegate", label: "Delegate Work", icon: Users },
  { id: "compile", label: "Compile Chapter", icon: Layers },
];

export function MangakaStudio() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeNav, setActiveNav] = useState("My Projects");
  const [refreshKey, setRefreshKey] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

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

  useEffect(() => {
    if (authenticatedAccountId === undefined) return;

    // First, collect project IDs that belong to this Mangaka
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

    // Fetch chapters and extract tasks for those projects
    getChapters().then(allChapters => {
      const myTasks: any[] = [];
      allChapters.forEach(ch => {
        if (ch.projectId && projectIds.has(ch.projectId)) {
          if (ch.tasks) {
            ch.tasks.forEach(t => {
              myTasks.push({ ...t, chapterTitle: ch.title || `Chapter ${ch.chapterNumber}` });
            });
          }
        }
      });
      setTasks(myTasks);
    }).catch(console.error);
  }, [submissions, authenticatedAccountId]);

  const projectCount = useMemo(() => {
    const projectIds = new Set<number>();
    submissions.forEach(submission => {
      if (typeof submission.project?.id === "number") {
        projectIds.add(submission.project.id);
      }
    });
    return projectIds.size;
  }, [submissions]);

  const taskCount = tasks.length;

  const navBadges = useMemo<Record<string, number>>(() => ({
    "My Projects": projectCount,
    "Tasks": taskCount,
  }), [projectCount, taskCount]);

  const hasAuthenticatedAccount = authenticatedAccountId !== undefined;
  const submissionsViewError = hasAuthenticatedAccount
    ? submissionsError
    : "Your session is unavailable. Please log in again.";
  const submissionsForView = hasAuthenticatedAccount ? submissions : [];

  const handleNavClick = (label: string) => {
    setActiveNav(label);
    if (label === "My Projects") setActiveTab("schedule");
    else if (label === "Tasks") setActiveTab("schedule");
    else if (label === "Script Drafts") setActiveTab("script");
  };

  return (
    <AppLayout role="mangaka" activeNav={activeNav} onNavClick={handleNavClick} navBadges={navBadges}>
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

        <div style={{ display: "flex", gap: 2, padding: "10px 28px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", flexShrink: 0, overflowX: "auto" }}>
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <div key={tab.id} style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
                    background: active ? "var(--mf-magenta-dim)" : "transparent",
                    border: active ? "1px solid var(--mf-magenta)40" : "1px solid transparent",
                    borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap",
                    color: active ? "var(--mf-magenta)" : "var(--mf-text-muted)",
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span style={{ fontSize: 10, color: active ? "var(--mf-magenta)" : "var(--mf-text-muted)", fontWeight: 700 }}>
                    {index + 1}/4
                  </span>
                </button>
                {index < tabs.length - 1 && <ChevronRight size={13} color="var(--mf-text-muted)" style={{ margin: "0 2px", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeNav === "Submissions" ? (
            <SubmitView
              submissions={submissionsForView}
              loading={hasAuthenticatedAccount && submissionsLoading}
              error={submissionsViewError}
              onRefreshRequested={() => setRefreshKey(previous => previous + 1)}
            />
          ) : (
            <>
              {activeTab === "schedule" && <MangakaTasks tasks={tasks} />}
              {activeTab === "script" && <ScriptDrafts />}
              {activeTab === "delegate" && <DelegationPanel />}
              {activeTab === "compile" && <PageCompilation />}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
