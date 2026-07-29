
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  AlertTriangle, ArrowUpRight, CheckCircle, Clock, FileText,
  Image, Inbox, Link2, Loader2, RefreshCw, RotateCcw, User,
  ThumbsUp, ThumbsDown, ChevronDown,
} from "lucide-react";
import {
  getSubmissionById,
  getSubmissions,
  reviewSubmissionByBoard,
  submitToBoard,
  type AccountSummaryApi,
  type SubmissionApi,
  type SubmissionFileApi,
} from "../../services/workflowApi";
import { tokenStorage } from "../../storage/tokenStorage";
import { getAccountProfile, type AccountProfile } from "../../services/accountApi";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:               { label: "Pending",            color: "var(--mf-cyan)",    bg: "var(--mf-cyan-dim)" },
  pending_tantou_review: { label: "Pending Review",     color: "var(--mf-cyan)",    bg: "var(--mf-cyan-dim)" },
  submitted:             { label: "Pending Review",     color: "var(--mf-cyan)",    bg: "var(--mf-cyan-dim)" },
  in_revision:           { label: "In Revision",        color: "var(--mf-orange)",  bg: "rgba(255,140,66,0.14)" },
  revision:              { label: "In Revision",        color: "var(--mf-orange)",  bg: "rgba(255,140,66,0.14)" },
  pending_board_review:  { label: "Voting In Progress", color: "var(--mf-green)",   bg: "var(--mf-green-dim)" },
  on_going:              { label: "Pending to Board",   color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
  approved:              { label: "Approved by Board",  color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
  rejected:              { label: "Rejected",           color: "var(--mf-red)",     bg: "rgba(255,42,122,0.14)" },
};

function normalizeStatus(status?: string | null): string {
  return (status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
}
function statusLabel(status?: string | null): string {
  return statusConfig[normalizeStatus(status)]?.label || status || "N/A";
}
function StatusBadge({ status }: { status?: string | null }) {
  const normalized = normalizeStatus(status);
  const s = statusConfig[normalized] || statusConfig.pending;
  return <span style={{ padding: "3px 10px", background: s.bg, color: s.color, fontSize: 10, fontWeight: 800, borderRadius: 100, letterSpacing: "0.06em", border: `1px solid ${s.color}35`, whiteSpace: "nowrap" }}>{statusLabel(status)}</span>;
}
function formatDateTime(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function displayText(value?: string | number | null, empty = "Not provided"): string {
  return (value === null || value === undefined || value === "") ? empty : String(value);
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
  return nestedAuthorAccounts(submission).find((a) => Boolean(a && accountDisplayName(a))) || null;
}
function extractId(val: any): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string" && !isNaN(Number(val))) return Number(val);
  return null;
}
function authorId(submission: any): number | null {
  const nestedId = nestedAuthorAccounts(submission).find((a) => typeof a?.id === "number")?.id;
  return nestedId ?? extractId(submission.submittedBy) ?? extractId(submission.submitted_by)
    ?? extractId(submission.account) ?? extractId(submission.createdBy)
    ?? extractId(submission.created_by) ?? extractId(submission.mangaka)
    ?? extractId(submission.submittedById) ?? extractId(submission.accountId)
    ?? extractId(submission.createdById) ?? extractId(submission.mangakaId) ?? null;
}
function needsAuthorLookup(s: SubmissionApi): boolean { return !nestedAuthorAccount(s) && Boolean(authorId(s)); }
function hasNoAuthorData(s: SubmissionApi): boolean { return !nestedAuthorAccount(s) && !authorId(s); }
function needsSubmissionDetailLookup(s: SubmissionApi): boolean { return hasNoAuthorData(s); }

function submitterName(submission: SubmissionApi, lookup: AuthorLookupState): string {
  if (submission.submittedByName && submission.submittedByName !== "null null" && submission.submittedByName.trim() !== "") return submission.submittedByName;
  if (submission.submittedBy) {
    const nameStr = [submission.submittedBy.firstName, submission.submittedBy.lastName].filter(Boolean).join(" ").trim();
    if (nameStr && nameStr !== "null null") return nameStr;
    if (submission.submittedBy.email) return submission.submittedBy.email;
    if (submission.submittedBy.username) return submission.submittedBy.username;
    if (submission.submittedBy.name) return submission.submittedBy.name;
  }
  const anySub = submission as any;
  if (anySub.mangakaName) return anySub.mangakaName;
  const resolved = submissionForAuthorResolution(submission, lookup);
  const nestedName = accountDisplayName(nestedAuthorAccount(resolved));
  if (nestedName) return nestedName;
  if (lookup.loadingDetailIds.has(submission.id)) return "Loading author...";
  const id = authorId(resolved);
  if (!id) return "Unknown";
  if (lookup.names[id]?.name) return lookup.names[id].name;
  if (lookup.loadingIds.has(id)) return "Loading author...";
  return `Mangaka #${id}`;
}

function formatBytes(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let size = value / 1024, unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex += 1; }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
function fileName(file: SubmissionFileApi): string { return displayText(file.originalName || file.originalFilename || file.fileName || file.filename, "N/A"); }
function filePath(file: SubmissionFileApi): string | null { return file.url || file.fileUrl || file.path || file.filePath || null; }
function fileSize(file: SubmissionFileApi): number | null | undefined { return file.size ?? file.fileSize; }
function fileContentType(file: SubmissionFileApi): string { return displayText(file.contentType || file.mimeType, "N/A"); }
function isBrowserUrl(value: string): boolean { return /^(https?:\/\/|data:image\/|blob:|\/)/i.test(value); }
function isPsdFile(file: SubmissionFileApi): boolean {
  const ct = (file.contentType || file.mimeType || "").toLowerCase();
  return ct.includes("photoshop") || ct.includes("psd") || fileName(file).toLowerCase().endsWith(".psd");
}
function isImageFile(file: SubmissionFileApi): boolean {
  if (isPsdFile(file)) return false;
  const ct = (file.contentType || file.mimeType || "").toLowerCase();
  const path = filePath(file) || fileName(file);
  return ["image/png","image/jpeg","image/jpg","image/gif","image/webp","image/svg+xml"].includes(ct) || /\.(png|jpe?g|gif|webp|svg)$/i.test(path);
}
function hasValue(v?: string|number|null): boolean { return v !== null && v !== undefined && v !== ""; }
function hasPlanningData(s: SubmissionApi): boolean {
  const p = s.planning;
  return Boolean(p && (hasValue(p.id)||hasValue(p.title)||hasValue(p.name)||hasValue(p.status)||hasValue(p.startDate)||hasValue(p.endDate)));
}
function hasProjectData(s: SubmissionApi): boolean {
  const p = s.project;
  return Boolean(p && (hasValue(p.id)||hasValue(p.title)||hasValue(p.name)||hasValue(p.status)||hasValue(p.description)));
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 20, padding: 20, background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", ...style }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "0.08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 4, height: 14, background: "var(--mf-orange)", borderRadius: 2 }} />{title}
      </div>
      {children}
    </div>
  );
}
function FieldRow({ label, value }: { label: string; value?: string|number|null }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--mf-bg-deep)", borderRadius: 8, border: "1px solid var(--mf-border)" }}>
      <div style={{ fontSize: 10, color: "var(--mf-text-muted)", fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.45, wordBreak: "break-word" }}>{displayText(value, "N/A")}</div>
    </div>
  );
}

function FileCard({ file }: { file: SubmissionFileApi }) {
  const path = filePath(file);
  const canOpen = Boolean(path && isBrowserUrl(path));
  const canPreview = Boolean(path && canOpen && isImageFile(file));
  const isPsd = isPsdFile(file);
  const isPdf = fileContentType(file).toLowerCase().includes("pdf") || fileName(file).toLowerCase().endsWith(".pdf");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string|null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fetchError, setFetchError] = useState<string|null>(null);

  useEffect(() => {
    if (!previewOpen || !path) {
      if (objectUrl?.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
      setObjectUrl(null); setFetchError(null); return;
    }
    const fetchPath = path.replace(/https?:\/\/[^\/]+(\/uploads\/)/, "$1");
    let active = true;
    (async () => {
      setLoadingPreview(true); setFetchError(null);
      try {
        const token = tokenStorage.getToken();
        const res = await fetch(fetchPath, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const blob = await res.blob();
        const displayBlob = (isPdf && blob.type !== "application/pdf") ? new Blob([blob], { type: "application/pdf" }) : blob;
        if (active) setObjectUrl(URL.createObjectURL(displayBlob));
      } catch (err) {
        if (active) { setFetchError(err instanceof Error ? err.message : String(err)); setObjectUrl(path); }
      } finally { if (active) setLoadingPreview(false); }
    })();
    return () => { active = false; };
  }, [previewOpen, path, isPdf]);

  return (
    <>
      <div onClick={() => { if (canOpen && !isPsd) setPreviewOpen(true); }} style={{ background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s", cursor: (canOpen && !isPsd) ? "pointer" : "default" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
        <div style={{ width: "100%", aspectRatio: "3/4", background: "var(--mf-bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          {canPreview ? <img src={path||""} alt={fileName(file)} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <FileText size={40} color="var(--mf-text-muted)" />}
          {canOpen && <a href={path||undefined} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ position:"absolute", bottom:8, right:8, width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", border:"1px solid rgba(255,255,255,0.2)" }}><ArrowUpRight size={16} /></a>}
        </div>
        <div style={{ padding:12, display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"var(--mf-text)", wordBreak:"break-word", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{fileName(file)}</div>
          <div style={{ fontSize:11, color:"var(--mf-text-muted)", fontWeight:700 }}>{formatBytes(fileSize(file))} • {fileContentType(file).split("/").pop()?.toUpperCase()}</div>
          {isPsd && <div style={{ fontSize:10, color:"var(--mf-magenta)", fontWeight:800, marginTop:4 }}>NO PREVIEW</div>}
        </div>
      </div>
      {previewOpen && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent style={{ maxWidth:"90vw", height:"90vh", padding:0, overflow:"hidden", backgroundColor:"#0a0a0a", borderColor:"#222" }}>
            <DialogTitle className="sr-only">Preview {fileName(file)}</DialogTitle>
            {loadingPreview ? (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--mf-text-muted)" }}><Loader2 size={32} /></div>
            ) : isPdf ? (
              <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", backgroundColor:"#fff" }}>
                {fetchError && <div style={{ padding:10, background:"#fff3f3", color:"#d32f2f", fontSize:12, borderBottom:"1px solid #ffcdd2" }}>Warning: {fetchError} <a href={path||""} target="_blank" rel="noreferrer" style={{ marginLeft:8, textDecoration:"underline", fontWeight:"bold" }}>Open Manually</a></div>}
                <object data={objectUrl||""} type="application/pdf" style={{ width:"100%", flex:1, border:"none" }}>
                  <embed src={objectUrl||""} type="application/pdf" style={{ width:"100%", height:"100%", border:"none" }} />
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:20 }}>
                    <p style={{ color:"#000", marginBottom:12 }}>Browser does not support inline PDF.</p>
                    <a href={path||""} target="_blank" rel="noreferrer" style={{ padding:"8px 16px", background:"var(--mf-orange)", color:"#000", borderRadius:8, textDecoration:"none", fontWeight:800 }}>Open in New Tab</a>
                  </div>
                </object>
              </div>
            ) : canPreview ? (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}><img src={objectUrl||""} alt={fileName(file)} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} /></div>
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--mf-text-muted)" }}>Preview not available.</div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ReviewModal({ submission, onClose, onDone }: { submission: SubmissionApi; onClose: ()=>void; onDone: ()=>void }) {
  const [pacingPass, setPacingPass] = useState(true);
  const [structurePass, setStructurePass] = useState(true);
  const [imageFlowPass, setImageFlowPass] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string|null>(null);
  const files = submission.files || [];

  async function handleDecision(decision: "APPROVE"|"REJECT") {
    const reviewerId = tokenStorage.getAccount()?.id;
    if (!reviewerId) { setSubmitError("Cannot review: account ID not found."); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      await reviewSubmissionByBoard({ submissionId: submission.id, reviewerId, decision, comment, pacingPass, structurePass, imageFlowPass });
      onDone();
    } catch (err) {
      setSubmitError(err && typeof err === "object" && "message" in err ? String(err.message) : "Review failed.");
    } finally { setSubmitting(false); }
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:1200, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"var(--mf-bg-surface)", border:"1px solid var(--mf-border)", borderRadius:16, width:"100%", maxWidth:780, boxShadow:"0 20px 40px rgba(0,0,0,0.5)", maxHeight:"92vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"24px 32px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{displayText(submission.title, "Untitled Submission")}</div>
            <div style={{ fontSize:12, color:"var(--mf-text-muted)", marginTop:4 }}>Board Review & Revise</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, cursor:"pointer", color:"var(--mf-text-muted)", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"28px 32px 32px", display:"flex", flexDirection:"column", gap:24 }}>
          {files.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:"var(--mf-text-muted)", letterSpacing:"0.08em", marginBottom:14 }}>UPLOADED FILES ({files.length})</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:14 }}>
                {files.map((file, idx) => {
                  const path = filePath(file);
                  const canPreview = Boolean(path && isImageFile(file));
                  const isPsd = isPsdFile(file);
                  return (
                    <div key={file.id??idx} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, overflow:"hidden" }}>
                      <div style={{ width:"100%", aspectRatio:"3/4", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", background:"rgba(255,255,255,0.01)" }}>
                        {canPreview ? <img src={path||""} alt={fileName(file)} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <FileText size={36} color="var(--mf-text-muted)" />}
                        {path && <a href={path} target="_blank" rel="noreferrer" style={{ position:"absolute", bottom:8, right:8, width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,0.7)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><ArrowUpRight size={13} /></a>}
                      </div>
                      <div style={{ padding:"10px 12px" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--mf-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fileName(file)}</div>
                        <div style={{ fontSize:10, color:"var(--mf-text-muted)" }}>{formatBytes(fileSize(file))}</div>
                        {isPsd && <div style={{ fontSize:10, color:"var(--mf-magenta)", fontWeight:800 }}>NO PREVIEW</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:"var(--mf-text-muted)", letterSpacing:"0.08em", marginBottom:14 }}>REVIEW CRITERIA</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14, marginBottom:16 }}>
              {([
                { label:"Pacing", value:pacingPass, onChange:setPacingPass },
                { label:"Structure", value:structurePass, onChange:setStructurePass },
                { label:"Image Flow", value:imageFlowPass, onChange:setImageFlowPass },
              ] as const).map(({ label, value, onChange }) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.02)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize:10, color:"var(--mf-text-muted)", fontWeight:800, letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>
                  <div style={{ position:"relative" }}>
                    <select value={value?"true":"false"} onChange={(e)=>onChange(e.target.value==="true")} style={{ width:"100%", padding:"8px 32px 8px 12px", background:value?"rgba(0,230,180,0.1)":"rgba(255,42,122,0.08)", border:`1px solid ${value?"rgba(0,230,180,0.35)":"rgba(255,42,122,0.35)"}`, borderRadius:8, color:value?"var(--mf-green)":"var(--mf-magenta)", fontSize:13, fontWeight:700, cursor:"pointer", appearance:"none", WebkitAppearance:"none", outline:"none" }}>
                      <option value="true" style={{ background:"var(--mf-bg-deep)", color:"var(--mf-green)" }}>✓ Pass</option>
                      <option value="false" style={{ background:"var(--mf-bg-deep)", color:"var(--mf-magenta)" }}>✗ Not Pass</option>
                    </select>
                    <ChevronDown size={13} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:value?"var(--mf-green)":"var(--mf-magenta)" }} />
                  </div>
                </div>
              ))}
            </div>
            <label style={{ display:"block", fontSize:10, fontWeight:800, color:"var(--mf-text-muted)", marginBottom:8, letterSpacing:"0.08em" }}>COMMENT</label>
            <textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Add review comments..." rows={4}
              style={{ width:"100%", padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontSize:14, fontWeight:500, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
          </div>
          {submitError && <div style={{ padding:"12px 16px", background:"rgba(255,42,109,0.1)", border:"1px solid rgba(255,42,109,0.3)", color:"var(--mf-magenta)", borderRadius:10, fontSize:13, fontWeight:700 }}>{submitError}</div>}
          <div style={{ display:"flex", gap:12, paddingTop:4 }}>
            <button onClick={()=>void handleDecision("APPROVE")} disabled={submitting} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px 24px", background:"var(--mf-orange)", border:"none", borderRadius:10, color:"#000", fontSize:13, fontWeight:800, cursor:submitting?"not-allowed":"pointer", opacity:submitting?0.7:1 }}>
              {submitting?<Loader2 size={15}/>:<ThumbsUp size={15}/>} APPROVE
            </button>
            <button onClick={()=>void handleDecision("REJECT")} disabled={submitting} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px 24px", background:"transparent", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, color:"var(--mf-text)", fontSize:13, fontWeight:800, cursor:submitting?"not-allowed":"pointer" }}>
              {submitting?<Loader2 size={15}/>:<ThumbsDown size={15}/>} REJECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProposalFeed({ submissions, escalatingId, error, authorLookup, onApprove, onStartBoardVoting, onReview }: {
  submissions: SubmissionApi[]; escalatingId: number|null; error: string|null; authorLookup: AuthorLookupState;
  onApprove: (s: SubmissionApi)=>void; onStartBoardVoting: (s: SubmissionApi)=>void; onReview?: (s: SubmissionApi)=>void;
}) {
  const [selected, setSelected] = useState<number|null>(null);
  const filtered = useMemo(()=>submissions.filter(s=>{ const st=normalizeStatus(s.nameStatus??s.status); return st==="pending"||st==="pending_tantou_review"||st==="submitted"||st==="pending_board_review"||st==="approved"||st==="rejected"; }), [submissions]);
  const selectedSubmission = filtered.find(s=>s.id===selected)||filtered[0];
  const effectiveSelected = selectedSubmission?.id??null;

  if (filtered.length===0) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"var(--mf-text-muted)" }}>
      <Inbox size={40} style={{ opacity:0.3 }} /><p style={{ fontSize:14 }}>No new proposals found</p>
    </div>
  );

  const selectedStatus = normalizeStatus(selectedSubmission?.nameStatus??selectedSubmission?.status);
  const canApprove = ["pending","pending_tantou_review","submitted","pending_board_review"].includes(selectedStatus);
  const resolvedSelected = selectedSubmission ? submissionForAuthorResolution(selectedSubmission, authorLookup) : selectedSubmission;
  const files = resolvedSelected?.files||[];

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      <div style={{ width:350, flexShrink:0, borderRight:"1px solid var(--mf-border)", background:"var(--mf-bg-base)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid var(--mf-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:900, margin:0 }}>New Proposals</h2>
            <p style={{ fontSize:11, color:"var(--mf-text-muted)", marginTop:2 }}>{filtered.length} submission{filtered.length!==1?"s":""}</p>
          </div>
          <div style={{ padding:"4px 10px", background:"rgba(255,140,66,0.12)", border:"1px solid rgba(255,140,66,0.3)", borderRadius:7, fontSize:10, color:"var(--mf-orange)", fontWeight:800 }}>{filtered.length}</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"10px" }}>
          {filtered.map(s=>(
            <button key={s.id} onClick={()=>setSelected(s.id)} style={{ display:"block", width:"100%", padding:"12px 13px", marginBottom:7, background:effectiveSelected===s.id?"var(--mf-bg-elevated)":"var(--mf-bg-surface)", border:`1px solid ${effectiveSelected===s.id?"rgba(255,140,66,0.3)":"var(--mf-border)"}`, borderRadius:12, cursor:"pointer", textAlign:"left", transition:"all 0.12s" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6, gap:8 }}>
                <span style={{ fontSize:13, fontWeight:800, color:"var(--mf-text)", lineHeight:1.3, flex:1 }}>{displayText(s.title,"Untitled Submission")}</span>
                <StatusBadge status={s.nameStatus??s.status} />
              </div>
              <div style={{ fontSize:11, color:"var(--mf-text-muted)", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <User size={10}/><span>{submitterName(s,authorLookup)}</span><span style={{ opacity:0.4 }}>·</span><Clock size={10}/><span>{formatDateTime(s.submittedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {selectedSubmission && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ flex:1, overflowY:"auto", padding:"30px 40px", display:"flex", flexDirection:"column", gap:24 }}>
            {error && <div style={{ padding:14, background:"rgba(255,42,122,0.08)", border:"1px solid rgba(255,42,122,0.25)", borderRadius:10, color:"var(--mf-magenta)", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}><AlertTriangle size={15}/>{error}</div>}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <StatusBadge status={selectedSubmission.nameStatus??selectedSubmission.status}/>
                <span style={{ fontSize:11, color:"var(--mf-text-muted)", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>Awaiting Board Review</span>
              </div>
              <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:"-0.02em", margin:0, color:"var(--mf-text)" }}>{displayText(selectedSubmission.title,"Untitled Submission")}</h1>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:12, fontSize:12, color:"var(--mf-text-muted)" }}>
                <span style={{ display:"flex", alignItems:"center", gap:6 }}><Clock size={14}/>{formatDateTime(selectedSubmission.submittedAt)}</span>
                <span style={{ display:"flex", alignItems:"center", gap:6 }}><User size={14}/>{submitterName(selectedSubmission,authorLookup)}</span>
              </div>
            </div>
            <Section title="SYNOPSIS" style={{ background:"var(--mf-bg-deep)" }}>
              <div style={{ fontSize:14, color:"var(--mf-text-secondary)", lineHeight:1.6, wordBreak:"break-word" }}>
                {selectedSubmission.contentUrl||selectedSubmission.description||selectedSubmission.note||<span style={{ color:"var(--mf-text-muted)" }}>No synopsis provided.</span>}
              </div>
              {selectedSubmission.contentUrl&&isBrowserUrl(selectedSubmission.contentUrl)&&(
                <a href={selectedSubmission.contentUrl} target="_blank" rel="noreferrer" style={{ marginTop:16, display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", background:"rgba(255,140,66,0.1)", borderRadius:8, color:"var(--mf-orange)", fontSize:12, fontWeight:800, textDecoration:"none" }}>
                  <Link2 size={14}/> Open attached link
                </a>
              )}
            </Section>
            {(hasPlanningData(resolvedSelected||selectedSubmission)||hasProjectData(resolvedSelected||selectedSubmission))&&(
              <Section title="METADATA">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12 }}>
                  {hasProjectData(resolvedSelected||selectedSubmission)&&<><FieldRow label="PROJECT" value={resolvedSelected?.project?.title||selectedSubmission.project?.title||"N/A"}/><FieldRow label="PROJECT STATUS" value={resolvedSelected?.project?.status||selectedSubmission.project?.status||"N/A"}/></>}
                  {hasPlanningData(resolvedSelected||selectedSubmission)&&<><FieldRow label="PLANNING" value={resolvedSelected?.planning?.title||selectedSubmission.planning?.title||"N/A"}/><FieldRow label="DEADLINE" value={formatDateTime(resolvedSelected?.planning?.endDate||selectedSubmission.planning?.endDate)}/></>}
                </div>
              </Section>
            )}
            <Section title={`UPLOADED FILES (${files.length})`}>
              {files.length===0 ? <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--mf-text-muted)", fontSize:13, padding:10 }}><Image size={15}/> No uploaded files found.</div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:16 }}>{files.map((file,i)=><FileCard key={file.id??`${fileName(file)}-${i}`} file={file}/>)}</div>}
            </Section>
          </div>
          {!["approved", "rejected"].includes(selectedStatus) && (
            <div style={{ position:"sticky", bottom:0, padding:"16px 40px", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(10,10,10,0.85)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", gap:12, zIndex:10 }}>
              <button onClick={()=>canApprove?onApprove(selectedSubmission):onStartBoardVoting(selectedSubmission)} disabled={escalatingId===selectedSubmission.id}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", background:"linear-gradient(135deg, var(--mf-orange), #ff6b35)", border:"none", borderRadius:100, color:"#000", fontSize:14, fontWeight:900, cursor:escalatingId!==selectedSubmission.id?"pointer":"not-allowed", boxShadow:"0 4px 16px rgba(255,140,66,0.35)", opacity:escalatingId===selectedSubmission.id?0.75:1 }}>
                {escalatingId===selectedSubmission.id?<><Loader2 size={15}/> Processing...</>:<><CheckCircle size={15}/> Approve</>}
              </button>
              {onReview&&<button onClick={()=>onReview(selectedSubmission)} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", background:"transparent", border:"1px solid rgba(255,128,0,0.5)", borderRadius:100, color:"var(--mf-orange)", fontSize:14, fontWeight:800, cursor:"pointer" }}><RotateCcw size={15}/> Review & Revise</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BoardProposalsPage() {
  const [submissions, setSubmissions] = useState<SubmissionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [actionError, setActionError] = useState<string|null>(null);
  const [escalatingId, setEscalatingId] = useState<number|null>(null);
  const [authorNames, setAuthorNames] = useState<Record<number,{name:string;email?:string|null}>>({});
  const [loadingAuthorIds, setLoadingAuthorIds] = useState<Set<number>>(new Set());
  const [failedAuthorIds, setFailedAuthorIds] = useState<Set<number>>(new Set());
  const [submissionDetails, setSubmissionDetails] = useState<Record<number,SubmissionApi>>({});
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<number>>(new Set());
  const [failedDetailIds, setFailedDetailIds] = useState<Set<number>>(new Set());
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionApi|null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true); setError(null); setActionError(null);
    try {
      const [rows, reviews] = await Promise.all([getSubmissions(), import("../../services/workflowApi").then(m=>m.getSubmissionReviews())]);
      const reviewMap = new Map<number,number>();
      for (const r of reviews) if (r.decision==="REJECTED"||r.decision==="REJECT") reviewMap.set(Number(r.submissionId),(reviewMap.get(Number(r.submissionId))||0)+1);
      setSubmissions(rows.map(s=>reviewMap.get(s.id)!>=2&&(s.nameStatus??s.status)!=="APPROVED"?{...s,nameStatus:"REJECTED",status:"REJECTED"}:s));
    } catch (err) { setError(err&&typeof err==="object"&&"message"in err?String(err.message):"Failed to load."); setSubmissions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ void loadSubmissions(); },[loadSubmissions]);

  useEffect(()=>{
    const ids=submissions.filter(needsSubmissionDetailLookup).map(s=>s.id).filter(id=>!submissionDetails[id]&&!loadingDetailIds.has(id)&&!failedDetailIds.has(id));
    if(!ids.length)return;
    setLoadingDetailIds(cur=>new Set([...cur,...ids]));
    ids.forEach(id=>{
      getSubmissionById(id).then(detail=>setSubmissionDetails(cur=>({...cur,[id]:detail}))).catch(()=>setFailedDetailIds(cur=>new Set([...cur,id]))).finally(()=>setLoadingDetailIds(cur=>{const n=new Set(cur);n.delete(id);return n;}));
    });
  },[submissions,submissionDetails,loadingDetailIds,failedDetailIds]);

  useEffect(()=>{
    const resolvedSubs=submissions.map(s=>submissionForAuthorResolution(s,{names:authorNames,loadingIds:loadingAuthorIds,failedIds:failedAuthorIds,detailBySubmissionId:submissionDetails,loadingDetailIds,failedDetailIds}));
    const ids=Array.from(new Set(resolvedSubs.filter(needsAuthorLookup).map(authorId).filter((id):id is number=>typeof id==="number")));
    const missingIds=ids.filter(id=>!authorNames[id]&&!loadingAuthorIds.has(id)&&!failedAuthorIds.has(id));
    if(!missingIds.length)return;
    setLoadingAuthorIds(cur=>new Set([...cur,...missingIds]));
    missingIds.forEach(id=>{
      getAccountProfile(id).then(a=>{setAuthorNames(cur=>({...cur,[id]:{name:accountDisplayName(a)||`Mangaka #${id}`,email:a.email}}));}).catch(()=>setFailedAuthorIds(cur=>new Set([...cur,id]))).finally(()=>setLoadingAuthorIds(cur=>{const n=new Set(cur);n.delete(id);return n;}));
    });
  },[submissions,submissionDetails,loadingDetailIds,failedDetailIds,authorNames,loadingAuthorIds,failedAuthorIds]);

  async function handleApprove(submission: SubmissionApi) {
    const reviewerId=tokenStorage.getAccount()?.id;
    if(!reviewerId){setActionError("Cannot approve: account ID not found.");return;}
    setEscalatingId(submission.id);setActionError(null);
    try{await reviewSubmissionByBoard({submissionId:submission.id,reviewerId,decision:"APPROVE",comment:"Approved by Editorial Board",pacingPass:true,structurePass:true,imageFlowPass:true});await loadSubmissions();}
    catch(err){setActionError(err&&typeof err==="object"&&"message"in err?String(err.message):"Failed to approve.");}
    finally{setEscalatingId(null);}
  }

  async function handleStartBoardVoting(submission: SubmissionApi) {
    const accountId=tokenStorage.getAccount()?.id;
    if(!accountId){setActionError("Cannot start voting: account ID not found.");return;}
    setEscalatingId(submission.id);setActionError(null);
    try{await submitToBoard(submission.id,accountId);await loadSubmissions();}
    catch(err){setActionError(err&&typeof err==="object"&&"message"in err?String(err.message):"Failed to start board voting.");}
    finally{setEscalatingId(null);}
  }

  const authorLookup:AuthorLookupState={names:authorNames,loadingIds:loadingAuthorIds,failedIds:failedAuthorIds,detailBySubmissionId:submissionDetails,loadingDetailIds,failedDetailIds};

  return (
    <AppLayout role="board" activeNav="New Proposals">
      <div style={{ display:"flex", height:"100%", overflow:"hidden", flexDirection:"column" }}>
        <div style={{ flexShrink:0, borderBottom:"1px solid var(--mf-border)", background:"var(--mf-bg-base)", display:"flex", alignItems:"center", gap:10, padding:"14px 22px" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--mf-orange)" }}/>
          <span style={{ fontSize:15, fontWeight:900 }}>New Proposals</span>
          <button onClick={()=>void loadSubmissions()} disabled={loading} style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, padding:"6px 11px", background:"var(--mf-bg-surface)", border:"1px solid var(--mf-border)", borderRadius:8, color:"var(--mf-text-secondary)", fontSize:12, fontWeight:800, cursor:loading?"default":"pointer", opacity:loading?0.65:1 }}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {loading&&<div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"var(--mf-text-muted)" }}><Loader2 size={18}/> Loading submissions...</div>}
          {!loading&&error&&<div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"var(--mf-magenta)", padding:24, textAlign:"center" }}><AlertTriangle size={34}/><div style={{ fontSize:14, fontWeight:800 }}>{error}</div></div>}
          {!loading&&!error&&submissions.length===0&&<div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, color:"var(--mf-text-muted)" }}><Inbox size={40} style={{ opacity:0.3 }}/><p style={{ fontSize:14 }}>No submissions found</p></div>}
          {!loading&&!error&&submissions.length>0&&<ProposalFeed submissions={submissions} escalatingId={escalatingId} error={actionError} authorLookup={authorLookup} onApprove={s=>void handleApprove(s)} onStartBoardVoting={s=>void handleStartBoardVoting(s)} onReview={s=>setReviewingSubmission(s)}/>}
        </div>
      </div>
      {reviewingSubmission&&<ReviewModal submission={reviewingSubmission} onClose={()=>setReviewingSubmission(null)} onDone={()=>{setReviewingSubmission(null);void loadSubmissions();}}/>}
    </AppLayout>
  );
}

