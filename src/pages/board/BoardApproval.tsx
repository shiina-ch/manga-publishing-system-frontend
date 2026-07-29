import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  DollarSign,
  User, Clock, TrendingUp,
  Star, Package, AlertCircle, Loader2, Image, RefreshCw, FileX,
} from "lucide-react";
import { getProjects } from "../../services/projectApi";
import { getPlannings, getSubmissions, getSubmissionReviews, type SubmissionApi, type SubmissionReviewApi } from "../../services/workflowApi";
import { ActiveProjectsView } from "./ActiveProjectsView";
import { getAccountProfile } from "../../services/accountApi";

const BOARD_STATUSES = ["PENDING_BOARD_REVIEW", "APPROVED", "REJECTED"];

function normalizeStatus(status: string | null | undefined): string {
  return (status ?? "").toUpperCase().replace(/-/g, "_");
}

function normalizeStatusLabel(status: string | null | undefined): string {
  switch (normalizeStatus(status)) {
    case "PENDING_BOARD_REVIEW": return "Voting In Progress";
    case "APPROVED": return "Approved";
    case "REJECTED": return "Rejected";
    default: return status ?? "Unknown";
  }
}

function statusColor(status: string | null | undefined): string {
  switch (normalizeStatus(status)) {
    case "APPROVED": return "var(--mf-green)";
    case "REJECTED": return "var(--mf-magenta)";
    case "PENDING_BOARD_REVIEW": return "var(--mf-cyan)";
    default: return "var(--mf-text-muted)";
  }
}

function decisionColor(decision: string | null | undefined): string {
  switch ((decision ?? "").toUpperCase()) {
    case "APPROVE":
    case "APPROVED": return "var(--mf-green)";
    case "REJECT":
    case "REJECTED": return "var(--mf-magenta)";
    default: return "var(--mf-orange)";
  }
}

function formatDT(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}

function filePath(f: NonNullable<SubmissionApi["files"]>[number]): string {
  return f.filePath ?? f.url ?? f.fileUrl ?? f.path ?? "";
}
function fileName(f: NonNullable<SubmissionApi["files"]>[number]): string {
  return f.originalName ?? f.originalFilename ?? f.fileName ?? f.filename ?? "file";
}
function isImage(f: NonNullable<SubmissionApi["files"]>[number]): boolean {
  const name = fileName(f).toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name);
}

// ─── Pending Approvals View ─────────────────────────────────────────────────
function PendingApprovalsView() {
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [allReviews, setAllReviews] = useState<SubmissionReviewApi[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, revs] = await Promise.all([getSubmissions(), getSubmissionReviews()]);
      
      const reviewMap = new Map<number, number>();
      for (const r of revs) {
        if (r.decision === "REJECTED" || r.decision === "REJECT") {
          const subId = Number(r.submissionId);
          reviewMap.set(subId, (reviewMap.get(subId) || 0) + 1);
        }
      }
      
      const updatedSubs = subs.map(s => {
        const rejectCount = reviewMap.get(s.id) || 0;
        if (rejectCount >= 2 && s.status !== "APPROVED") {
          return { ...s, status: "REJECTED" };
        }
        return s;
      });

      const filtered = updatedSubs.filter(s => BOARD_STATUSES.includes(normalizeStatus(s.status)));
      setSubmissions(filtered);
      setAllReviews(revs);
      setSelected(prev => {
        if (prev && filtered.some(s => s.id === prev)) return prev;
        return filtered[0]?.id ?? null;
      });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const reviewerIds = Array.from(new Set(
      allReviews
        .map(r => r.reviewerId)
        .filter((id): id is number => typeof id === "number")
    ));

    reviewerIds.forEach(id => {
      if (!reviewerNames[id]) {
        getAccountProfile(id)
          .then(profile => {
            const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.email;
            setReviewerNames(prev => ({ ...prev, [id]: name }));
          })
          .catch(() => {
            // fallback
            const fallbackVal = allReviews.find(r => r.reviewerId === id)?.reviewerEmail || `Tantou Editor #${id}`;
            setReviewerNames(prev => ({ ...prev, [id]: fallbackVal }));
          });
      }
    });
  }, [allReviews, reviewerNames]);

  const submission = submissions.find(s => s.id === selected) ?? null;
  const reviews = allReviews.filter(r => Number(r.submissionId) === Number(selected) && r.stage?.toUpperCase() === "EDITORIAL_BOARD");
  const files = submission?.files ?? [];

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--mf-text-muted)" }}>
        <Loader2 size={18} style={{ animation: "board-spin 1s linear infinite" }} />
        Loading pending submissions…
        <style>{`@keyframes board-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-magenta)", padding: 24 }}>
        <AlertCircle size={32} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{error}</span>
        <button onClick={() => void load()} style={{ padding: "7px 16px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-text-muted)" }}>
        <Package size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>No board-level submissions found.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes board-spin { to { transform: rotate(360deg); } }
        @keyframes board-toast-in { from { opacity: 0; transform: translateY(-12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .board-sub-btn:hover { border-color: rgba(255,140,66,0.45) !important; background: var(--mf-bg-elevated) !important; }
      `}</style>

      {/* ── Left: Awaiting Vote list ── */}
      <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 900 }}>Awaiting Vote</h2>
            <p style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>Board approval required</p>
          </div>
          <button onClick={() => void load()} style={{ padding: "5px 8px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 7, color: "var(--mf-text-muted)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={11} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {submissions.map(s => (
            <button
              key={s.id}
              className="board-sub-btn"
              onClick={() => setSelected(s.id)}
              style={{
                display: "block", width: "100%", padding: "12px 14px", marginBottom: 7,
                background: selected === s.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)",
                border: `1px solid ${selected === s.id ? "rgba(255,140,66,0.5)" : "var(--mf-border)"}`,
                borderRadius: 12, cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.title || "Untitled Submission"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={9} /> {formatDT(s.submittedAt)}
                </span>
                <span style={{
                  padding: "2px 7px", borderRadius: 100, fontSize: 9, fontWeight: 800,
                  background: `${statusColor(s.status)}18`,
                  color: statusColor(s.status),
                  border: `1px solid ${statusColor(s.status)}40`,
                }}>
                  {normalizeStatusLabel(s.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Middle: Submission detail ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--mf-border)" }}>
        {submission ? (
          <>
            {/* Header */}
            <div style={{ padding: "16px 24px 13px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", flexShrink: 0 }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                {submission.title || "Untitled Submission"}
              </h1>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--mf-text-muted)", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <User size={11} />
                  {submission.submittedByName || submission.submittedBy?.email || submission.submittedBy?.username || "—"}
                </span>
                <span style={{
                  padding: "2px 9px", borderRadius: 100, fontSize: 10, fontWeight: 800,
                  background: `${statusColor(submission.status)}18`,
                  color: statusColor(submission.status),
                  border: `1px solid ${statusColor(submission.status)}40`,
                }}>
                  {normalizeStatusLabel(submission.status)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} /> {formatDT(submission.submittedAt)}
                </span>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Submitted by info */}
              <div style={{ padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>SUBMITTED BY</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--mf-orange-dim, rgba(255,140,66,0.12))", border: "1px solid rgba(255,140,66,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={16} color="var(--mf-orange)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>
                      {submission.submittedByName || [submission.submittedBy?.firstName, submission.submittedBy?.lastName].filter(Boolean).join(" ") || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>
                      {submission.submittedBy?.email ?? "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--mf-orange)", fontWeight: 700, marginTop: 2 }}>
                      Mangaka
                    </div>
                  </div>
                </div>
              </div>

              {/* Escalated by info */}
              {allReviews.find(r => Number(r.submissionId) === Number(selected) && r.stage?.toUpperCase() === "EDITORIAL") && (() => {
                const tantouReview = allReviews.find(r => Number(r.submissionId) === Number(selected) && r.stage?.toUpperCase() === "EDITORIAL");
                return (
                  <div style={{ padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>ESCALATED BY</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,230,230,0.12)", border: "1px solid rgba(0,230,230,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={16} color="var(--mf-cyan)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>
                          {tantouReview?.reviewerId ? (reviewerNames[Number(tantouReview.reviewerId)] || submission.reviewerName || tantouReview.reviewerEmail || `Tantou Editor #${tantouReview.reviewerId}`) : "—"}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--mf-cyan)", fontWeight: 700, marginTop: 2 }}>
                          Tantou Editor
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Files */}
              {files.length > 0 ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>UPLOADED FILES ({files.length})</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                    {files.map((f, idx) => {
                      const path = filePath(f);
                      const canPreview = Boolean(path && isImage(f));
                      return (
                        <div key={f.id ?? idx} style={{ background: "var(--mf-bg-deep, var(--mf-bg-elevated))", border: "1px solid var(--mf-border)", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ width: "100%", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "var(--mf-bg-elevated)" }}>
                            {canPreview ? (
                              <img src={path} alt={fileName(f)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <FileX size={28} color="var(--mf-text-muted)" />
                            )}
                            {path && (
                              <a href={path} target="_blank" rel="noreferrer" style={{ position: "absolute", bottom: 5, right: 5, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                                <Image size={11} />
                              </a>
                            )}
                          </div>
                          <div style={{ padding: "7px 9px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text)", wordBreak: "break-all", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{fileName(f)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "16px", background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)", color: "var(--mf-text-muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileX size={16} /> No files attached to this submission.
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>Select a submission to review.</div>
        )}
      </div>

      {/* ── Right: Actions + Reviews ── */}
      <div style={{ width: 300, flexShrink: 0, background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {submission && (
          <>
            {/* Voting notice */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--mf-border)", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 4 }}>BOARD DECISION</div>
              <div style={{ padding: "12px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 10, color: "var(--mf-text-muted)", fontSize: 12, lineHeight: 1.55 }}>
                Voting actions are handled on the active board voting page at /board/voting. This view only displays submissions and real review records returned by the API.
              </div>
            </div>

            {/* Reviews list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>
                EDITORIAL REVIEWS ({reviews.length})
              </div>
              {reviews.length === 0 ? (
                <div style={{ color: "var(--mf-text-muted)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>No reviews yet for this submission.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ padding: "12px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 12 }}>
                      {/* Reviewer email + decision */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                          {r.reviewerId ? (reviewerNames[Number(r.reviewerId)] || r.reviewerEmail || `Reviewer #${r.reviewerId}`) : (r.reviewerEmail ?? "—")}
                        </span>
                        <span style={{
                          padding: "2px 8px", borderRadius: 100, fontSize: 9, fontWeight: 800,
                          background: `${decisionColor(r.decision)}15`,
                          color: decisionColor(r.decision),
                          border: `1px solid ${decisionColor(r.decision)}40`,
                        }}>
                          {r.decision ?? "—"}
                        </span>
                      </div>
                      {/* Stage badge */}
                      {r.stage && (
                        <div style={{ fontSize: 9, color: "var(--mf-text-muted)", fontWeight: 700, marginBottom: 5, letterSpacing: "0.04em" }}>
                          {r.stage.replace(/_/g, " ")}
                        </div>
                      )}
                      {/* Comment */}
                      {r.comment && (
                        <div style={{ fontSize: 11, color: "var(--mf-text-secondary, var(--mf-text-muted))", lineHeight: 1.55, marginBottom: 6 }}>
                          {r.comment}
                        </div>
                      )}
                      {/* Reviewed at */}
                      <div style={{ fontSize: 10, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={9} /> {formatDT(r.reviewedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {!submission && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>No submission selected.</div>
        )}
      </div>
    </div>
  );
}


// --- Publishing Calendar View ---
function PublishingCalendarView() {
  const daysInJuly = 31;
  const firstDay = 3; // July 1, 2026 is Wednesday
  const today = 2;
  const [eventsByDay, setEventsByDay] = useState<Record<number, { title: string; color: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPlannings()
      .then(rows => {
        if (cancelled) return;
        const colors = ["var(--mf-green)", "var(--mf-cyan)", "var(--mf-orange)", "var(--mf-magenta)"];
        const grouped = rows.reduce<Record<number, { title: string; color: string }[]>>((acc, row, index) => {
          const date = row.startDate ? new Date(row.startDate) : null;
          if (!date || Number.isNaN(date.getTime())) return acc;
          const day = date.getDate();
          acc[day] = [...(acc[day] || []), { title: row.title || `Planning #${row.id}`, color: colors[index % colors.length] }];
          return acc;
        }, {});
        setEventsByDay(grouped);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message || "Failed to load publishing calendar.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>Loading publishing calendar...</div>;
  }

  if (error) {
    return <div style={{ flex: 1, padding: 24, color: "var(--mf-magenta)" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Publishing Calendar</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>July 2026 — Scheduled Releases</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {Object.values(eventsByDay).flat().map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: e.color }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color }} />
              <span style={{ color: "var(--mf-text-muted)" }}>{e.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--mf-border)" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ padding: "12px 0", textAlign: "center", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.06em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: "1px solid var(--mf-border)", borderBottom: "1px solid var(--mf-border)" }} />)}
          {[...Array(daysInJuly)].map((_, i) => {
            const day = i + 1;
            const events = eventsByDay[day] || [];
            const isToday = day === today;
            return (
              <div key={day} style={{ minHeight: 80, padding: 8, borderRight: "1px solid var(--mf-border)", borderBottom: "1px solid var(--mf-border)", background: isToday ? "rgba(255,42,122,0.06)" : "transparent", position: "relative" }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 900 : 600, color: isToday ? "var(--mf-magenta)" : "var(--mf-text-muted)", marginBottom: 5, width: 24, height: 24, borderRadius: "50%", background: isToday ? "var(--mf-magenta)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</div>
                {events.map((ev, ei) => (
                  <div key={ei} style={{ padding: "2px 6px", background: `${ev.color}20`, border: `1px solid ${ev.color}40`, borderRadius: 4, fontSize: 9, color: ev.color, fontWeight: 700, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Budget Overview View ---
function BudgetOverviewView() {
  const [items, setItems] = useState<{ project: string; allocated: number; spent: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalAllocated = items.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = items.reduce((s, b) => s + b.spent, 0);
  const remaining = totalAllocated - totalSpent;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProjects()
      .then(projects => {
        if (cancelled) return;
        setItems(projects.flatMap((project, index) => {
          if (typeof project.allocated !== "number" || typeof project.budget !== "number" || project.allocated <= 0) return [];
          const colors = ["var(--mf-cyan)", "var(--mf-orange)", "var(--mf-magenta)", "var(--mf-green)"];
          return [{
            project: project.title || `Project ID ${project.id}`,
            allocated: project.allocated,
            spent: project.budget,
            color: colors[index % colors.length],
          }];
        }));
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message || "Failed to load project budget data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>Loading project budgets...</div>;
  }

  if (error) {
    return <div style={{ flex: 1, padding: 24, color: "var(--mf-magenta)" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Budget Overview</h2>
        <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>FY2026 Q3 — All Active Projects</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Allocated", value: `$${totalAllocated.toLocaleString()}`, color: "var(--mf-cyan)", icon: DollarSign },
          { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, color: "var(--mf-orange)", icon: TrendingUp },
          { label: "Remaining", value: `$${remaining.toLocaleString()}`, color: "var(--mf-green)", icon: Star },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ padding: 20, background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={16} color={s.color} /></div>
                <span style={{ fontSize: 11, color: "var(--mf-text-muted)", fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length === 0 && (
          <div style={{ padding: 24, background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", color: "var(--mf-text-muted)", textAlign: "center" }}>
            No project budget rows found in the database.
          </div>
        )}
        {items.map(b => (
          <div key={b.project} style={{ padding: "16px 20px", background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color, flexShrink: 0 }} />
            <div style={{ width: 160, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>{b.project}</div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>${b.spent.toLocaleString()} / ${b.allocated.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(b.spent / b.allocated) * 100}%`, background: b.color, borderRadius: 100 }} />
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: b.color, width: 44, textAlign: "right" }}>{Math.round((b.spent / b.allocated) * 100)}%</div>
            <div style={{ fontSize: 11, color: "var(--mf-green)", fontWeight: 700, width: 80, textAlign: "right" }}>+${(b.allocated - b.spent).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardApproval() {
  const [searchParams] = useSearchParams();
  const activeNav = (() => {
    switch (searchParams.get("tab")) {
      case "active-projects": return "Active Projects";
      case "publishing-calendar": return "Publishing Calendar";
      case "budget-overview": return "Budget Overview";
      default: return "Pending Approvals";
    }
  })();

  return (
    <AppLayout role="board" activeNav={activeNav}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mf-orange)" }} />
          <span style={{ fontSize: 15, fontWeight: 900 }}>{activeNav}</span>
          {activeNav === "Active Projects" && <span style={{ fontSize: 11, color: "var(--mf-orange)", padding: "2px 8px", background: "rgba(255,140,66,0.14)", borderRadius: 6, fontWeight: 700 }}>Series</span>}
        </div>
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {activeNav === "Pending Approvals" && <PendingApprovalsView />}
          {activeNav === "Active Projects" && <ActiveProjectsView />}
          {activeNav === "Publishing Calendar" && <PublishingCalendarView />}
          {activeNav === "Budget Overview" && <BudgetOverviewView />}
        </div>
      </div>
    </AppLayout>
  );
}
