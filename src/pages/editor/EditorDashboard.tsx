import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  AlertTriangle, ArrowUpRight, CheckCircle, Clock, FileText,
  Image, Inbox, Link2, Loader2, RefreshCw, RotateCcw, User,
} from "lucide-react";
import {
  getSubmissionById,
  getWorkflowSubmissions,
  reviewSubmissionByTantou,
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
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 240, right: 0, zIndex: 10 }}>
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 10 }}>
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
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: 53, overflow: "hidden" }}>
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
      </div>
    </AppLayout>
  );
}
