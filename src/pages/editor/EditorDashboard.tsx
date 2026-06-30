import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  AlertTriangle, ArrowUpRight, CheckCircle, Clock, FileText,
  Image, Inbox, Link2, Loader2, RefreshCw, RotateCcw, User, X, ChevronDown,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import {
  getSubmissionById,
  getWorkflowSubmissions,
  getMangakaSubmissions,
  reviewSubmissionByTantou,
  submitToBoard,
  type AccountSummaryApi,
  type SubmissionApi,
  type SubmissionFileApi,
} from "../../services/workflowApi";
import { tokenStorage } from "../../storage/tokenStorage";
import { getAccountProfile, type AccountProfile } from "../../services/accountApi";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  pending_tantou_review: { label: "Pending Tantou Review", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  in_revision: { label: "In Revision", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  revision: { label: "In Revision", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  pending_board_review: { label: "Pending Board Review", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
  approved: { label: "Approved", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
  rejected: { label: "Rejected", color: "var(--mf-red)", bg: "rgba(255,42,122,0.14)" },
};

function normalizeStatus(status?: string | null): string {
  return (status || "pending").toLowerCase().replace(/\s+/g, "_");
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
  const resolvedSubmission = submissionForAuthorResolution(submission, lookup);
  const nested = nestedAuthorAccount(resolvedSubmission);
  const nestedName = accountDisplayName(nested);
  if (nestedName) return nestedName;

  if (lookup.loadingDetailIds.has(submission.id)) return "Loading author...";

  const id = authorId(resolvedSubmission);
  if (!id) return "N/A";
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
    if (filter === "New Proposals") return status === "pending" || status === "pending_tantou_review";
    if (filter === "In Revision") return status === "revision" || status === "in_revision";
    if (filter === "Escalated to Board") return status === "pending_board_review";
    if (filter === "Approved") return status === "approved";
    return true;
  });
}

function FileCard({ file }: { file: SubmissionFileApi }) {
  const path = filePath(file);
  const canOpen = Boolean(path && isBrowserUrl(path));
  const canPreview = Boolean(path && canOpen && isImageFile(file));
  const isPsd = isPsdFile(file);

  return (
    <div style={{ background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--mf-bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        {canPreview ? (
          <img src={path || ""} alt={fileName(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <FileText size={40} color="var(--mf-text-muted)" />
        )}
        {canOpen && (
          <a href={path || undefined} target="_blank" rel="noreferrer" title="Open File" style={{ position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
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
  );
}

function ProposalFeed({
  filter,
  submissions,
  escalatingId,
  error,
  authorLookup,
  onEscalate,
}: {
  filter: string;
  submissions: SubmissionApi[];
  escalatingId: number | null;
  error: string | null;
  authorLookup: AuthorLookupState;
  onEscalate: (submission: SubmissionApi) => void;
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

  const canEscalate = selectedSubmission && normalizeStatus(selectedSubmission.status) !== "pending_board_review";
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
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", lineHeight: 1.3, flex: 1 }}>{displayText(submission.title, `Submission #${submission.id}`)}</span>
                <StatusBadge status={submission.status} />
              </div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 7, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <User size={10} /><span>{submitterName(submission, authorLookup)}</span><span style={{ opacity: 0.4 }}>·</span><Clock size={10} /><span>{formatDateTime(submission.submittedAt)}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>ID: {submission.id}</div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: "var(--mf-text)" }}>{displayText(selectedSubmission.title, `Submission #${selectedSubmission.id}`)}</h1>
                  <StatusBadge status={selectedSubmission.status} />
                </div>
                <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--mf-text-muted)", fontWeight: 600, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={14} color="var(--mf-cyan)" />{submitterName(selectedSubmission, authorLookup)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} />{formatDateTime(selectedSubmission.submittedAt)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FileText size={14} />ID: {selectedSubmission.id}</span>
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
              onClick={() => onEscalate(selectedSubmission)}
              disabled={!canEscalate || escalatingId === selectedSubmission.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: canEscalate ? "linear-gradient(135deg, var(--mf-cyan), #0099ff)" : "var(--mf-bg-surface)", border: canEscalate ? "none" : "1px solid var(--mf-border)", borderRadius: 100, color: canEscalate ? "#000" : "var(--mf-text-muted)", fontSize: 14, fontWeight: 900, cursor: canEscalate && escalatingId !== selectedSubmission.id ? "pointer" : "not-allowed", boxShadow: canEscalate ? "0 4px 16px rgba(0,230,230,0.3)" : "none", opacity: escalatingId === selectedSubmission.id ? 0.75 : 1, transition: "transform 0.1s" }}
              onMouseDown={e => { if (canEscalate && e.currentTarget) e.currentTarget.style.transform = "scale(0.97)" }}
              onMouseUp={e => { if (canEscalate && e.currentTarget) e.currentTarget.style.transform = "none" }}
              onMouseLeave={e => { if (canEscalate && e.currentTarget) e.currentTarget.style.transform = "none" }}
            >
              {escalatingId === selectedSubmission.id ? <><Loader2 size={15} /> Escalating...</> : canEscalate ? <><ArrowUpRight size={15} /> Escalate to Board</> : <><CheckCircle size={15} /> Pending Board Review</>}
            </button>
            <button
              disabled
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "transparent", border: "1px solid rgba(255, 128, 0, 0.5)", borderRadius: 100, color: "var(--mf-orange)", fontSize: 14, fontWeight: 800, cursor: "not-allowed", opacity: 0.7 }}
            >
              <RotateCcw size={15} /> Request Revision
            </button>
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
      showToast(`"${submission.title || `Submission #${submission.id}`}" submitted to Editorial Board successfully!`, true);
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
                    {displayText(s.title, `Submission #${s.id}`)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={10} /> {s.submittedBy?.email || s.submittedBy?.username || "Unknown"}
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} /> {formatDateTime(s.submittedAt)}
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>ID: {s.id}</span>
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
                  padding: "24px 28px",
                  display: "flex", flexDirection: "column", gap: 20,
                  animation: "approved-dropdown-open 0.22s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  {/* Synopsis */}
                  {(s.contentUrl || s.description || s.note) && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 8 }}>SYNOPSIS</div>
                      <div style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.65, wordBreak: "break-word" }}>
                        {s.contentUrl || s.description || s.note}
                      </div>
                      {s.contentUrl && isBrowserUrl(s.contentUrl) && (
                        <a
                          href={s.contentUrl} target="_blank" rel="noreferrer"
                          style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(0,230,230,0.08)", borderRadius: 8, color: "var(--mf-cyan)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                        >
                          <Link2 size={12} /> Open link
                        </a>
                      )}
                    </div>
                  )}

                  {/* Files grid */}
                  {files.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12 }}>UPLOADED FILES ({files.length})</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                        {files.map((file, idx) => {
                          const path = filePath(file);
                          const canPreview = Boolean(path && isImageFile(file));
                          const isPsd = isPsdFile(file);
                          return (
                            <div key={file.id ?? idx} style={{ background: "var(--mf-bg-deep)", border: "1px solid var(--mf-border)", borderRadius: 12, overflow: "hidden" }}>
                              <div style={{ width: "100%", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                                {canPreview ? (
                                  <img src={path || ""} alt={fileName(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <FileText size={32} color="var(--mf-text-muted)" />
                                )}
                                {path && (
                                  <a href={path} target="_blank" rel="noreferrer"
                                    style={{ position: "absolute", bottom: 6, right: 6, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                                  >
                                    <ArrowUpRight size={12} />
                                  </a>
                                )}
                              </div>
                              <div style={{ padding: "8px 10px" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", wordBreak: "break-word" }}>{fileName(file)}</div>
                                <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>{formatBytes(fileSize(file))} · {fileContentType(file).split("/").pop()?.toUpperCase()}</div>
                                {isPsd && <div style={{ fontSize: 10, color: "var(--mf-magenta)", fontWeight: 800, marginTop: 3 }}>NO PREVIEW</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <div style={{ paddingTop: 4 }}>
                    <button
                      onClick={() => void handleEscalate(s)}
                      disabled={isEscalating}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "12px 28px",
                        background: isEscalating
                          ? "var(--mf-bg-deep)"
                          : "linear-gradient(135deg, var(--mf-cyan), #0099ff)",
                        border: isEscalating ? "1px solid var(--mf-border)" : "none",
                        borderRadius: 100,
                        color: isEscalating ? "var(--mf-text-muted)" : "#000",
                        fontSize: 14, fontWeight: 900,
                        cursor: isEscalating ? "not-allowed" : "pointer",
                        boxShadow: isEscalating ? "none" : "0 4px 20px rgba(0,230,230,0.3)",
                        transition: "transform 0.1s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => { if (!isEscalating) e.currentTarget.style.transform = "scale(1.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                    >
                      {isEscalating
                        ? <><Loader2 size={15} style={{ animation: "editor-spin 1s linear infinite" }} /> Submitting...</>
                        : <><ArrowUpRight size={15} /> Escalate to Board</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tantor Submissions Section ────────────────────────────────────────────────


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
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--mf-bg-surface)", borderRadius: 20,
        border: "1px solid var(--mf-border)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        width: "100%", maxWidth: 780,
        maxHeight: "92vh", overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid var(--mf-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "-0.01em" }}>
              {displayText(submission.title, `Submission #${submission.id}`)}
            </div>
            <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
              Review Submission · ID: {submission.id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 8, color: "var(--mf-text-secondary)", cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* File Previews */}
          {files.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 14, background: "var(--mf-cyan)", borderRadius: 2 }} />
                UPLOADED FILES ({files.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                {files.map((file, idx) => {
                  const path = filePath(file);
                  const canPreview = Boolean(path && isImageFile(file));
                  const isPsd = isPsdFile(file);
                  return (
                    <div key={file.id ?? idx} style={{ background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--mf-bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
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
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)", wordBreak: "break-word", marginBottom: 2 }}>{fileName(file)}</div>
                        <div style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>{formatBytes(fileSize(file))} · {fileContentType(file).split("/").pop()?.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: "var(--mf-cyan)", marginTop: 4, wordBreak: "break-all", lineHeight: 1.4 }}>
                          {filePath(file) || "No path"}
                        </div>
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
            <div style={{ fontSize: 11, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 14, background: "var(--mf-cyan)", borderRadius: 2 }} />
              REVIEW CRITERIA
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
              {([
                { label: "Pacing", value: pacingPass, onChange: setPacingPass },
                { label: "Structure", value: structurePass, onChange: setStructurePass },
                { label: "Image Flow", value: imageFlowPass, onChange: setImageFlowPass },
              ] as const).map(({ label, value, onChange }) => (
                <div key={label} style={{ background: "var(--mf-bg-deep)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--mf-border)" }}>
                  <div style={{ fontSize: 10, color: "var(--mf-text-muted)", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 8 }}>{label.toUpperCase()}</div>
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
                        appearance: "none", WebkitAppearance: "none",
                      }}
                    >
                      <option value="true">✓ Pass</option>
                      <option value="false">✗ Not Pass</option>
                    </select>
                    <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "var(--mf-green)" : "var(--mf-magenta)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Comment */}
            <div style={{ background: "var(--mf-bg-deep)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, color: "var(--mf-text-muted)", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 8 }}>COMMENT</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your review comments here..."
                rows={4}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  color: "var(--mf-text)", fontSize: 13, lineHeight: 1.6,
                  resize: "vertical", outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div style={{ padding: "12px 16px", background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", borderRadius: 10, color: "var(--mf-magenta)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} /> {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button
              onClick={() => void handleDecision("APPROVE")}
              disabled={submitting}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", background: submitting ? "var(--mf-bg-surface)" : "linear-gradient(135deg, #00e6b4, #00c8ff)",
                border: "none", borderRadius: 100, color: submitting ? "var(--mf-text-muted)" : "#000",
                fontSize: 14, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 4px 20px rgba(0,230,180,0.3)",
                transition: "transform 0.1s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              {submitting ? <Loader2 size={15} style={{ animation: "editor-spin 1s linear infinite" }} /> : <ThumbsUp size={15} />}
              APPROVE
            </button>
            <button
              onClick={() => void handleDecision("REJECT")}
              disabled={submitting}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 24px", background: "transparent",
                border: "1px solid rgba(255,42,122,0.5)", borderRadius: 100,
                color: "var(--mf-magenta)", fontSize: 14, fontWeight: 900,
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.background = "rgba(255,42,122,0.1)"; e.currentTarget.style.transform = "scale(1.02)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; }}
            >
              {submitting ? <Loader2 size={15} style={{ animation: "editor-spin 1s linear infinite" }} /> : <ThumbsDown size={15} />}
              REJECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TantorSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubmissionApi | null>(null);
  const [reviewDone, setReviewDone] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getMangakaSubmissions();
      // Filter: submittedBy has MANGAKA role AND status is SUBMITTED
      const filtered = all.filter((s) => {
        const statusUpper = (s.status || "").toUpperCase();
        if (statusUpper !== "SUBMITTED") return false;
        const by = s.submittedBy;
        if (!by || !Array.isArray(by.systemRole)) return false;
        return by.systemRole.some((r) => r.roleName === "MANGAKA");
      });
      setSubmissions(filtered);
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to load submissions.";
      setError(message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleReviewDone() {
    if (selected) setReviewDone((prev) => [...prev, selected.id]);
    setSelected(null);
    void loadData();
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.01em", margin: 0 }}>Mangaka Submissions</h2>
          <p style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Submissions with SUBMITTED status from Mangaka artists</p>
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
            <Loader2 size={20} style={{ animation: "editor-spin 1s linear infinite" }} /> Loading submissions...
          </div>
        )}
        {!loading && error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mf-magenta)", padding: "16px 20px", background: "rgba(255,42,122,0.08)", borderRadius: 12, border: "1px solid rgba(255,42,122,0.2)" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {!loading && !error && submissions.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--mf-text-muted)", paddingTop: 60 }}>
            <Inbox size={44} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: 14 }}>No pending submissions from Mangaka artists</p>
          </div>
        )}
        {!loading && !error && submissions.length > 0 && (
          <div style={{ background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border)", overflow: "hidden" }}>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px 180px 110px 160px",
              gap: 0,
              padding: "12px 20px",
              background: "var(--mf-bg-elevated)",
              borderBottom: "1px solid var(--mf-border)",
            }}>
              {["TITLE", "SUBMITTED BY", "FILES", "STATUS", "SUBMITTED AT"].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 900, color: "var(--mf-text-muted)", letterSpacing: "0.07em" }}>{h}</div>
              ))}
            </div>
            {/* Table Rows */}
            {submissions.map((s, idx) => {
              const reviewed = reviewDone.includes(s.id);
              const files = s.files || [];
              const firstFile = files[0] ?? null;
              const email = s.submittedBy?.email || s.submittedBy?.username || "N/A";
              return (
                <button
                  key={s.id}
                  onClick={() => !reviewed && setSelected(s)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 180px 180px 110px 160px",
                    gap: 0,
                    width: "100%",
                    padding: "16px 20px",
                    background: reviewed ? "rgba(0,230,180,0.04)" : "transparent",
                    border: "none",
                    borderBottom: idx < submissions.length - 1 ? "1px solid var(--mf-border)" : "none",
                    cursor: reviewed ? "default" : "pointer",
                    textAlign: "left",
                    alignItems: "center",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!reviewed) e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = reviewed ? "rgba(0,230,180,0.04)" : "transparent"; }}
                >
                  {/* Title */}
                  <div style={{ paddingRight: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", marginBottom: 2 }}>{displayText(s.title, `Submission #${s.id}`)}</div>
                    <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>ID: {s.id}</div>
                  </div>
                  {/* Submitted By Email */}
                  <div style={{ paddingRight: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={12} color="var(--mf-cyan)" />
                      <span style={{ fontSize: 12, color: "var(--mf-text-secondary)", wordBreak: "break-all" }}>{email}</span>
                    </div>
                  </div>
                  {/* Files */}
                  <div style={{ paddingRight: 16 }}>
                    {firstFile ? (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <FileText size={12} color="var(--mf-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text-secondary)", wordBreak: "break-word" }}>{fileName(firstFile)}</div>
                          <div style={{ fontSize: 10, color: "var(--mf-cyan)", marginTop: 2, wordBreak: "break-all", lineHeight: 1.4 }}>{filePath(firstFile) || "No path"}</div>
                          {files.length > 1 && <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>+{files.length - 1} more</div>}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--mf-text-muted)" }}>No files</span>
                    )}
                  </div>
                  {/* Status */}
                  <div>
                    <span style={{ padding: "3px 10px", background: "var(--mf-cyan-dim)", color: "var(--mf-cyan)", fontSize: 10, fontWeight: 800, borderRadius: 100, letterSpacing: "0.06em", border: "1px solid var(--mf-cyan)35", whiteSpace: "nowrap" }}>
                      {s.status || "N/A"}
                    </span>
                  </div>
                  {/* Submitted At */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={11} color="var(--mf-text-muted)" />
                    <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>{formatDateTime(s.submittedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <ReviewModal
          submission={selected}
          onClose={() => setSelected(null)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  );
}

// ─── Main EditorDashboard ───────────────────────────────────────────────────
export function EditorDashboard() {
  const [activeNav, setActiveNav] = useState("New Proposals");
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

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const rows = await getWorkflowSubmissions();
      setSubmissions(rows);
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

  async function handleEscalate(submission: SubmissionApi) {
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
        decision: "APPROVED",
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

  const isTantorSubmissionsView = activeNav === "Mangaka Submissions";
  const isApprovedView = activeNav === "Approved";

  return (
    <AppLayout role="editor" activeNav={activeNav} onNavClick={setActiveNav}>
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
        {/* Top bar — hidden for the Mangaka Submissions view (it has its own header) */}
        {!isTantorSubmissionsView && (
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

        {/* Mangaka Submissions view */}
        {isTantorSubmissionsView && <TantorSubmissions />}

        {/* Approved accordion view */}
        {isApprovedView && !isTantorSubmissionsView && !loading && (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ApprovedList
              submissions={submissions}
              onRefresh={() => void loadSubmissions()}
            />
          </div>
        )}
        {isApprovedView && !isTantorSubmissionsView && loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--mf-text-muted)" }}>
            <Loader2 size={18} style={{ animation: "editor-spin 1s linear infinite" }} />
            Loading approved submissions...
          </div>
        )}

        {/* Regular ProposalFeed views (all except Approved & Mangaka Submissions) */}
        {!isTantorSubmissionsView && !isApprovedView && (
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
                onEscalate={(submission) => void handleEscalate(submission)}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
