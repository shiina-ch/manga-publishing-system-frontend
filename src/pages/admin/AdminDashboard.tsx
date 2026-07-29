import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  Users, BookOpen, Clock, CheckCircle, AlertTriangle, XCircle,
  Eye, RefreshCw, UserPlus, FileText,
  Shield, Activity, TrendingUp,
  Search, Inbox,
  Globe, CheckSquare, Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAllAccounts, activateAccount, deactivateAccount, type AdminAccount } from "../../services/adminApi";
import {
  getChapters, getSubmissions, getWorkflowSubmissions, getSubmissionReviews, getVotes,
  getTasks, getSketchTasks, getSketchPages, getPlannings, getSubTasksForTask,
  type ChapterApi, type SubmissionApi, type SubmissionReviewApi, type VoteApi,
  type TaskApi, type SketchTaskApi, type SketchPageApi, type PlanningApi, type SubTaskApi
} from "../../services/workflowApi";
import { tokenStorage } from "../../storage/tokenStorage";
import { getProjects, type ProjectFromApi } from "../../services/projectApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnlineUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: "online" | "idle" | "busy" | "offline" | "active" | "deactive";
  lastActive: string;
  currentPage: string;
  joinedAt: string;
}

interface ChapterStatus {
  id: number;
  manga: string;
  chapter: number;
  title: string;
  status: "draft" | "in_review" | "approved" | "published" | "rejected";
  author: string;
  updatedAt: string;
  progress: number;
  pages: number;
  mangaColor: string;
}

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  avatar: string;
  status: "online" | "idle" | "busy" | "offline" | "active" | "deactive";
  lastActive: string;
  joinedAt: string;
  source: "existing" | "approved";
}

interface ActivityEvent {
  id: number;
  type: "chapter_published" | "user_approved" | "registration" | "chapter_submitted" | "role_assigned" | "chapter_rejected";
  message: string;
  timestamp: string;
  color: string;
}

// ─── Shared Sub-Components ────────────────────────────────────────────────────

const statusChapterConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "var(--mf-text-muted)", bg: "var(--mf-bg-elevated)" },
  in_review: { label: "In Review", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  approved: { label: "Approved", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  published: { label: "Published", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
  rejected: { label: "Rejected", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
};

const roleColor: Record<string, string> = {
  TANTOU_EDITOR: "var(--mf-cyan)",
  EDITORIAL_BOARD_MEMBER: "var(--mf-orange)",
  MANGAKA: "var(--mf-magenta)",
  ASSISTANT: "var(--mf-green)",
  EDITOR: "var(--mf-cyan)",
};

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: "3px 10px", background: bg, color, fontSize: 10, fontWeight: 800,
      borderRadius: 100, letterSpacing: "0.06em", border: `1px solid ${color}35`, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function ChapterStatusBadge({ status }: { status: string }) {
  const s = statusChapterConfig[status] || statusChapterConfig.draft;
  return <StatusBadge label={s.label} color={s.color} bg={s.bg} />;
}

function StatCard({ icon: Icon, label, value, color, trend, subtitle, compact }: {
  icon: LucideIcon; label: string; value: string | number; color: string; trend?: string; subtitle?: string; compact?: boolean;
}) {
  return (
    <div style={{
      padding: compact ? "16px 20px" : "24px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
      borderRadius: 16, display: "flex", flexDirection: "column", gap: compact ? 10 : 16,
      transition: "all 0.25s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: "var(--mf-text-muted)" }}>{label}</div>
        {trend && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: trend.startsWith("-") ? "var(--mf-magenta)" : "var(--mf-green)",
            padding: "4px 8px", background: trend.startsWith("-") ? "var(--mf-magenta-dim)" : "var(--mf-green-dim)",
            borderRadius: 6,
          }}>
            {trend}
          </div>
        )}
        {!trend && (
          <div style={{
            width: compact ? 28 : 32, height: compact ? 28 : 32, borderRadius: 8, background: `${color}15`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Icon size={compact ? 14 : 16} color={color} />
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: compact ? 24 : 32, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: compact ? 4 : 8 }}>
          {value}
        </div>
        <div style={{ fontSize: compact ? 11 : 12, color: "var(--mf-text-muted)", fontWeight: 500 }}>
          {subtitle || "Current total"}
        </div>
      </div>
    </div>
  );
}


function SectionHeader({ title, subtitle, rightContent }: { title: string; subtitle?: string; rightContent?: React.ReactNode }) {
  return (
    <div style={{
      padding: "24px 24px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--mf-text)", letterSpacing: "-0.01em" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4, margin: 0 }}>{subtitle}</p>}
      </div>
      {rightContent}
    </div>
  );
}

// Table header row for consistent minimal tables
function TableHeader({ columns }: { columns: { label: string; width?: string | number; align?: CSSProperties["textAlign"] }[] }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "12px 24px",
      borderBottom: "1px solid var(--mf-border)",
    }}>
      {columns.map((col, i) => (
        <div key={i} style={{
          flex: col.width ? `0 0 ${col.width}` : 1,
          fontSize: 12, fontWeight: 600, color: "var(--mf-text-muted)",
          textAlign: col.align || "left",
        }}>
          {col.label}
        </div>
      ))}
    </div>
  );
}

const formatSafeDate = (dateStr: string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateStr || dateStr === "From API" || dateStr === "Unknown") return "—";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString(undefined, options);
};

const statusTaskConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  in_progress: { label: "In Progress", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  completed: { label: "Completed", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
  failed: { label: "Failed", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
};

const normalizeStatusStr = (s: string | null | undefined) => {
  if (!s) return "pending";
  const lower = s.toLowerCase();
  if (lower === "active" || lower === "in_progress") return "in_progress";
  if (lower === "completed" || lower === "success" || lower === "approved" || lower === "submitted") return "completed";
  if (lower === "failed" || lower === "rejected") return "failed";
  return lower;
};

function TaskStatusBadge({ status }: { status: string | null | undefined }) {
  const norm = normalizeStatusStr(status);
  const cfg = statusTaskConfig[norm] || { label: status || "Pending", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" };
  return <StatusBadge label={cfg.label} color={cfg.color} bg={cfg.bg} />;
}

// ─── Tab 1: System Overview ──────────────────────────────────────────────────

function OverviewTab({
  onlineUsers,
  chapters,
  registrations,
  activities,
  submissions,
  submissionReviews,
  votes,
  tasks = [],
  sketchPages = [],
  plannings = []
}: {
  onlineUsers: OnlineUser[];
  chapters: ChapterStatus[];
  registrations: AdminAccount[];
  activities: ActivityEvent[];
  submissions: SubmissionApi[];
  submissionReviews: SubmissionReviewApi[];
  votes: VoteApi[];
  tasks?: TaskApi[];
  sketchPages?: SketchPageApi[];
  plannings?: PlanningApi[];
}) {
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [selectedVoteId, setSelectedVoteId] = useState<number | null>(null);
  const publishedCount = chapters.filter(c => c.status === "published").length;
  const pendingRegs = registrations.filter(r => r.status === "PENDING").length;

  // Pipeline counts
  const pipeline = {
    draft: chapters.filter(c => c.status === "draft").length,
    in_review: chapters.filter(c => c.status === "in_review").length,
    approved: chapters.filter(c => c.status === "approved").length,
    published: chapters.filter(c => c.status === "published").length,
    rejected: chapters.filter(c => c.status === "rejected").length,
  };
  const totalChapters = chapters.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* Stat cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        <StatCard icon={Users} label="Total Users" value={onlineUsers.length} color="var(--mf-cyan)" />
        <StatCard icon={BookOpen} label="Total Chapters" value={chapters.length} color="var(--mf-magenta)" />
        <StatCard icon={UserPlus} label="Pending Registrations" value={pendingRegs} color="var(--mf-orange)" />
        <StatCard icon={CheckCircle} label="Published Chapters" value={publishedCount} color="var(--mf-green)" />
      </div>

      {/* Two-column: Vote Status Monitor + Chapter Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Vote Status Monitor Frame */}
        <div style={{
          background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
          borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <SectionHeader title="Vote Status Monitor" subtitle="Real-time voting status" />
          <TableHeader columns={[
            { label: "Submission", width: "40%" },
            { label: "Stage", width: "20%" },
            { label: "Progress", width: "25%" },
            { label: "Result", width: "15%", align: "right" },
          ]} />
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 400 }}>
            {submissionReviews.slice(0, 10).map(review => {
              const sub = submissions.find(s => s.id === review.submissionId);
              if (!sub) return null;
              const reviewVotes = votes.filter(v => v.submissionReviewId === review.id);
              const approveCount = reviewVotes.filter(v => v.voteValue === "APPROVE").length;
              const rejectCount = reviewVotes.filter(v => v.voteValue === "REJECT").length;
              const total = Math.max(approveCount + rejectCount, 1);
              const approvePct = (approveCount / total) * 100;
              const rejectPct = (rejectCount / total) * 100;
              const mangaTitle = sub.title || sub.project?.name || sub.project?.title || "Untitled";
              const mColor = ["#FF2A7A", "#39FF8A", "#00F0FF", "#FF8C42"][sub.id % 4] || "var(--mf-cyan)";
              const isSelected = selectedVoteId === review.id;

              return (
                <div key={review.id} style={{ borderBottom: "1px solid var(--mf-border)", display: "flex", flexDirection: "column" }}>
                  <div
                    onClick={() => setSelectedVoteId(isSelected ? null : review.id)}
                    style={{ display: "flex", alignItems: "center", padding: "16px 24px", cursor: "pointer", background: isSelected ? "var(--mf-bg-elevated)" : "transparent", transition: "background 0.2s" }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--mf-bg-elevated)" }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                  >
                    <div style={{ flex: "0 0 40%", fontWeight: 700, color: "var(--mf-text)", paddingRight: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: `${mColor}20`, border: `1px solid ${mColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BookOpen size={14} color={mColor} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", alignItems: "flex-start" }}>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14, color: mColor, fontWeight: 800, letterSpacing: "-0.01em", maxWidth: "100%" }}>{mangaTitle}</span>
                          <span style={{
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 11,
                            color: "var(--mf-text-muted)", fontWeight: 500, marginTop: 2
                          }}>{`Sub #${sub.id}`}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: "0 0 20%", display: "flex", alignItems: "center" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: 6,
                        background: "linear-gradient(135deg, rgba(57,255,138,0.1), rgba(0,240,255,0.2))",
                        color: "var(--mf-cyan)", fontWeight: 800, fontSize: 11,
                        border: "1px solid rgba(0,240,255,0.3)",
                        textTransform: "uppercase", letterSpacing: 0.5
                      }}>
                        {review.stage || "N/A"}
                      </span>
                    </div>

                    {/* Compact Progress Bar */}
                    <div style={{ flex: "0 0 25%", display: "flex", flexDirection: "column", gap: 6, paddingRight: 10 }}>
                      <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 5, overflow: "hidden", background: "var(--mf-border)" }}>
                        <div style={{ width: `${approvePct}%`, background: "var(--mf-green)" }} />
                        <div style={{ width: `${rejectPct}%`, background: "var(--mf-magenta)" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800 }}>
                        <span style={{ color: "var(--mf-green)" }}>{approveCount}</span>
                        <span style={{ color: "var(--mf-magenta)" }}>{rejectCount}</span>
                      </div>
                    </div>

                    <div style={{ flex: "0 0 15%", textAlign: "right" }}>
                      <StatusBadge label={review.decision || "PENDING"} color={review.decision === "APPROVED" ? "var(--mf-green)" : review.decision === "REJECTED" ? "var(--mf-magenta)" : "var(--mf-orange)"} bg="transparent" />
                    </div>
                  </div>

                  {/* Expanded Voters List */}
                  {isSelected && (
                    <div style={{ padding: "16px 24px", background: "var(--mf-bg-base)", borderTop: "1px dashed var(--mf-border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-muted)", marginBottom: 12 }}>Voter Details</div>
                      {reviewVotes.length === 0 ? <div style={{ fontSize: 12, color: "var(--mf-text-muted)" }}>No votes recorded yet.</div> : null}
                      {reviewVotes.map(v => {
                        const voterName = onlineUsers.find(u => u.id === v.voterId)?.name || registrations.find(r => r.id === v.voterId)?.firstName || `Member #${v.voterId}`;
                        return (
                          <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid var(--mf-border)" }}>
                            <span style={{ color: "var(--mf-text)", fontWeight: 600 }}>{voterName}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {v.comment && <span style={{ color: "var(--mf-text-muted)", fontStyle: "italic", flex: 1, textAlign: "right" }}>"{v.comment}"</span>}
                              <span style={{ color: v.voteValue === "APPROVE" ? "var(--mf-green)" : "var(--mf-magenta)", fontWeight: 800 }}>{v.voteValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {submissionReviews.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 13 }}>No active votes found.</div>
            )}
          </div>
        </div>

        {/* Chapter Pipeline */}
        <div style={{
          background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
          borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <SectionHeader title="Chapter Pipeline" subtitle="Distribution by status" />
          <div style={{ flex: 1, padding: "0 24px 24px" }}>
            {/* Minimal Stacked bar */}
            <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 24, background: "var(--mf-bg-elevated)" }}>
              {[
                { key: "draft", color: "var(--mf-text-muted)", count: pipeline.draft },
                { key: "in_review", color: "var(--mf-orange)", count: pipeline.in_review },
                { key: "approved", color: "var(--mf-cyan)", count: pipeline.approved },
                { key: "published", color: "var(--mf-green)", count: pipeline.published },
                { key: "rejected", color: "var(--mf-magenta)", count: pipeline.rejected },
              ].filter(s => s.count > 0).map(s => (
                <div key={s.key} style={{
                  width: `${(s.count / totalChapters) * 100}%`, background: s.color,
                  transition: "width 0.6s ease", minWidth: s.count > 0 ? 4 : 0,
                }} />
              ))}
            </div>

            {/* List breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "published", label: "Published", color: "var(--mf-green)", count: pipeline.published },
                { key: "approved", label: "Approved", color: "var(--mf-cyan)", count: pipeline.approved },
                { key: "in_review", label: "In Review", color: "var(--mf-orange)", count: pipeline.in_review },
                { key: "draft", label: "Draft", color: "var(--mf-text-muted)", count: pipeline.draft },
                { key: "rejected", label: "Rejected", color: "var(--mf-magenta)", count: pipeline.rejected },
              ].map(item => {
                const pct = totalChapters > 0 ? Math.round((item.count / totalChapters) * 100) : 0;
                return (
                  <div key={item.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--mf-text-secondary)" }}>{item.label}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 13, color: "var(--mf-text-muted)" }}>{pct}%</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mf-text)", minWidth: 24, textAlign: "right" }}>{item.count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* System Workflow Overview: Tasks & Plannings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Active Tasks Summary Monitor */}
        <div style={{
          background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
          borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <SectionHeader title="Active Tasks Monitor" subtitle="Latest tasks in the system" />
          <TableHeader columns={[
            { label: "ID", width: "15%" },
            { label: "Task Title", width: "50%" },
            { label: "Status", width: "35%", align: "right" },
          ]} />
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 250 }}>
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} style={{ display: "flex", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid var(--mf-border)" }}>
                <span style={{ flex: "0 0 15%", fontSize: 12, fontWeight: 700, color: "var(--mf-cyan)" }}>#{task.id}</span>
                <span style={{ flex: "0 0 50%", fontSize: 13, fontWeight: 600, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={task.title || ""}>
                  {task.title || "Untitled Task"}
                </span>
                <div style={{ flex: "0 0 35%", textAlign: "right" }}>
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>No active tasks.</div>
            )}
          </div>
        </div>

        {/* Production Progress Summary */}
        <div style={{
          background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
          borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <SectionHeader title="Production Plans" subtitle="Overview of production plans" />
          <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Production Plans Progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", marginBottom: 8 }}>
                <span>Production Plans Status</span>
                <span>{plannings.filter(p => p.status === "COMPLETED" || p.status === "completed").length}/{Math.max(plannings.length, 1)} Completed</span>
              </div>
              <div style={{ width: "100%", height: 8, background: "var(--mf-bg-elevated)", borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 8 }}>
                <div style={{
                  width: `${(plannings.filter(p => p.status === "COMPLETED" || p.status === "completed").length / Math.max(plannings.length, 1)) * 100}%`,
                  background: "var(--mf-green)"
                }} title="Completed" />
                <div style={{
                  width: `${(plannings.filter(p => p.status === "IN_PRODUCTION" || p.status === "in_production" || p.status === "ACTIVE" || p.status === "active").length / Math.max(plannings.length, 1)) * 100}%`,
                  background: "var(--mf-cyan)"
                }} title="In Production" />
                <div style={{
                  width: `${(plannings.filter(p => p.status === "EXTENDED" || p.status === "extended").length / Math.max(plannings.length, 1)) * 100}%`,
                  background: "var(--mf-orange)"
                }} title="Extended" />
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--mf-text-muted)", fontWeight: 600 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mf-green)" }} /> Completed</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mf-cyan)" }} /> In Production</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mf-orange)" }} /> Extended</div>
              </div>
            </div>

            {/* Plannings list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Active Production Plans</div>
              {plannings.slice(0, 3).map(plan => (
                <div key={plan.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 10px", background: "var(--mf-bg-elevated)", borderRadius: 6, border: "1px solid var(--mf-border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{plan.title || "Untitled Plan"}</span>
                  <StatusBadge
                    label={(plan.status || "ACTIVE").toUpperCase()}
                    color={plan.status === "ACTIVE" || plan.status === "COMPLETED" ? "var(--mf-green)" : "var(--mf-orange)"}
                    bg="transparent"
                  />
                </div>
              ))}
              {plannings.length === 0 && (
                <div style={{ fontSize: 11, color: "var(--mf-text-muted)", fontStyle: "italic" }}>No active plans.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Frame */}
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <SectionHeader title="Recent Submissions" subtitle="Monitor latest chapters submitted to the system" />
        <TableHeader columns={[
          { label: "Manga", width: "25%" },
          { label: "Title", width: "25%" },
          { label: "Status", width: "20%" },
          { label: "Updated", width: "30%", align: "right" },
        ]} />
        <div className="hide-scroll" style={{ maxHeight: 400, overflowY: "auto" }}>
          {submissions.slice(0, 10).map(sub => {
            const mangaTitle = sub.title || sub.project?.name || sub.project?.title || "Untitled";
            const mColor = ["#FF2A7A", "#39FF8A", "#00F0FF", "#FF8C42"][sub.id % 4] || "var(--mf-cyan)";
            const statusLower = (sub.status || "draft").toLowerCase();
            const isSelected = selectedSubId === sub.id;

            // Extract the most accurate name available
            let submitterName = sub.submittedByName;
            if (!submitterName) {
              const submitterId = sub.submittedById;
              if (submitterId) {
                const foundUser = onlineUsers.find(u => u.id === submitterId);
                const foundReg = registrations.find(r => r.id === submitterId);
                submitterName = foundUser?.name || (foundReg?.firstName ? `${foundReg.firstName} ${foundReg.lastName || ""}`.trim() : null) || `User #${submitterId}`;
              } else {
                submitterName = "Unknown User";
              }
            }

            return (
              <div key={sub.id} style={{ borderBottom: "1px solid var(--mf-border)", display: "flex", flexDirection: "column" }}>
                <div
                  onClick={() => setSelectedSubId(isSelected ? null : sub.id)}
                  style={{
                    display: "flex", alignItems: "center", padding: "16px 24px",
                    cursor: "pointer", background: isSelected ? "var(--mf-bg-elevated)" : "transparent",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--mf-bg-elevated)" }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                >
                  <div style={{ flex: "0 0 25%", fontWeight: 700, color: "var(--mf-text)", paddingRight: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: `${mColor}20`, border: `1px solid ${mColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={14} color={mColor} />
                      </div>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14, color: mColor, fontWeight: 800, letterSpacing: "-0.01em" }} title={mangaTitle}>{mangaTitle}</span>
                    </div>
                  </div>
                  <div style={{ flex: "0 0 25%", paddingRight: 10, display: "flex", alignItems: "center" }}>
                    <span style={{
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      fontWeight: 600, fontSize: 13, color: "var(--mf-text)", opacity: 0.95
                    }} title={sub.title || sub.submissionType || "Untitled"}>{sub.title || sub.submissionType || "Untitled"}</span>
                  </div>
                  <div style={{ flex: "0 0 20%" }}>
                    {statusChapterConfig[statusLower] ? <ChapterStatusBadge status={statusLower} /> : (
                      <StatusBadge label={sub.status || "UNKNOWN"} color="var(--mf-orange)" bg="rgba(255,140,66,0.14)" />
                    )}
                  </div>
                  <div style={{ flex: "0 0 30%", fontSize: 12, color: "var(--mf-text-muted)", textAlign: "right" }}>
                    {formatSafeDate(sub.submittedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                {/* Expanded Details */}
                {isSelected && (
                  <div style={{ padding: "20px 24px", background: "var(--mf-bg-base)", fontSize: 13, color: "var(--mf-text-secondary)", borderTop: "1px dashed var(--mf-border)", cursor: "default" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div><strong style={{ color: "var(--mf-text-muted)" }}>Raw DB Status:</strong> <span style={{ color: "var(--mf-orange)", fontWeight: 700 }}>{sub.status || "N/A"}</span></div>
                      <div><strong style={{ color: "var(--mf-text-muted)" }}>Submission ID:</strong> #{sub.id}</div>
                      <div><strong style={{ color: "var(--mf-text-muted)" }}>Submitted By:</strong> {submitterName}</div>
                      <div>
                        <strong style={{ color: "var(--mf-text-muted)" }}>Content URL:</strong>{" "}
                        {sub.note ? (
                          <a href={sub.note} target="_blank" rel="noreferrer" style={{ color: "var(--mf-cyan)", textDecoration: "none", fontWeight: 600 }}>View Content ↗</a>
                        ) : "N/A"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {submissions.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 13 }}>No submissions found.</div>
          )}
        </div>
      </div>
    </div >
  );
}

// ─── Tab 2: Chapter Monitor ──────────────────────────────────────────────────

function ChapterMonitorTab({ chapters }: { chapters: ChapterStatus[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = chapters.filter(ch => {
    const matchStatus = filter === "all" || ch.status === filter;
    const matchSearch = search === "" ||
      ch.manga.toLowerCase().includes(search.toLowerCase()) ||
      ch.title.toLowerCase().includes(search.toLowerCase()) ||
      ch.author.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const selected = filtered.find(ch => ch.id === selectedId);

  const progressColor = (p: number) =>
    p === 100 ? "var(--mf-green)" : p > 60 ? "var(--mf-cyan)" : "var(--mf-orange)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
        <StatCard icon={BookOpen} label="Total Chapters" value={chapters.length} color="var(--mf-cyan)" />
        <StatCard icon={Clock} label="In Review" value={chapters.filter(c => c.status === "in_review").length} color="var(--mf-orange)" />
        <StatCard icon={CheckCircle} label="Published" value={chapters.filter(c => c.status === "published").length} color="var(--mf-green)" />
        <StatCard icon={AlertTriangle} label="Rejected" value={chapters.filter(c => c.status === "rejected").length} color="var(--mf-magenta)" />
      </div>

      {/* Table + detail layout */}
      <div style={{ display: "flex", flex: 1, gap: 18, minHeight: 0 }}>
        {/* Table */}
        <div style={{
          flex: selected ? "0 0 60%" : 1, background: "var(--mf-bg-surface)",
          border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden",
          display: "flex", flexDirection: "column", transition: "flex 0.3s ease",
        }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "var(--mf-bg-elevated)", borderRadius: 8, border: "1px solid var(--mf-border)", flex: "0 0 220px",
            }}>
              <Search size={12} color="var(--mf-text-muted)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search manga, title, author..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--mf-text)", fontSize: 12 }}
              />
            </div>
            {/* Filter chips */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
              {[
                { key: "all", label: "All", count: chapters.length },
                { key: "draft", label: "Draft" },
                { key: "in_review", label: "In Review" },
                { key: "approved", label: "Approved" },
                { key: "published", label: "Published" },
                { key: "rejected", label: "Rejected" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: "pointer",
                    border: "1px solid",
                    background: filter === f.key ? (statusChapterConfig[f.key]?.bg || "var(--mf-bg-elevated)") : "transparent",
                    borderColor: filter === f.key ? (statusChapterConfig[f.key]?.color || "var(--mf-border-bright)") + "50" : "var(--mf-border)",
                    color: filter === f.key ? (statusChapterConfig[f.key]?.color || "var(--mf-text)") : "var(--mf-text-muted)",
                    transition: "all 0.12s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <TableHeader columns={[
            { label: "Manga", width: "25%" },
            { label: "Chapter" },
            { label: "Author", width: "15%" },
            { label: "Status", width: "12%" },
            { label: "Progress", width: "18%" },
            { label: "Updated", width: "10%", align: "right" },
          ]} />

          {/* Table body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)" }}>
                <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No chapters match your filters</p>
              </div>
            ) : (
              filtered.map(ch => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedId(selectedId === ch.id ? null : ch.id)}
                  style={{
                    display: "flex", alignItems: "center", padding: "12px 20px",
                    borderBottom: "1px solid var(--mf-border)", cursor: "pointer",
                    background: selectedId === ch.id ? "var(--mf-bg-elevated)" : "transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (selectedId !== ch.id) e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                  onMouseLeave={e => { if (selectedId !== ch.id) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Manga */}
                  <div style={{ flex: "0 0 25%", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${ch.mangaColor}20`, border: `1px solid ${ch.mangaColor}40`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <BookOpen size={14} color={ch.mangaColor} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ch.manga}
                    </span>
                  </div>
                  {/* Chapter */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mf-text)" }}>Ch. {ch.chapter}</div>
                    <div style={{ fontSize: 10, color: "var(--mf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</div>
                  </div>
                  {/* Author */}
                  <div style={{ flex: "0 0 15%", fontSize: 12, color: "var(--mf-text-secondary)" }}>{ch.author}</div>
                  {/* Status */}
                  <div style={{ flex: "0 0 12%" }}><ChapterStatusBadge status={ch.status} /></div>
                  {/* Progress */}
                  <div style={{ flex: "0 0 18%", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{
                        width: `${ch.progress}%`, height: "100%", borderRadius: 100,
                        background: progressColor(ch.progress), transition: "width 0.6s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: progressColor(ch.progress), minWidth: 30, textAlign: "right" }}>
                      {ch.progress}%
                    </span>
                  </div>
                  {/* Updated */}
                  <div style={{ flex: "0 0 10%", fontSize: 10, color: "var(--mf-text-muted)", textAlign: "right" }}>{ch.updatedAt}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            flex: "0 0 38%", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
            borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
            animation: "slideIn 0.2s ease",
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--mf-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${selected.mangaColor}20`, border: `1px solid ${selected.mangaColor}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <BookOpen size={18} color={selected.mangaColor} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{selected.manga}</h2>
                    <p style={{ fontSize: 11, color: "var(--mf-text-muted)", margin: 0 }}>Chapter {selected.chapter}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} style={{
                  background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 6,
                  padding: "4px 8px", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 11,
                }}>✕</button>
              </div>
              <ChapterStatusBadge status={selected.status} />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "TITLE", value: selected.title },
                  { label: "AUTHOR", value: selected.author },
                  { label: "PAGES", value: `${selected.pages} pages` },
                  { label: "LAST UPDATED", value: selected.updatedAt },
                ].map((info, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", background: "var(--mf-bg-elevated)", borderRadius: 10,
                    border: "1px solid var(--mf-border)",
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>
                      {info.label}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--mf-text)", fontWeight: 600 }}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div style={{
                padding: "14px 16px", background: "var(--mf-bg-elevated)", borderRadius: 10,
                border: "1px solid var(--mf-border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em" }}>COMPLETION PROGRESS</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: progressColor(selected.progress) }}>{selected.progress}%</span>
                </div>
                <div style={{ height: 8, background: "var(--mf-bg-surface)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{
                    width: `${selected.progress}%`, height: "100%", borderRadius: 100,
                    background: progressColor(selected.progress), transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: User Management ──────────────────────────────────────────────────

function UserManagementTab({ managedUsers, onAddRole, onRemoveRole, onToggleStatus }: {
  managedUsers: ManagedUser[];
  onAddRole: (userId: number, newRole: string) => void;
  onRemoveRole: (userId: number, role: string) => void;
  onToggleStatus: (userId: number, currentStatus: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeUser, setActiveUser] = useState<typeof managedUsers[0] | null>(null);

  useEffect(() => {
    if (selectedId !== null) {
      const u = managedUsers.find(x => x.id === selectedId);
      if (u) setActiveUser(u);
    }
  }, [selectedId, managedUsers]);

  const unassignedCount = managedUsers.filter(u => u.roles.length === 0).length;
  const activeCount = managedUsers.filter(u => u.status === "online").length;

  const allRoles = ["ALL", "TANTOU_EDITOR", "EDITORIAL_BOARD_MEMBER", "MANGAKA", "ASSISTANT", "UNASSIGNED"];
  const assignableRoles = ["MANGAKA", "ASSISTANT", "TANTOU_EDITOR", "EDITORIAL_BOARD_MEMBER"];

  const filtered = managedUsers.filter(u => {
    const matchRole = roleFilter === "ALL"
      || (roleFilter === "UNASSIGNED" && u.roles.length === 0)
      || u.roles.includes(roleFilter);
    const matchSearch = search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const selected = filtered.find(u => u.id === selectedId);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
    deactive: { label: "Deactive", color: "var(--mf-text-muted)", bg: "var(--mf-bg-elevated)" },
    online: { label: "Online", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
    idle: { label: "Idle", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
    busy: { label: "Busy", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
    offline: { label: "Offline", color: "var(--mf-text-muted)", bg: "var(--mf-bg-elevated)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
        <StatCard compact icon={Users} label="Total Users" value={managedUsers.length} color="var(--mf-cyan)" />
        <StatCard compact icon={Activity} label="Active Now" value={activeCount} color="var(--mf-green)" />
        <StatCard compact icon={AlertTriangle} label="Unassigned Role" value={unassignedCount} color="var(--mf-orange)" subtitle={unassignedCount > 0 ? "Requires attention" : undefined} />
      </div>

      {/* Table + detail */}
      <div style={{ display: "flex", flex: 1, gap: selectedId ? 18 : 0, transition: "gap 0.3s cubic-bezier(0.16, 1, 0.3, 1)", minHeight: 0 }}>
        {/* Table */}
        <div style={{
          flex: selectedId ? "0 0 58%" : "1 1 auto", background: "var(--mf-bg-surface)",
          border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden",
          display: "flex", flexDirection: "column", transition: "flex 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "var(--mf-bg-elevated)", borderRadius: 8, border: "1px solid var(--mf-border)", flex: "0 0 200px",
            }}>
              <Search size={12} color="var(--mf-text-muted)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--mf-text)", fontSize: 12 }}
              />
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
              {allRoles.map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: "pointer",
                    border: `1px solid ${roleFilter === r ? (roleColor[r] || "var(--mf-border-bright)") + "50" : "var(--mf-border)"}`,
                    background: roleFilter === r ? `${roleColor[r] || "var(--mf-text)"}15` : "transparent",
                    color: roleFilter === r ? (roleColor[r] || "var(--mf-text)") : "var(--mf-text-muted)",
                    transition: "all 0.12s",
                  }}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <TableHeader columns={[
            { label: "Name", width: "24%" },
            { label: "Email", width: "26%" },
            { label: "Role", width: "22%" },
            { label: "Status", width: "14%" },
            { label: "Joined", width: "14%" },
          ]} />

          {/* Table body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)" }}>
                <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No users match your filters</p>
              </div>
            ) : (
              filtered.map(user => {
                const st = statusConfig[user.status] || statusConfig.offline;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedId(selectedId === user.id ? null : user.id)}
                    style={{
                      display: "flex", alignItems: "center", padding: "12px 20px",
                      borderBottom: "1px solid var(--mf-border)", cursor: "pointer",
                      background: selectedId === user.id ? "var(--mf-bg-elevated)" : "transparent",
                      transition: "background 0.12s ease, transform 0.06s ease",
                    }}
                    onMouseEnter={e => { if (selectedId !== user.id) e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                    onMouseLeave={e => {
                      if (selectedId !== user.id) e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = "translateY(1px)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {/* Name */}
                    <div style={{
                      flex: "0 0 24%", display: "flex", alignItems: "center", gap: 10,
                      minWidth: 0, paddingRight: 12,
                    }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: `linear-gradient(135deg, ${roleColor[user.roles[0]] || "var(--mf-text-muted)"}50, ${roleColor[user.roles[0]] || "var(--mf-text-muted)"}20)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: roleColor[user.roles[0]] || "var(--mf-text-muted)",
                        }}>
                          {user.avatar}
                        </div>
                        <div style={{
                          position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%",
                          background: st.color, border: "2px solid var(--mf-bg-surface)",
                        }} />
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 800, color: roleColor[user.roles[0]] || "var(--mf-text)", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, letterSpacing: "-0.01em"
                      }}>
                        {user.name}
                      </div>
                    </div>
                    {/* Email */}
                    <div style={{
                      flex: "0 0 26%", minWidth: 0, display: "flex", alignItems: "center",
                      paddingRight: 12,
                      fontSize: 11, color: "var(--mf-text-muted)",
                    }}>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email || "—"}</span>
                    </div>
                    {/* Roles (tags) */}
                    <div style={{
                      flex: "0 0 22%", display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center",
                      minWidth: 0, paddingRight: 12,
                    }}>
                      {user.roles.length === 0 ? (
                        <span style={{
                          padding: "3px 8px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                          background: "rgba(255,140,66,0.14)", color: "var(--mf-orange)",
                          border: "1px solid rgba(255,140,66,0.3)",
                        }}>UNASSIGNED</span>
                      ) : (
                        user.roles.map(r => (
                          <span key={r} style={{
                            padding: "2px 8px", fontSize: 9, fontWeight: 800, borderRadius: 5,
                            background: `${roleColor[r] || "var(--mf-text-muted)"}15`,
                            color: roleColor[r] || "var(--mf-text-muted)",
                            border: `1px solid ${roleColor[r] || "var(--mf-text-muted)"}35`,
                            letterSpacing: "0.04em", whiteSpace: "nowrap",
                          }}>{r}</span>
                        ))
                      )}
                    </div>
                    {/* Status */}
                    <div style={{
                      flex: "0 0 14%", display: "flex", alignItems: "center",
                      minWidth: 0, paddingRight: 12,
                    }}>
                      <StatusBadge label={st.label} color={st.color} bg={st.bg} />
                    </div>
                    {/* Joined */}
                    <div style={{
                      flex: "0 0 14%", display: "flex", alignItems: "center",
                      minWidth: 0,
                      fontSize: 11, color: "var(--mf-text-muted)",
                    }}>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.joinedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel wrapper */}
        <div style={{
          flex: selectedId ? "0 0 40%" : "0 0 0%",
          opacity: selectedId ? 1 : 0,
          overflow: "hidden",
          transition: "flex 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex", flexDirection: "column",
          position: "relative",
        }}>
          {/* Close button fixed at top right of the frame */}
          <button onClick={() => setSelectedId(null)} style={{
            position: "absolute", right: 24, top: 16, zIndex: 10,
            background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 6,
            padding: "4px 8px", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 11,
          }}>✕</button>

          {activeUser && (() => {
            const panelUser = activeUser;
            return (
              <div key={panelUser.id} className="no-scrollbar" style={{
                flex: 1, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
                borderRadius: 16, overflowY: "auto", display: "flex", flexDirection: "column",
                minWidth: 320, position: "relative",
                animation: selectedId ? "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" : "none",
              }}>
                {/* Header */}
                <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid var(--mf-border)", textAlign: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, margin: "0 auto 12px",
                    background: `linear-gradient(135deg, ${roleColor[panelUser.roles[0]] || "var(--mf-text-muted)"}60, ${roleColor[panelUser.roles[0]] || "var(--mf-text-muted)"}20)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 900, color: roleColor[panelUser.roles[0]] || "var(--mf-text-muted)",
                    border: `2px solid ${roleColor[panelUser.roles[0]] || "var(--mf-text-muted)"}40`,
                  }}>
                    {panelUser.avatar}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{panelUser.name}</h2>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 10 }}>{panelUser.email}</div>
                  {/* Role tags */}
                  <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                    {panelUser.roles.length === 0 ? (
                      <span style={{
                        padding: "3px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                        background: "rgba(255,140,66,0.14)", color: "var(--mf-orange)",
                        border: "1px solid rgba(255,140,66,0.3)",
                      }}>UNASSIGNED</span>
                    ) : (
                      panelUser.roles.map(r => (
                        <span key={r} style={{
                          padding: "4px 12px", fontSize: 10, fontWeight: 900, borderRadius: 6,
                          background: roleColor[r] || "var(--mf-text-muted)",
                          color: "#1e1326", // dark background for high contrast with neon colors
                          border: "none",
                          letterSpacing: "0.06em",
                          boxShadow: `0 0 10px ${roleColor[r] || "var(--mf-text-muted)"}40`
                        }}>{r}</span>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ padding: "18px 20px", flexShrink: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { icon: Activity, label: "STATUS", value: (statusConfig[panelUser.status] || statusConfig.offline).label },
                      { icon: Globe, label: "JOINED", value: panelUser.joinedAt },
                    ].map((info, i) => {
                      const InfoIcon = info.icon;
                      return (
                        <div key={i} style={{
                          padding: "12px 14px", background: "var(--mf-bg-elevated)", borderRadius: 10,
                          border: "1px solid var(--mf-border)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                            <InfoIcon size={10} color="var(--mf-text-muted)" />
                            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em" }}>{info.label}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mf-text)" }}>{info.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Account Controls */}
                  <div style={{
                    marginTop: 16, padding: "16px", background: "var(--mf-bg-elevated)",
                    borderRadius: 12, border: "1px solid var(--mf-border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <Shield size={12} color="var(--mf-cyan)" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", letterSpacing: "0.06em" }}>ACCOUNT CONTROLS</span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => onToggleStatus(panelUser.id, panelUser.status)}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 8, fontWeight: 800, fontSize: 11,
                          cursor: "pointer", transition: "all 0.2s",
                          background: panelUser.status === "active" || panelUser.status === "online" ? "var(--mf-bg-surface)" : "var(--mf-green-dim)",
                          color: panelUser.status === "active" || panelUser.status === "online" ? "var(--mf-magenta)" : "var(--mf-green)",
                          border: `1px solid ${panelUser.status === "active" || panelUser.status === "online" ? "var(--mf-magenta)40" : "var(--mf-green)40"}`,
                        }}
                        onMouseEnter={e => {
                          if (panelUser.status === "active" || panelUser.status === "online") {
                            e.currentTarget.style.background = "var(--mf-magenta-dim)";
                          } else {
                            e.currentTarget.style.background = "var(--mf-green)20";
                          }
                        }}
                        onMouseLeave={e => {
                          if (panelUser.status === "active" || panelUser.status === "online") {
                            e.currentTarget.style.background = "var(--mf-bg-surface)";
                          } else {
                            e.currentTarget.style.background = "var(--mf-green-dim)";
                          }
                        }}
                      >
                        {panelUser.status === "active" || panelUser.status === "online" ? "Deactivate Account" : "Activate Account"}
                      </button>
                    </div>
                  </div>

                  {/* Current roles section - always visible */}
                  {panelUser.roles.length > 0 && (
                    <div style={{
                      marginTop: 16, padding: "16px", background: "var(--mf-bg-elevated)",
                      borderRadius: 12, border: "1px solid var(--mf-border)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <Shield size={12} color="var(--mf-cyan)" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", letterSpacing: "0.06em" }}>ASSIGNED ROLES</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {panelUser.roles.map(r => (
                          <div key={r} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 12px",
                            background: `${roleColor[r] || "var(--mf-text-muted)"}12`, border: `1px solid ${roleColor[r] || "var(--mf-text-muted)"}35`,
                            borderRadius: 8, fontSize: 11, fontWeight: 700, color: roleColor[r] || "var(--mf-text-muted)",
                          }}>
                            {r}
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveRole(panelUser.id, r); }}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: roleColor[r] || "var(--mf-text-muted)", opacity: 0.6, padding: "0 2px",
                                fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; }}
                              title={`Remove ${r} role`}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                      {/* Add more roles */}
                      {assignableRoles.filter(r => !panelUser.roles.includes(r)).length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginBottom: 6, fontWeight: 600 }}>Add another role:</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {assignableRoles.filter(r => !panelUser.roles.includes(r)).map(r => (
                              <button
                                key={r}
                                onClick={() => onAddRole(panelUser.id, r)}
                                style={{
                                  padding: "5px 12px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                                  background: "transparent", border: `1px dashed ${roleColor[r]}50`,
                                  color: roleColor[r], cursor: "pointer", transition: "all 0.15s",
                                  opacity: 0.7,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${roleColor[r]}15`; e.currentTarget.style.opacity = "1"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = "0.7"; }}
                              >
                                + {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role assignment section for users with no roles */}
                  {panelUser.roles.length === 0 && (
                    <div style={{
                      marginTop: 16, padding: "16px", background: "rgba(255,140,66,0.08)",
                      borderRadius: 12, border: "1px solid rgba(255,140,66,0.2)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <AlertTriangle size={12} color="var(--mf-orange)" />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-orange)" }}>ROLE ASSIGNMENT REQUIRED</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {assignableRoles.map(r => (
                          <button
                            key={r}
                            onClick={() => onAddRole(panelUser.id, r)}
                            style={{
                              padding: "7px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8,
                              background: `${roleColor[r]}15`, border: `1px solid ${roleColor[r]}40`,
                              color: roleColor[r], cursor: "pointer", transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${roleColor[r]}30`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${roleColor[r]}15`; }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: Submissions Monitor ──────────────────────────────────────────────

function SubmissionsTab({ chapters }: { chapters: ChapterStatus[] }) {
  const submissions = chapters.filter(c => c.status !== "draft");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard compact icon={FileText} label="Total Submissions" value={submissions.length} color="var(--mf-cyan)" />
        <StatCard compact icon={Clock} label="Pending Review" value={submissions.filter(c => c.status === "in_review").length} color="var(--mf-orange)" />
        <StatCard compact icon={CheckCircle} label="Approved & Published" value={submissions.filter(c => c.status === "approved" || c.status === "published").length} color="var(--mf-green)" />
      </div>

      <div style={{ flex: 1, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <SectionHeader title="All Submissions" subtitle="Monitor all chapters submitted by Mangakas" />
        <TableHeader columns={[
          { label: "Manga", width: "20%" },
          { label: "Chapter", width: "10%" },
          { label: "Author", width: "20%" },
          { label: "Status", width: "15%" },
          { label: "Last Updated", width: "20%" },
          { label: "Actions", width: "15%", align: "right" }
        ]} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {submissions.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)" }}>No submissions found.</div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--mf-border)" }}>
                <div style={{ flex: "0 0 20%", fontWeight: 700, color: "var(--mf-text)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${sub.mangaColor}20`, border: `1px solid ${sub.mangaColor}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={12} color={sub.mangaColor} />
                    </div>
                    {sub.manga}
                  </div>
                </div>
                <div style={{ flex: "0 0 10%", fontWeight: 600, color: "var(--mf-text-muted)" }}>Ch. {sub.chapter}</div>
                <div style={{ flex: "0 0 20%", color: "var(--mf-text-secondary)", fontSize: 12 }}>{sub.author}</div>
                <div style={{ flex: "0 0 15%" }}><ChapterStatusBadge status={sub.status} /></div>
                <div style={{ flex: "0 0 20%", fontSize: 11, color: "var(--mf-text-muted)" }}>{sub.updatedAt}</div>
                <div style={{ flex: "0 0 15%", textAlign: "right" }}>
                  <button style={{ padding: "4px 10px", background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 6, color: "var(--mf-text)", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: Process Monitor ──────────────────────────────────────────────────

function ProcessMonitorTab({
  tasks,
  sketchTasks,
  sketchPages,
  plannings,
  managedUsers
}: {
  tasks: TaskApi[];
  sketchTasks: SketchTaskApi[];
  sketchPages: SketchPageApi[];
  plannings: PlanningApi[];
  managedUsers: ManagedUser[];
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [subtasks, setSubtasks] = useState<Record<number, SubTaskApi[]>>({});
  const [subtasksLoading, setSubtasksLoading] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeRightTab, setActiveRightTab] = useState<"sketches" | "sketchTasks" | "plannings">("sketches");

  const handleTaskClick = async (taskId: number) => {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      return;
    }
    setSelectedTaskId(taskId);
    if (!subtasks[taskId]) {
      setSubtasksLoading(prev => ({ ...prev, [taskId]: true }));
      try {
        const adminId = tokenStorage.getAccount()?.id || 1;
        const result = await getSubTasksForTask(taskId, adminId);
        setSubtasks(prev => ({ ...prev, [taskId]: result || [] }));
      } catch (err) {
        console.error("Failed to load subtasks:", err);
      } finally {
        setSubtasksLoading(prev => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = !search ||
      (t.title && t.title.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    const norm = normalizeStatusStr(t.status);
    const matchStatus = statusFilter === "all" || norm === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => normalizeStatusStr(t.status) === "completed").length;
  const inProgressTasks = tasks.filter(t => normalizeStatusStr(t.status) === "in_progress").length;
  const activePlansCount = plannings.filter(p => p.status === "ACTIVE" || p.status === "active" || p.status === "IN_PROGRESS").length;

  const tantouTasks = filteredTasks.filter(t => {
    if (!t.assigneeId) return false;
    const u = managedUsers.find(u => u.id === t.assigneeId);
    return u?.roles.includes("TANTOU_EDITOR") || u?.roles.includes("EDITORIAL_BOARD_MEMBER");
  });

  const mangakaTasks = filteredTasks.filter(t => {
    if (!t.assigneeId) return false;
    const u = managedUsers.find(u => u.id === t.assigneeId);
    return u?.roles.includes("MANGAKA");
  });

  const otherTasks = filteredTasks.filter(t => {
    if (!t.assigneeId) return true;
    const u = managedUsers.find(u => u.id === t.assigneeId);
    return !u?.roles.includes("TANTOU_EDITOR") && !u?.roles.includes("EDITORIAL_BOARD_MEMBER") && !u?.roles.includes("MANGAKA");
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        <StatCard icon={CheckSquare} label="Total Tasks" value={totalTasks} color="var(--mf-cyan)" />
        <StatCard icon={Clock} label="In Progress Tasks" value={inProgressTasks} color="var(--mf-orange)" />
        <StatCard icon={CheckCircle} label="Completed Tasks" value={completedTasks} color="var(--mf-green)" />
        <StatCard icon={Layers} label="Active Plannings" value={plannings.length} color="var(--mf-magenta)" subtitle={`${activePlansCount} in progress`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>

        {/* Left Side: Tasks & Subtasks */}
        <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <SectionHeader title="Tasks & Subtasks" subtitle="Track tasks assigned to Mangakas and delegated subtasks" />

          {/* Toolbar */}
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "var(--mf-bg-elevated)", borderRadius: 8, border: "1px solid var(--mf-border)", flex: "0 0 220px",
            }}>
              <Search size={12} color="var(--mf-text-muted)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--mf-text)", fontSize: 12 }}
              />
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "in_progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: "pointer",
                    border: "1px solid",
                    background: statusFilter === f.key ? (statusTaskConfig[f.key]?.bg || "var(--mf-bg-elevated)") : "transparent",
                    borderColor: statusFilter === f.key ? (statusTaskConfig[f.key]?.color || "var(--mf-border-bright)") + "50" : "var(--mf-border)",
                    color: statusFilter === f.key ? (statusTaskConfig[f.key]?.color || "var(--mf-text)") : "var(--mf-text-muted)",
                    transition: "all 0.12s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <TableHeader columns={[
            { label: "Task ID", width: "15%" },
            { label: "Title & Type", width: "45%" },
            { label: "Status", width: "20%" },
            { label: "Deadline", width: "20%", align: "right" }
          ]} />

          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 13 }}>No tasks found.</div>
            ) : (
              [
                { title: "Tier 1: Board ➔ Tantou", list: tantouTasks, color: "var(--mf-cyan)" },
                { title: "Tier 2: Tantou ➔ Mangaka", list: mangakaTasks, color: "var(--mf-magenta)" },
                { title: "Other / Unassigned Tasks", list: otherTasks, color: "var(--mf-text-muted)" },
              ].map(group => {
                if (group.list.length === 0) return null;
                return (
                  <div key={group.title} style={{ marginBottom: 0 }}>
                    <div style={{ padding: "8px 24px", background: `linear-gradient(90deg, ${group.color}15, transparent)`, borderLeft: `3px solid ${group.color}`, borderBottom: "1px solid var(--mf-border)", fontSize: 11, fontWeight: 800, color: group.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {group.title}
                    </div>
                    {group.list.map(task => {
                      const isSelected = selectedTaskId === task.id;
                      const taskSubtasks = subtasks[task.id] || [];
                      const isLoadingSubtasks = subtasksLoading[task.id];

                      return (
                        <div key={task.id} style={{ borderBottom: "1px solid var(--mf-border)", display: "flex", flexDirection: "column" }}>
                          <div
                            onClick={() => handleTaskClick(task.id)}
                            style={{
                              display: "flex", alignItems: "center", padding: "14px 24px", cursor: "pointer",
                              background: isSelected ? "var(--mf-bg-elevated)" : "transparent", transition: "background 0.2s"
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--mf-bg-elevated)" }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                          >
                            <div style={{ flex: "0 0 15%", fontWeight: 700, color: "var(--mf-cyan)", fontSize: 13 }}>
                              #{task.id}
                            </div>
                            <div style={{ flex: "0 0 45%", paddingRight: 10, display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--mf-text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {task.title || "Untitled Task"}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--mf-text-muted)", fontWeight: 500, marginTop: 2 }}>
                                Type: {task.taskType || "General"}
                              </span>
                            </div>
                            <div style={{ flex: "0 0 20%" }}>
                              <TaskStatusBadge status={task.status} />
                            </div>
                            <div style={{ flex: "0 0 20%", fontSize: 12, color: "var(--mf-text-muted)", textAlign: "right" }}>
                              {task.deadline ? formatSafeDate(task.deadline) : "No Deadline"}
                            </div>
                          </div>

                          {/* Subtasks Expanded Panel */}
                          {isSelected && (
                            <div style={{ padding: "16px 24px", background: "var(--mf-bg-base)", borderTop: "1px dashed var(--mf-border)" }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-green)", marginBottom: 12, letterSpacing: "0.06em" }}>
                                TIER 3: MANGAKA ➔ ASSISTANT (SUB-TASKS)
                              </div>

                              {isLoadingSubtasks ? (
                                <div style={{ fontSize: 12, color: "var(--mf-text-muted)", padding: "10px 0" }}>Loading subtasks...</div>
                              ) : taskSubtasks.length === 0 ? (
                                <div style={{ fontSize: 12, color: "var(--mf-text-muted)", fontStyle: "italic", padding: "10px 0" }}>
                                  No sub-tasks delegated to assistants yet.
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  <div style={{ display: "flex", paddingBottom: 6, borderBottom: "1px solid var(--mf-border)", fontSize: 11, fontWeight: 700, color: "var(--mf-text-muted)" }}>
                                    <div style={{ flex: 2 }}>Subtask Title</div>
                                    <div style={{ flex: 1.5 }}>Assignee</div>
                                    <div style={{ flex: 1.2 }}>Status</div>
                                    <div style={{ flex: 1.2, textAlign: "right" }}>Deadline</div>
                                  </div>
                                  {taskSubtasks.map(st => (
                                    <div key={st.id} style={{ display: "flex", alignItems: "center", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)", padding: "6px 0" }}>
                                      <div style={{ flex: 2, fontWeight: 600, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {st.title}
                                      </div>
                                      <div style={{ flex: 1.5, color: "var(--mf-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {st.assigneeName || `Assistant #${st.assigneeId}`}
                                      </div>
                                      <div style={{ flex: 1.2 }}>
                                        <StatusBadge
                                          label={(st.status || "CREATED").toUpperCase()}
                                          color={st.status === "COMPLETED" ? "var(--mf-green)" : st.status === "NEEDS_REVISION" ? "var(--mf-magenta)" : "var(--mf-orange)"}
                                          bg="transparent"
                                        />
                                      </div>
                                      <div style={{ flex: 1.2, textAlign: "right", color: "var(--mf-text-muted)" }}>
                                        {st.deadline ? formatSafeDate(st.deadline) : "No Deadline"}
                                      </div>
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
                );
              }))}
          </div>
        </div>

        {/* Right Side: Production Details (Sketches, Sketch Tasks, Plannings) */}
        <div style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Tabs header */}
          <div style={{ display: "flex", background: "var(--mf-bg-elevated)", borderBottom: "1px solid var(--mf-border)" }}>
            {[
              { key: "sketches", label: "Sketch Pages" },
              { key: "sketchTasks", label: "Sketch Tasks" },
              { key: "plannings", label: "Plannings" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveRightTab(tab.key as any)}
                style={{
                  flex: 1, padding: "16px 12px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 800, color: activeRightTab === tab.key ? "var(--mf-cyan)" : "var(--mf-text-muted)",
                  borderBottom: activeRightTab === tab.key ? "2px solid var(--mf-cyan)" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 20, maxHeight: 570, overflowY: "auto" }}>

            {/* 1. Sketches */}
            {activeRightTab === "sketches" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sketchPages.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>No sketch pages loaded.</div>
                ) : (
                  sketchPages.map(page => (
                    <div key={page.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "var(--mf-bg-elevated)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>Page {page.pageNumber || "N/A"}</div>
                        <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 4 }}>ID: #{page.id}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusBadge
                          label={(page.status || "DRAFT").toUpperCase()}
                          color={page.status === "COMPLETED" ? "var(--mf-green)" : page.status === "IN_PROGRESS" ? "var(--mf-cyan)" : "var(--mf-orange)"}
                          bg="transparent"
                        />
                        {page.initialSketchUrl && (
                          <a href={page.initialSketchUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--mf-cyan)", textDecoration: "none", fontWeight: 700 }}>
                            View ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Sketch Tasks */}
            {activeRightTab === "sketchTasks" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sketchTasks.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>No sketch tasks loaded.</div>
                ) : (
                  sketchTasks.map(st => (
                    <div key={st.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--mf-bg-elevated)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-cyan)", textTransform: "uppercase" }}>
                          {st.taskType || "Sketch Task"}
                        </span>
                        <StatusBadge
                          label={(st.status || "PENDING").toUpperCase()}
                          color={st.status === "COMPLETED" ? "var(--mf-green)" : "var(--mf-orange)"}
                          bg="transparent"
                        />
                      </div>
                      <p style={{ fontSize: 12, color: "var(--mf-text)", margin: 0 }}>{st.description || "No description provided."}</p>
                      {st.completedUrl && (
                        <div style={{ marginTop: 4, fontSize: 11 }}>
                          <span style={{ color: "var(--mf-text-muted)" }}>Output: </span>
                          <a href={st.completedUrl} target="_blank" rel="noreferrer" style={{ color: "var(--mf-cyan)", textDecoration: "none", fontWeight: 700 }}>View Result ↗</a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Plannings */}
            {activeRightTab === "plannings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {plannings.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>No plannings found.</div>
                ) : (
                  plannings.map(plan => (
                    <div key={plan.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12, background: "var(--mf-bg-elevated)", borderRadius: 10, border: "1px solid var(--mf-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>
                          {plan.title || "Untitled Plan"}
                        </span>
                        <StatusBadge
                          label={(plan.status || "ACTIVE").toUpperCase()}
                          color={plan.status === "ACTIVE" || plan.status === "COMPLETED" ? "var(--mf-green)" : "var(--mf-orange)"}
                          bg="transparent"
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>
                        <span>Start: {plan.startDate ? formatSafeDate(plan.startDate) : "—"}</span>
                        <span>End: {plan.endDate ? formatSafeDate(plan.endDate) : "—"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chapters, setChapters] = useState<ChapterStatus[]>([]);
  const [registrations, setRegistrations] = useState<AdminAccount[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [systemSubmissions, setSystemSubmissions] = useState<SubmissionApi[]>([]);
  const [submissionReviews, setSubmissionReviews] = useState<SubmissionReviewApi[]>([]);
  const [votes, setVotes] = useState<VoteApi[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [tasks, setTasks] = useState<TaskApi[]>([]);
  const [sketchTasks, setSketchTasks] = useState<SketchTaskApi[]>([]);
  const [sketchPages, setSketchPages] = useState<SketchPageApi[]>([]);
  const [plannings, setPlannings] = useState<PlanningApi[]>([]);
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const formatJoinedDate = useCallback((account: AdminAccount): string => {
    const dates = account as AdminAccount & {
      joinedAt?: string | null;
      createdAt?: string | null;
    };
    const dateValue = dates.joinedAt || dates.createdAt || dates.approvedAt;
    if (!dateValue) return "—";

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }, []);

  const mapAccountToOnlineUser = useCallback((account: AdminAccount): OnlineUser => {
    const name = `${account.firstName || ""} ${account.lastName || ""}`.trim() || account.email || `Account #${account.id}`;
    const role = (account.requestedRole || (account.status === "ACTIVE" ? "UNASSIGNED" : "PENDING")).toUpperCase();

    return {
      id: account.id,
      name,
      email: account.email || "",
      role,
      avatar: name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase() || "??",
      status: account.status === "ACTIVE" ? "active" : "deactive",
      lastActive: account.status || "Unknown",
      currentPage: "Workspace",
      joinedAt: formatJoinedDate(account),
    };
  }, [formatJoinedDate]);



  const buildActivities = useCallback((accounts: AdminAccount[], chapterRows: ChapterStatus[]): ActivityEvent[] => {
    const accountEvents = accounts.filter(account => account.status !== "ACTIVE").slice(0, 4).map((account, index) => ({
      id: index + 1,
      type: "registration" as const,
      message: `${account.firstName || account.email || "Account"} is ${account.status || "UNKNOWN"}`,
      timestamp: "From API",
      color: "var(--mf-cyan)",
    }));
    const chapterEvents = chapterRows.slice(0, 4).map((chapter, index) => ({
      id: 100 + index,
      type: "chapter_submitted" as const,
      message: `${chapter.title} status: ${chapter.status}`,
      timestamp: "From API",
      color: "var(--mf-orange)",
    }));
    return [...accountEvents, ...chapterEvents];
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAllAccounts().catch(() => []),
      getChapters().catch(() => []),
      getSubmissions().catch(() => []),
      getWorkflowSubmissions().catch(() => []),
      getSubmissionReviews().catch(() => []),
      getVotes().catch(() => []),
      getTasks().catch(() => []),
      getSketchTasks().catch(() => []),
      getSketchPages().catch(() => []),
      getPlannings().catch(() => []),
      getProjects().catch(() => [])
    ])
      .then(([accounts, chapterRows, subRows, workflowSubRows, reviewRows, voteRows, taskRows, sketchTaskRows, sketchPageRows, planningRows, projectRows]) => {
        if (cancelled) return;
        const nonAdminAccounts = accounts.filter(a => {
          const hasAdminSystem = a.systemRole?.some(r => r.roleName === "ADMIN" || r.roleName === "MANAGER");
          const hasAdminReq = a.requestedRole?.toUpperCase() === "ADMIN";
          return !hasAdminSystem && !hasAdminReq;
        });
        const users = nonAdminAccounts.map(mapAccountToOnlineUser);

        const projectsList = projectRows || [];
        const mappedChapters = chapterRows.map((chapter, index) => {
          const rawStatus = (chapter.chapterStatus || "draft").toLowerCase();
          const allowed = ["draft", "in_review", "approved", "published", "rejected"];
          const status = (allowed.includes(rawStatus) ? rawStatus : "draft") as ChapterStatus["status"];

          const foundProj = projectsList.find(p => p.id === chapter.projectId);
          const mangaName = foundProj?.title || foundProj?.name || "Unknown Manga";

          return {
            id: chapter.id,
            manga: mangaName,
            chapter: chapter.chapterNumber ?? index + 1,
            title: chapter.title || `Chapter #${chapter.id}`,
            status,
            author: chapter.ownerName || "Unassigned",
            updatedAt: chapter.publishDate || "From API",
            progress: status === "published" ? 100 : 0,
            pages: chapter.targetPageCount || 0,
            mangaColor: ["#FF2A7A", "#39FF8A", "#00F0FF", "#FF8C42"][index % 4] || "var(--mf-cyan)",
          };
        });

        // Merge titles from workflow submissions into default DTO submissions
        const mergedSubmissions = subRows.map(sub => {
          const match = workflowSubRows.find(w => w.id === sub.id);
          return {
            ...sub,
            title: match?.title || sub.title
          };
        });

        setRegistrations(nonAdminAccounts);
        setOnlineUsers(users);
        setChapters(mappedChapters);
        setSystemSubmissions(mergedSubmissions);
        setSubmissionReviews(reviewRows);
        setVotes(voteRows);
        setTasks(taskRows || []);
        setSketchTasks(sketchTaskRows || []);
        setSketchPages(sketchPageRows || []);
        setPlannings(planningRows || []);
        setProjects(projectsList);
        setManagedUsers(users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          roles: [user.role].filter(Boolean),
          avatar: user.avatar,
          status: user.status,
          lastActive: user.lastActive,
          joinedAt: user.joinedAt,
          source: "existing" as const,
        })));
        setActivities(buildActivities(accounts, mappedChapters));
        setLastRefreshed(new Date());
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message || "Failed to load admin dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [buildActivities, mapAccountToOnlineUser]);

  const handleAddRole = useCallback((userId: number, newRole: string) => {
    setManagedUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      if (u.roles.includes(newRole)) return u;
      return { ...u, roles: [...u.roles, newRole] };
    }));
  }, []);

  const handleRemoveRole = useCallback((userId: number, role: string) => {
    setManagedUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, roles: u.roles.filter(r => r !== role) };
    }));
  }, []);

  const handleToggleStatus = useCallback(async (userId: number, currentStatus: string) => {
    try {
      if (currentStatus === "active" || currentStatus === "online") {
        await deactivateAccount(userId);
      } else {
        await activateAccount(userId);
      }

      setManagedUsers(prev => prev.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          status: (currentStatus === "active" || currentStatus === "online") ? "deactive" : "active"
        };
      }));
    } catch (err: unknown) {
      console.error("Failed to toggle status:", err);
    }
  }, []);

  const requestedTab = searchParams.get("tab");
  const currentTab = requestedTab === "chapters" || requestedTab === "users" || requestedTab === "submissions" || requestedTab === "processes" ? requestedTab : "overview";
  const activeNav = currentTab === "chapters"
    ? "Chapter Monitor"
    : currentTab === "users"
      ? "User Management"
      : currentTab === "submissions"
        ? "All Submissions"
        : currentTab === "processes"
          ? "Process Monitor"
          : "System Overview";

  return (
    <AppLayout role="admin" activeNav={activeNav}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: activeNav === "Chapter Monitor" ? "var(--mf-magenta)"
                : activeNav === "User Management" ? "var(--mf-green)"
                  : activeNav === "Process Monitor" ? "var(--mf-cyan)"
                    : "var(--mf-cyan)",
            }} />
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>{activeNav}</span>
            {activeNav === "User Management" && managedUsers.filter(u => u.roles.length === 0).length > 0 && (
              <span style={{ fontSize: 11, color: "var(--mf-orange)", padding: "2px 8px", background: "rgba(255,140,66,0.14)", borderRadius: 6, fontWeight: 700 }}>
                {managedUsers.filter(u => u.roles.length === 0).length} unassigned
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--mf-text-muted)" }}>
            <RefreshCw size={11} style={{ animation: "spin 3s linear infinite" }} />
            <span>Updated {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {loading && (
            <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)", fontSize: 14 }}>
              Loading dashboard data...
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: 18, background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", borderRadius: 12, color: "var(--mf-magenta)", fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}
          {!loading && !error && onlineUsers.length === 0 && chapters.length === 0 && registrations.length === 0 && (
            <div style={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)", fontSize: 14 }}>
              No dashboard rows found in the database.
            </div>
          )}
          {!loading && !error && currentTab === "overview" && (
            <OverviewTab
              onlineUsers={onlineUsers}
              chapters={chapters}
              registrations={registrations}
              activities={activities}
              submissions={systemSubmissions}
              submissionReviews={submissionReviews}
              votes={votes}
              tasks={tasks}
              sketchPages={sketchPages}
              plannings={plannings}
            />
          )}
          {!loading && !error && currentTab === "chapters" && (
            <ChapterMonitorTab chapters={chapters} />
          )}
          {!loading && !error && currentTab === "submissions" && (
            <SubmissionsTab chapters={chapters} />
          )}
          {!loading && !error && currentTab === "processes" && (
            <ProcessMonitorTab
              tasks={tasks}
              sketchTasks={sketchTasks}
              sketchPages={sketchPages}
              plannings={plannings}
              managedUsers={managedUsers}
            />
          )}
          {!loading && !error && currentTab === "users" && (
            <UserManagementTab managedUsers={managedUsers} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} onToggleStatus={handleToggleStatus} />
          )}
        </div>
      </div>

    </AppLayout>
  );
}
