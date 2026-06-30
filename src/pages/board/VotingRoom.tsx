import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  CheckCircle, ThumbsUp, ThumbsDown, Clock, User,
  Package, AlertCircle, Loader2, RefreshCw, FileX, Image,
} from "lucide-react";
import {
  getSubmissions,
  getSubmissionReviews,
  type SubmissionApi,
  type SubmissionReviewApi,
} from "../../services/workflowApi";

// ─── helpers ────────────────────────────────────────────────────────────────
const BOARD_STATUSES = ["PENDING_BOARD_REVIEW", "APPROVED", "REJECTED"];

function isTantorAccount(s: SubmissionApi): boolean {
  const roles = s.submittedBy?.systemRole ?? [];
  return roles.some(r => r.roleName?.toUpperCase() === "TANTOR");
}

function statusLabel(status: string | null | undefined): string {
  switch ((status ?? "").toUpperCase()) {
    case "PENDING_BOARD_REVIEW": return "Pending";
    case "APPROVED": return "Approved";
    case "REJECTED": return "Rejected";
    default: return status ?? "Unknown";
  }
}

function statusColor(status: string | null | undefined): string {
  switch ((status ?? "").toUpperCase()) {
    case "APPROVED": return "var(--mf-green)";
    case "REJECTED": return "var(--mf-magenta)";
    case "PENDING_BOARD_REVIEW": return "var(--mf-orange)";
    default: return "var(--mf-text-muted)";
  }
}

function decisionColor(decision: string | null | undefined): string {
  switch ((decision ?? "").toUpperCase()) {
    case "APPROVED": return "var(--mf-green)";
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
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName(f));
}

// ─── VotingRoom ──────────────────────────────────────────────────────────────
export function VotingRoom() {
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [allReviews, setAllReviews] = useState<SubmissionReviewApi[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<"approve" | "reject" | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, revs] = await Promise.all([getSubmissions(), getSubmissionReviews()]);
      const filtered = subs.filter(
        s => BOARD_STATUSES.includes((s.status ?? "").toUpperCase()) && isTantorAccount(s)
      );
      setSubmissions(filtered);
      setAllReviews(revs);
      setSelectedId(prev => {
        if (prev && filtered.some(s => s.id === prev)) return prev;
        return filtered[0]?.id ?? null;
      });
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Failed to load data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submission = submissions.find(s => s.id === selectedId) ?? null;
  const reviews = allReviews.filter(r => r.submissionId === selectedId);
  const files = submission?.files ?? [];

  const handleAction = async (action: "approve" | "reject") => {
    setActionBusy(action);
    await new Promise(r => setTimeout(r, 800));
    setActionBusy(null);
    showToast(
      action === "approve" ? "Submission approved successfully." : "Submission rejected.",
      action === "approve",
    );
    void load();
  };

  if (loading) {
    return (
      <AppLayout role="board">
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--mf-text-muted)" }}>
          <Loader2 size={18} style={{ animation: "vr-spin 1s linear infinite" }} />
          Loading submissions…
          <style>{`@keyframes vr-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppLayout>
    );
  }

  if (error && submissions.length === 0) {
    return (
      <AppLayout role="board">
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-magenta)", padding: 24 }}>
          <AlertCircle size={32} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{error}</span>
          <button onClick={() => void load()} style={{ padding: "7px 16px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-muted)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="board">
      <style>{`
        @keyframes vr-spin { to { transform: rotate(360deg); } }
        @keyframes vr-toast { from { opacity: 0; transform: translateY(-10px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .vr-sub-btn:hover { border-color: rgba(255,140,66,0.5) !important; background: var(--mf-bg-elevated) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 99999,
          padding: "12px 22px", borderRadius: 12,
          background: toast.ok ? "rgba(0,230,160,0.12)" : "rgba(255,42,122,0.12)",
          border: `1px solid ${toast.ok ? "rgba(0,230,160,0.4)" : "rgba(255,42,122,0.4)"}`,
          color: toast.ok ? "var(--mf-green)" : "var(--mf-magenta)",
          fontSize: 13, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "vr-toast 0.25s ease",
          whiteSpace: "nowrap",
        }}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}

      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

        {/* ── LEFT: Submission list ─────────────────────────────────── */}
        <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.01em" }}>Publishing Votes</h2>
              <p style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 3 }}>Board approval required</p>
            </div>
            <button onClick={() => void load()} style={{ padding: "5px 7px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 7, color: "var(--mf-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <RefreshCw size={11} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.08em", padding: "6px 4px 8px" }}>AWAITING VOTE</div>

            {submissions.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>
                <Package size={28} style={{ opacity: 0.3, margin: "0 auto 8px", display: "block" }} />
                No submissions found.
              </div>
            ) : (
              submissions.map(s => (
                <button
                  key={s.id}
                  className="vr-sub-btn"
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    display: "block", width: "100%", padding: "12px 14px", marginBottom: 7,
                    background: selectedId === s.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)",
                    border: `1px solid ${selectedId === s.id ? "rgba(255,140,66,0.45)" : "var(--mf-border)"}`,
                    borderRadius: 11, cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-text)", marginBottom: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title || `Submission #${s.id}`}
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
                      {statusLabel(s.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── MIDDLE: Submission detail ─────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--mf-border)" }}>
          {submission ? (
            <>
              {/* Header */}
              <div style={{ padding: "16px 24px 13px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", flexShrink: 0 }}>
                <h1 style={{ fontSize: 18, fontWeight: 900, marginBottom: 5 }}>
                  {submission.title || `Submission #${submission.id}`}
                </h1>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--mf-text-muted)", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <User size={11} />
                    {submission.submittedBy?.email ?? submission.submittedBy?.username ?? "—"}
                  </span>
                  <span style={{
                    padding: "2px 9px", borderRadius: 100, fontSize: 10, fontWeight: 800,
                    background: `${statusColor(submission.status)}18`,
                    color: statusColor(submission.status),
                    border: `1px solid ${statusColor(submission.status)}40`,
                  }}>
                    {statusLabel(submission.status)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> {formatDT(submission.submittedAt)}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Submitted by card */}
                <div style={{ padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>SUBMITTED BY</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,140,66,0.12)", border: "1px solid rgba(255,140,66,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={18} color="var(--mf-orange)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)" }}>
                        {[submission.submittedBy?.firstName, submission.submittedBy?.lastName].filter(Boolean).join(" ") || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>
                        {submission.submittedBy?.email ?? "—"}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--mf-orange)", fontWeight: 700, marginTop: 2 }}>
                        {submission.submittedBy?.systemRole?.map(r => r.roleName).join(", ") ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Files */}
                {files.length > 0 ? (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>
                      UPLOADED FILES ({files.length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                      {files.map((f, idx) => {
                        const path = filePath(f);
                        const canPreview = Boolean(path && isImage(f));
                        return (
                          <div key={f.id ?? idx} style={{ background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 10, overflow: "hidden" }}>
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
                              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text)", wordBreak: "break-all", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {fileName(f)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)", color: "var(--mf-text-muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileX size={16} /> No files attached to this submission.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>
              Select a submission to review.
            </div>
          )}
        </div>

        {/* ── RIGHT: Reviews + Actions ──────────────────────────────── */}
        <div style={{ width: 320, flexShrink: 0, background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {submission ? (
            <>
              {/* APPROVE / REJECT buttons */}
              <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--mf-border)", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 4 }}>BOARD DECISION</div>
                <button
                  onClick={() => void handleAction("approve")}
                  disabled={actionBusy !== null}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12,
                    background: actionBusy ? "var(--mf-bg-elevated)" : "linear-gradient(135deg, #00e6a0, #00b87a)",
                    border: actionBusy ? "1px solid var(--mf-border)" : "none",
                    color: actionBusy ? "var(--mf-text-muted)" : "#000",
                    fontSize: 13, fontWeight: 900, cursor: actionBusy ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: actionBusy ? "none" : "0 4px 20px rgba(0,230,160,0.3)",
                    transition: "transform 0.1s",
                  }}
                  onMouseEnter={e => { if (!actionBusy) e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                >
                  {actionBusy === "approve"
                    ? <><Loader2 size={14} style={{ animation: "vr-spin 1s linear infinite" }} /> Approving…</>
                    : <><ThumbsUp size={14} /> APPROVE</>}
                </button>
                <button
                  onClick={() => void handleAction("reject")}
                  disabled={actionBusy !== null}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    background: "transparent",
                    border: "1px solid rgba(255,42,122,0.45)",
                    color: "var(--mf-magenta)",
                    fontSize: 13, fontWeight: 900, cursor: actionBusy ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: actionBusy ? 0.6 : 1,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!actionBusy) e.currentTarget.style.background = "rgba(255,42,122,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {actionBusy === "reject"
                    ? <><Loader2 size={14} style={{ animation: "vr-spin 1s linear infinite" }} /> Rejecting…</>
                    : <><ThumbsDown size={14} /> REJECT</>}
                </button>
              </div>

              {/* Reviews list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 12 }}>
                  SUBMISSION REVIEWS ({reviews.length})
                </div>

                {reviews.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--mf-text-muted)", fontSize: 12, padding: "24px 0" }}>
                    No reviews for this submission.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ padding: "12px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 12 }}>
                        {/* Reviewer email + decision */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 145 }}>
                            {r.reviewerEmail ?? `Reviewer #${r.reviewerId}`}
                          </span>
                          <span style={{
                            padding: "2px 8px", borderRadius: 100, fontSize: 9, fontWeight: 800,
                            background: `${decisionColor(r.decision)}15`,
                            color: decisionColor(r.decision),
                            border: `1px solid ${decisionColor(r.decision)}40`,
                            flexShrink: 0,
                          }}>
                            {r.decision ?? "—"}
                          </span>
                        </div>

                        {/* Stage */}
                        {r.stage && (
                          <div style={{ fontSize: 9, color: "var(--mf-text-muted)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 5 }}>
                            {r.stage.replace(/_/g, " ")}
                          </div>
                        )}

                        {/* Comment */}
                        {r.comment && (
                          <div style={{ fontSize: 11, color: "var(--mf-text-muted)", lineHeight: 1.55, marginBottom: 6 }}>
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
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)", fontSize: 12 }}>
              No submission selected.
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
