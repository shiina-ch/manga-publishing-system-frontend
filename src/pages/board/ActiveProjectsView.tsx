import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Calendar, Check, CheckCircle, ChevronDown, Edit3, FileText, Loader2, Package, Plus, RefreshCw, Save, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import { tokenStorage } from "../../storage/tokenStorage";
import { getAllAccounts, type AdminAccount } from "../../services/adminApi";
import { searchAccountByEmail } from "../../services/accountApi";
import {
  assignTantouToProject,
  createProject,
  getProjectById,
  getProjects,
  updateProject,
  updateProjectByBoard,
  type CreateProjectPayload,
  type ProjectAccountSummary,
  type ProjectFromApi,
  type UpdateProjectPayload,
  type UpdateProjectBoardPayload,
} from "../../services/projectApi";

const CARD_COLORS = ["var(--mf-cyan)", "var(--mf-orange)", "var(--mf-magenta)", "var(--mf-green)"];
const PROJECT_ASSIGNMENT_CACHE_KEY = "board_project_tantou_assignments";

interface CachedProjectAssignment {
  projectId: number;
  tantouId?: number;
  displayName?: string;
  email?: string;
  assignedAt: string;
  source: "backend" | "successful-assignment" | "already-assigned-error";
}

interface ResolvedProjectAssignment {
  assigned: boolean;
  displayText: string | null;
  tantouId?: number;
}

type ProjectAssignmentCache = Record<number, CachedProjectAssignment>;

const actionButtonStyle = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 8,
  background: "var(--mf-orange)",
  color: "#000",
  fontSize: 12,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  gap: 6,
} as const;

const fieldStyle = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--mf-border)",
  background: "var(--mf-bg-elevated)",
  color: "var(--mf-text)",
  fontSize: 13,
} as const;

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("code" in error && typeof error.code === "number") return error.code;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isAssignmentSource(value: unknown): value is CachedProjectAssignment["source"] {
  return value === "backend" || value === "successful-assignment" || value === "already-assigned-error";
}

function readAssignmentCache(): ProjectAssignmentCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PROJECT_ASSIGNMENT_CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const cache: ProjectAssignmentCache = {};
    Object.values(parsed).forEach(value => {
      if (!isRecord(value)) return;
      const projectId = positiveInteger(value.projectId);
      const assignedAt = nonEmptyString(value.assignedAt);
      if (!projectId || !assignedAt || !isAssignmentSource(value.source)) return;

      const assignment: CachedProjectAssignment = {
        projectId,
        assignedAt,
        source: value.source,
      };
      const tantouId = positiveInteger(value.tantouId);
      const displayName = nonEmptyString(value.displayName);
      const email = nonEmptyString(value.email);
      if (tantouId) assignment.tantouId = tantouId;
      if (displayName) assignment.displayName = displayName;
      if (email) assignment.email = email;
      cache[projectId] = assignment;
    });
    return cache;
  } catch {
    return {};
  }
}

function writeAssignmentCache(cache: ProjectAssignmentCache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROJECT_ASSIGNMENT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage can be unavailable or full; the current session state still remains usable.
  }
}

function saveCachedAssignment(assignment: CachedProjectAssignment): void {
  const cache = readAssignmentCache();
  cache[assignment.projectId] = assignment;
  writeAssignmentCache(cache);
}

function getCachedAssignment(projectId: number, cache = readAssignmentCache()): CachedProjectAssignment | null {
  return cache[projectId] ?? null;
}

function readableAccountName(account?: ProjectAccountSummary | null): string | null {
  if (!account) return null;
  const fullName = `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim();
  return fullName || account.name?.trim() || account.username?.trim() || account.email?.trim() || null;
}

function accountName(account?: ProjectAccountSummary | null): string {
  return readableAccountName(account) ?? "—";
}

function hasAssignedTantou(project: ProjectFromApi): boolean {
  return positiveInteger(project.tantou?.id) !== null || positiveInteger(project.tantouId) !== null || Boolean(project.ownerName) || Boolean(project.tantouName);
}

function resolveProjectAssignment(
  project: ProjectFromApi,
  cache: ProjectAssignmentCache,
): ResolvedProjectAssignment {
  const backendTantouId = positiveInteger(project.tantou?.id) || positiveInteger(project.tantouId) || positiveInteger(project.ownerId);
  const backendTantouName = readableAccountName(project.tantou) || project.tantouName || project.ownerName;

  if (backendTantouId || backendTantouName) {
    const identity = backendTantouName || (backendTantouId ? `Tantou #${backendTantouId}` : undefined);
    return {
      assigned: true,
      displayText: identity ? `Assigned to ${identity}` : `Assigned to Tantou #${backendTantouId}`,
      tantouId: backendTantouId ?? undefined,
    };
  }

  const cached = getCachedAssignment(project.id, cache);
  if (!cached) return { assigned: false, displayText: null };

  const identity = cached.displayName || cached.email;
  if (identity) {
    return { assigned: true, displayText: `Assigned to ${identity}`, tantouId: cached.tantouId };
  }
  if (cached.tantouId) {
    return { assigned: true, displayText: `Assigned to Tantou #${cached.tantouId}`, tantouId: cached.tantouId };
  }
  return { assigned: true, displayText: "Tantou Assigned" };
}

function backendCachedAssignment(
  project: ProjectFromApi,
  previous?: CachedProjectAssignment,
): CachedProjectAssignment | null {
  const tantouId = positiveInteger(project.tantou?.id) || positiveInteger(project.tantouId) || positiveInteger(project.ownerId);
  const displayName = readableAccountName(project.tantou) || project.tantouName || project.ownerName || previous?.displayName;

  if (!tantouId && !displayName) return null;

  return {
    projectId: project.id,
    ...(tantouId ? { tantouId } : {}),
    ...(displayName ? { displayName } : {}),
    assignedAt: previous?.assignedAt ?? new Date().toISOString(),
    source: "backend",
  };
}

function isAlreadyAssignedError(error: unknown): boolean {
  return errorMessage(error, "").toLowerCase().includes("project already has a tantou assigned");
}

function mergeProjectLists(current: ProjectFromApi[], incoming: ProjectFromApi[]): ProjectFromApi[] {
  const currentById = new Map(current.map(project => [project.id, project]));
  return incoming.map(project => {
    const existing = currentById.get(project.id);
    return {
      ...existing,
      ...project,
      createdAt: project.createdAt || existing?.createdAt,
    };
  });
}

function accountOption(account: AdminAccount): string {
  const fullName = `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim();
  return `${fullName || account.email} (${account.email})${account.status ? ` — ${account.status}` : ""}`;
}

function successfulAssignmentCacheEntry(
  projectId: number,
  tantouId: number,
  account?: AdminAccount,
): CachedProjectAssignment {
  const fullName = `${account?.firstName ?? ""} ${account?.lastName ?? ""}`.trim();
  const displayName = fullName || account?.username?.trim();
  const email = account?.email?.trim();
  return {
    projectId,
    tantouId,
    ...(displayName ? { displayName } : {}),
    ...(email ? { email } : {}),
    assignedAt: new Date().toISOString(),
    source: "successful-assignment",
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function CustomSelect({
  value,
  options,
  disabled,
  onChange,
  accentColor = "var(--mf-cyan)"
}: {
  value: string | number;
  options: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  onChange: (val: any) => void;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "6px 12px",
          background: "rgba(0, 240, 255, 0.06)",
          border: `1px solid ${accentColor}`,
          borderRadius: 8,
          color: accentColor,
          fontSize: 13,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.15s ease",
          boxShadow: open ? `0 0 10px ${accentColor}30` : "none"
        }}
      >
        <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
          {selectedOption?.label || String(value)}
        </span>
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease", flexShrink: 0, marginLeft: 6 }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1300 }}
            onClick={() => setOpen(false)}
          />
          <div
            className="custom-select-menu"
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 1301,
              background: "var(--mf-bg-surface, #161622)",
              border: "1px solid var(--mf-border, rgba(255,255,255,0.15))",
              borderRadius: 8,
              boxShadow: "0 -10px 25px rgba(0,0,0,0.6)",
              maxHeight: 114,
              overflowY: "auto",
              padding: "4px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0, 240, 255, 0.3) transparent"
            }}
          >
            {options.map(opt => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? accentColor : "var(--mf-text-secondary, #e0e0e0)",
                    background: isSelected ? "rgba(0, 240, 255, 0.12)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{opt.label}</span>
                  {isSelected && <Check size={12} color={accentColor} />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface ProjectDetailsDialogProps {
  project: ProjectFromApi | null;
  assignmentCache: ProjectAssignmentCache;
  loading: boolean;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSave: (payload: UpdateProjectPayload, boardPayload?: UpdateProjectBoardPayload) => Promise<boolean>;
}

function ProjectDetailsDialog({ project, assignmentCache, loading, error, saving, onClose, onRetry, onSave }: ProjectDetailsDialogProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("ACTIVE");
  const [tantouId, setTantouId] = useState<number>(0);
  const [tantouAccounts, setTantouAccounts] = useState<AdminAccount[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const account = tokenStorage.getAccount();
  const isLeaderBoard = Boolean(
    account?.systemRole?.some((r: any) => r.roleName === "LEADER_BOARD" || r.roleName === "LEADER") ||
    account?.requestedRole === "LEADER_BOARD" ||
    tokenStorage.hasRole("LEADER_BOARD")
  );

  useEffect(() => {
    if (project) {
      setWorkflowStatus(project.projectWorkflowStatus || "ACTIVE");
      setTantouId(project.tantouId || project.tantou?.id || 0);
    }
  }, [project]);

  useEffect(() => {
    if (isLeaderBoard && tantouAccounts.length === 0) {
      getAllAccounts()
        .then(accs => {
          if (Array.isArray(accs)) {
            const tantous = accs.filter(acc => {
              if (acc.systemRole && Array.isArray(acc.systemRole)) {
                return acc.systemRole.some(r => r.roleName === "TANTOU_EDITOR" || r.roleName?.includes("TANTOU"));
              }
              return acc.requestedRole === "TANTOU_EDITOR" || acc.requestedRole === "TANTOU";
            });
            const list = tantous.length > 0 ? tantous : accs;
            setTantouAccounts(list);
            if (list.length > 0) {
              setTantouId(current => {
                if (current && list.some(a => a.id === current)) return current;
                return list[0].id;
              });
            }
          }
        })
        .catch(console.error);
    }
  }, [isLeaderBoard, tantouAccounts.length]);

  const beginEditing = () => {
    if (!project) return;
    setTitle(project.title ?? "");
    setDescription(project.description ?? "");
    setStatus(project.status ?? "");
    setWorkflowStatus(project.projectWorkflowStatus || "ACTIVE");
    setTantouId(project.tantouId || project.tantou?.id || 0);
    setValidationError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (project) {
      setTitle(project.title ?? "");
      setDescription(project.description ?? "");
      setStatus(project.status ?? "");
      setWorkflowStatus(project.projectWorkflowStatus || "ACTIVE");
      setTantouId(project.tantouId || project.tantou?.id || 0);
    }
    setValidationError(null);
    setEditing(false);
  };

  const save = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError("Title is required.");
      return;
    }
    const payload: UpdateProjectPayload = { title: trimmedTitle, description: description.trim() };
    const trimmedStatus = status.trim();
    if (trimmedStatus) payload.status = trimmedStatus;
    else if (project?.status) payload.status = project.status;

    let boardPayload: UpdateProjectBoardPayload | undefined;
    if (isLeaderBoard) {
      boardPayload = {
        projectWorkflowStatus: workflowStatus,
        tantouId: Number(tantouId) || 0
      };
    }

    if (await onSave(payload, boardPayload)) setEditing(false);
  };

  const assignment = project ? resolveProjectAssignment(project, assignmentCache) : null;
  const rows = project ? [
    ["Genre", project.genre || "—"],
    ["Target audience", project.targetAudience || "—"],
    ["Format", project.format || "—"],
    ["Workflow status", project.projectWorkflowStatus || "—"],
    ["Tantou", assignment?.assigned ? (assignment.displayText?.replace(/^Assigned to /, "") ?? "Tantou Assigned") : (project.ownerName || "—")],
    ["Created", formatDate(project.createdAt)],
    ["Start date", formatDate(project.startDate)],
    ["Expected end", formatDate(project.expectedEndDate)],
    ["Current phase", project.currentPhase || "—"],
    ["Mangaka", accountName(project.mangaka) !== "—" ? accountName(project.mangaka) : (project.mangakaName || "—")],
  ].filter(([_, val]) => Boolean(val) && val !== "—") : [];

  const fieldStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box" as const
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>

        {/* Header Section */}
        <div style={{
          padding: "24px 32px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-cyan)", flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Project Details</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>View and edit project information</div>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer", color: "var(--mf-text-muted)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"; e.currentTarget.style.color = "var(--mf-cyan)"; e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.3)"; } }}
            onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } }}
          ><X size={16} /></button>
        </div>

        <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column" }}>
          {loading && <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--mf-text-muted)" }}><Loader2 size={18} className="mf-spin" /> Loading project details…</div>}
          {!loading && error && !project && <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--mf-magenta)" }}><AlertCircle size={28} /><span>{error}</span><button onClick={onRetry} style={{ padding: "10px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "var(--mf-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Retry</button></div>}
          {!loading && project && (
            <>
              {(error || validationError) && <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, color: "var(--mf-magenta)", background: "rgba(255,42,109,0.1)", border: "1px solid rgba(255,42,109,0.3)", fontSize: 13, fontWeight: 700 }}>{validationError || error}</div>}
              {editing && !isLeaderBoard ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>TITLE</label>
                    <input value={title} onChange={event => setTitle(event.target.value)} disabled={saving} style={fieldStyle} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>DESCRIPTION</label>
                    <textarea value={description} onChange={event => setDescription(event.target.value)} disabled={saving} rows={4} style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.5 }} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: "#fff" }}>{project.title || "—"}</div>
                    {project.description && project.description !== "—" && (
                      <div style={{ fontSize: 14, color: "var(--mf-text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{project.description}</div>
                    )}
                    {project.status && project.status !== "—" && (
                      <div style={{ display: "inline-flex", marginTop: 14, padding: "6px 12px", borderRadius: 8, background: "rgba(255,140,66,0.1)", border: "1px solid rgba(255,140,66,0.25)", color: "var(--mf-orange)", fontSize: 11, fontWeight: 800 }}>{project.status}</div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                    {rows.map(([label, value]) => {
                      const isWorkflowCard = label === "Workflow status";
                      const isTantouCard = label === "Tantou";
                      const isUnlocked = editing && isLeaderBoard && (isWorkflowCard || isTantouCard);

                      return (
                        <div key={label} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                          {isUnlocked && isWorkflowCard ? (
                            <CustomSelect
                              value={workflowStatus}
                              disabled={saving}
                              onChange={val => setWorkflowStatus(String(val))}
                              options={[
                                { value: "DRAFT", label: "DRAFT" },
                                { value: "ACTIVE", label: "ACTIVE" },
                                { value: "ON_HOLD", label: "ON_HOLD" },
                                { value: "COMPLETED", label: "COMPLETED" },
                                { value: "CANCELLED", label: "CANCELLED" }
                              ]}
                            />
                          ) : isUnlocked && isTantouCard ? (
                            <CustomSelect
                              value={tantouId}
                              disabled={saving}
                              onChange={val => setTantouId(Number(val))}
                              options={tantouAccounts.map(acc => ({
                                value: acc.id,
                                label: [acc.firstName, acc.lastName].filter(Boolean).join(" ") || acc.username || acc.email
                              }))}
                            />
                          ) : (
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--mf-text-secondary)", wordBreak: "break-word" }}>{value}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32, paddingTop: 16, borderTop: editing ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                {editing ? (
                  <>
                    <button onClick={cancelEditing} disabled={saving} style={{ padding: "10px 18px", background: "transparent", color: "var(--mf-text)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", transition: "border-color 0.15s ease" }} onMouseEnter={e => !saving && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")} onMouseLeave={e => !saving && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}>Cancel</button>
                    <button onClick={() => void save()} disabled={saving} style={{ padding: "10px 22px", background: "var(--mf-cyan)", color: "#000", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 15px rgba(0,240,255,0.3)" }}>
                      {saving ? <Loader2 size={15} className="mf-spin" /> : <Save size={15} />}
                      {saving ? "Saving…" : "Save Details"}
                    </button>
                  </>
                ) : (
                  <button onClick={beginEditing} style={{ padding: "10px 22px", background: "var(--mf-cyan)", color: "#000", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 15px rgba(0,240,255,0.3)" }}>
                    <Edit3 size={15} /> Edit Details
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface AssignmentDialogProps {
  accounts: AdminAccount[];
  loading: boolean;
  accountsError: string | null;
  assignmentError: string | null;
  assigning: boolean;
  onClose: () => void;
  onConfirm: (tantouId: number, account?: AdminAccount) => Promise<void>;
}

function AssignmentDialog({ accounts, loading, accountsError, assignmentError, assigning, onClose, onConfirm }: AssignmentDialogProps) {
  const [emailSearch, setEmailSearch] = useState("");
  const [manualId, setManualId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const fieldStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box" as const
  };

  const handleSearchAndAssign = async () => {
    let id = Number(manualId.trim());

    if (!id && emailSearch.trim()) {
      setSearchLoading(true);
      setSearchMessage(null);
      setValidationError(null);
      try {
        const found = await searchAccountByEmail(emailSearch.trim());
        if (found && found.id) {
          id = found.id;
        } else {
          setSearchMessage("No account found with this email.");
          setSearchLoading(false);
          return;
        }
      } catch (e: any) {
        setSearchMessage(e.message || "Failed to search account");
        setSearchLoading(false);
        return;
      }
      setSearchLoading(false);
    }

    if (!Number.isInteger(id) || id <= 0) {
      setValidationError("Enter a valid Tantou email or a positive Tantou account ID.");
      return;
    }
    setValidationError(null);
    await onConfirm(id);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>

        {/* Header Section */}
        <div style={{
          padding: "24px 32px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-cyan)", flexShrink: 0 }}>
              <UserPlus size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Assign Tantou</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Assign an editor to this project</div>
            </div>
          </div>
          <button onClick={onClose} disabled={assigning} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: assigning ? "not-allowed" : "pointer", color: "var(--mf-text-muted)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
            onMouseEnter={e => { if (!assigning) { e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"; e.currentTarget.style.color = "var(--mf-cyan)"; e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.3)"; } }}
            onMouseLeave={e => { if (!assigning) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } }}
          ><X size={16} /></button>
        </div>

        <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>TANTOU EMAIL SEARCH</label>
            <input type="email" value={emailSearch} onChange={event => setEmailSearch(event.target.value)} disabled={assigning || Boolean(manualId)} placeholder="Enter Tantou's email" style={{ ...fieldStyle, opacity: manualId ? 0.55 : 1 }} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>

          {searchMessage && <div style={{ padding: "12px 16px", borderRadius: 10, color: "var(--mf-orange)", background: "rgba(255,140,66,0.1)", border: "1px solid rgba(255,140,66,0.3)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><AlertCircle size={16} />{searchMessage}</div>}

          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>OR TANTOU ACCOUNT ID</label>
            <input type="number" min={1} step={1} value={manualId} onChange={event => setManualId(event.target.value)} disabled={assigning || Boolean(emailSearch)} placeholder="Enter a positive account ID directly" style={{ ...fieldStyle, opacity: emailSearch ? 0.55 : 1 }} onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>

          {(validationError || assignmentError) && <div style={{ padding: "12px 16px", borderRadius: 10, color: "var(--mf-magenta)", background: "rgba(255,42,109,0.1)", border: "1px solid rgba(255,42,109,0.3)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><AlertCircle size={16} />{validationError || assignmentError}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={onClose} disabled={assigning} style={{ padding: "10px 18px", background: "transparent", color: "var(--mf-text)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: assigning ? "not-allowed" : "pointer", transition: "border-color 0.15s ease" }} onMouseEnter={e => !assigning && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")} onMouseLeave={e => !assigning && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}>Cancel</button>
            <button onClick={() => void handleSearchAndAssign()} disabled={assigning || searchLoading} style={{ padding: "10px 22px", background: "var(--mf-cyan)", color: "#000", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: (assigning || searchLoading) ? "not-allowed" : "pointer", opacity: (assigning || searchLoading) ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 15px rgba(0,240,255,0.3)" }}>
              {(assigning || searchLoading) ? <Loader2 size={15} className="mf-spin" /> : <UserPlus size={15} />}
              {(assigning || searchLoading) ? "Assigning…" : "Confirm Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useTantouAccounts() {
  const [tantouAccounts, setTantouAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAllAccounts()
      .then(accounts => {
        if (!active) return;
        const tantous = accounts.filter(a =>
          a.systemRole?.some(r => r.roleName === "TANTOU_EDITOR")
        );
        setTantouAccounts(tantous);
      })
      .catch(() => {
        if (active) setTantouAccounts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { tantouAccounts, loading };
}

interface CreateProjectDialogProps {
  creating: boolean;
  onClose: () => void;
  onConfirm: (payload: CreateProjectPayload) => Promise<boolean>;
}

function CreateProjectDialog({ creating, onClose, onConfirm }: CreateProjectDialogProps) {
  const { tantouAccounts, loading: loadingTantous } = useTantouAccounts();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [format, setFormat] = useState("WEEKLY_SHONEN");
  const [tantouId, setTantouId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    const success = await onConfirm({
      title: title.trim(),
      genre: genre.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      format: format.trim() || undefined,
      tantouId: tantouId ? Number(tantouId) : 0,
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 500, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={18} style={{ color: "var(--mf-cyan)" }} /> Create New Project
          </h3>
          <button onClick={onClose} disabled={creating} style={{ background: "transparent", border: "none", color: "var(--mf-text-muted)", cursor: creating ? "not-allowed" : "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6, letterSpacing: "0.05em" }}>TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={creating}
              placeholder="e.g. Solo Leveling"
              style={fieldStyle}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6, letterSpacing: "0.05em" }}>GENRE</label>
            <input
              type="text"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              disabled={creating}
              placeholder="e.g. Action, Fantasy"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6, letterSpacing: "0.05em" }}>TARGET AUDIENCE</label>
            <input
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              disabled={creating}
              placeholder="e.g. Teens, Young Adults"
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6, letterSpacing: "0.05em" }}>FORMAT</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              disabled={creating}
              style={fieldStyle}
            >
              <option value="WEEKLY_SHONEN">WEEKLY_SHONEN</option>
              <option value="MONTHLY_SEINEN">MONTHLY_SEINEN</option>
              <option value="WEBTOON">WEBTOON</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 6, letterSpacing: "0.05em" }}>ASSIGN TANTOU EDITOR</label>
            <select
              value={tantouId}
              onChange={e => setTantouId(e.target.value)}
              disabled={creating || loadingTantous}
              style={fieldStyle}
            >
              <option value="">{loadingTantous ? "Loading Tantou editors..." : "-- Select Tantou --"}</option>
              {tantouAccounts.map(account => {
                const name = [account.firstName, account.lastName].filter(Boolean).join(" ") || account.username || account.email;
                return (
                  <option key={account.id} value={account.id}>
                    {name} ({account.email})
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,42,122,0.1)", border: "1px solid rgba(255,42,122,0.3)", color: "var(--mf-magenta)", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 16, borderTop: "1px solid var(--mf-border)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              style={{ padding: "8px 16px", background: "transparent", color: "var(--mf-text)", border: "1px solid var(--mf-border)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{ ...actionButtonStyle, background: "var(--mf-cyan)", color: "#000", cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}
            >
              {creating ? <Loader2 size={13} className="mf-spin" /> : <Plus size={13} />}
              {creating ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ActiveProjectsView() {
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [details, setDetails] = useState<ProjectFromApi | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [assignmentCache, setAssignmentCache] = useState<ProjectAssignmentCache>(() => readAssignmentCache());
  const mounted = useRef(true);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const accountRequest = useRef(0);

  const handleCreateProject = async (payload: CreateProjectPayload): Promise<boolean> => {
    const loggedInAccount = tokenStorage.getAccount();
    if (!loggedInAccount?.id) {
      toast.error("User session not found. Please log in again.");
      return false;
    }

    setCreatingProject(true);
    try {
      await createProject(payload, loggedInAccount.id);
      toast.success("Project created successfully.");
      await loadProjects();
      return true;
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to create project."));
      return false;
    } finally {
      if (mounted.current) setCreatingProject(false);
    }
  };

  const persistCachedAssignment = useCallback((assignment: CachedProjectAssignment) => {
    saveCachedAssignment(assignment);
    setAssignmentCache(current => ({ ...current, [assignment.projectId]: assignment }));
  }, []);

  const persistBackendAssignments = useCallback((projectRows: ProjectFromApi[]) => {
    const stored = readAssignmentCache();
    const updates: ProjectAssignmentCache = {};
    projectRows.forEach(project => {
      const assignment = backendCachedAssignment(project, stored[project.id]);
      if (assignment) updates[project.id] = assignment;
    });
    if (Object.keys(updates).length === 0) return;

    const next = { ...stored, ...updates };
    writeAssignmentCache(next);
    setAssignmentCache(current => ({ ...current, ...updates }));
  }, []);

  const loadProjects = useCallback(async () => {
    const requestId = ++listRequest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getProjects();
      if (mounted.current && listRequest.current === requestId) {
        let incoming = Array.isArray(result) ? result : [];

        // Always fetch submissions to ensure we overwrite the backend's default ownerName (which is the Admin) with the true submitter's name
        try {
          const { getSubmissions } = await import("../../services/workflowApi");
          const submissions = await getSubmissions();
          incoming = incoming.map(project => {
            const sub = submissions.find(s => s.title === project.title && s.status === "APPROVED");
            if (sub) {
              const updates: Partial<typeof project> = {};
              if (!project.createdAt && (sub.reviewedAt || sub.submittedAt)) {
                updates.createdAt = sub.reviewedAt || sub.submittedAt;
              }
              const submitterName = sub.submittedByName || sub.submittedBy?.name || sub.submittedBy?.username || (sub.submittedById ? `User #${sub.submittedById}` : undefined);
              if (submitterName) {
                updates.ownerName = submitterName;
              }
              if (Object.keys(updates).length > 0) {
                return { ...project, ...updates };
              }
            }
            return project;
          });
        } catch (e) {
          // Ignore error if submissions cannot be loaded
        }

        setProjects(current => mergeProjectLists(current, incoming));
        persistBackendAssignments(incoming);
      }
    } catch (loadError: unknown) {
      if (mounted.current && listRequest.current === requestId) setError(errorMessage(loadError, "Failed to load active projects."));
    } finally {
      if (mounted.current && listRequest.current === requestId) setLoading(false);
    }
  }, [persistBackendAssignments]);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(loadProjects);
    return () => { mounted.current = false; listRequest.current += 1; detailRequest.current += 1; accountRequest.current += 1; };
  }, [loadProjects]);

  const loadDetails = async (projectId: number) => {
    const requestId = ++detailRequest.current;
    setSelectedProjectId(projectId);
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const result = await getProjectById(projectId);
      if (mounted.current && detailRequest.current === requestId) {
        const existing = projects.find(p => p.id === projectId);
        const finalResult = { ...result, createdAt: result.createdAt || existing?.createdAt };
        setDetails(current => current?.id === projectId ? { ...current, ...finalResult } : finalResult);
        setProjects(current => current.map(project => (
          project.id === projectId ? { ...project, ...finalResult } : project
        )));
        persistBackendAssignments([finalResult]);
      }
    } catch (loadError: unknown) {
      if (mounted.current && detailRequest.current === requestId) setDetailsError(errorMessage(loadError, "Failed to load project details."));
    } finally {
      if (mounted.current && detailRequest.current === requestId) setDetailsLoading(false);
    }
  };

  const saveProject = async (payload: UpdateProjectPayload, boardPayload?: UpdateProjectBoardPayload): Promise<boolean> => {
    if (!details || saving) return false;
    setSaving(true);
    setDetailsError(null);
    try {
      const account = tokenStorage.getAccount();
      const editorId = account?.id;
      let updated = details;

      if (boardPayload && editorId) {
        updated = await updateProjectByBoard(details.id, editorId, boardPayload);
      }
      if (payload.title) {
        try {
          const titleUpdated = await updateProject(details.id, payload);
          updated = { ...updated, ...titleUpdated };
        } catch {
          // Keep board update result
        }
      }

      if (!mounted.current) return false;
      const existing = projects.find(p => p.id === updated.id);
      const finalUpdated = { ...updated, createdAt: updated.createdAt || existing?.createdAt };
      setDetails(current => current ? { ...current, ...finalUpdated } : finalUpdated);
      setProjects(current => current.map(project => (
        project.id === finalUpdated.id ? { ...project, ...finalUpdated } : project
      )));
      toast.success("Project updated successfully.");
      return true;
    } catch (saveError: unknown) {
      if (mounted.current) setDetailsError(errorMessage(saveError, "Failed to update project."));
      return false;
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  const openAssignment = async (project: ProjectFromApi) => {
    if (resolveProjectAssignment(project, assignmentCache).assigned) {
      toast.info("This project already has a Tantou Editor assigned.");
      return;
    }

    setAssignProjectId(project.id);
    setAccountsError(null);
    setAssignmentError(null);
  };

  const assign = async (tantouId: number, account?: AdminAccount) => {
    if (assignProjectId === null || assigning) return;
    const projectId = assignProjectId;
    const latestProject = projects.find(project => project.id === projectId);
    const alreadyAssigned = latestProject
      ? resolveProjectAssignment(latestProject, assignmentCache).assigned
      : Boolean(getCachedAssignment(projectId, assignmentCache));
    if (alreadyAssigned) {
      setAssignProjectId(null);
      toast.info("This project already has a Tantou Editor assigned.");
      return;
    }

    setAssigning(true);
    setAssignmentError(null);
    try {
      await assignTantouToProject(projectId, tantouId);
      if (!mounted.current) return;
      persistCachedAssignment(successfulAssignmentCacheEntry(projectId, tantouId, account));
      setAssignProjectId(null);
      toast.success("Tantou assigned successfully.");
      const shouldRefreshDetails = selectedProjectId === projectId;
      const [listResult, detailResult] = await Promise.allSettled([
        getProjects(),
        shouldRefreshDetails ? getProjectById(projectId) : Promise.resolve(null),
      ]);
      if (!mounted.current) return;

      const refreshErrors: string[] = [];
      const refreshedList = listResult.status === "fulfilled" && Array.isArray(listResult.value)
        ? listResult.value
        : [];
      if (listResult.status === "fulfilled") {
        listRequest.current += 1;
        setProjects(current => mergeProjectLists(current, refreshedList));
        persistBackendAssignments(refreshedList);
      } else {
        refreshErrors.push(errorMessage(listResult.reason, "Failed to refresh the project list."));
      }

      if (detailResult.status === "fulfilled" && detailResult.value) {
        const existing = projects.find(p => p.id === projectId);
        const refreshedDetails = { ...detailResult.value, createdAt: detailResult.value.createdAt || existing?.createdAt };
        detailRequest.current += 1;
        setDetails(current => current ? { ...current, ...refreshedDetails } : refreshedDetails);
        setProjects(current => current.map(project => (
          project.id === projectId ? { ...project, ...refreshedDetails } : project
        )));
        persistBackendAssignments([refreshedDetails]);
      } else if (detailResult.status === "rejected") {
        refreshErrors.push(errorMessage(detailResult.reason, "Failed to refresh project details."));
      }

      if (refreshErrors.length > 0) {
        toast.error(`Assignment succeeded, but project refresh failed: ${refreshErrors.join(" ")}`);
      }

      const listProject = refreshedList.find(project => project.id === projectId);
      const detailProject = detailResult.status === "fulfilled" ? detailResult.value : undefined;
      const refreshedAssignmentReturned = Boolean(
        (listProject && hasAssignedTantou(listProject))
        || (detailProject && hasAssignedTantou(detailProject))
      );

      if (!refreshedAssignmentReturned && refreshErrors.length === 0) {
        toast.warn("Assignment succeeded, but refreshed project data did not include Tantou assignment information. Use Refresh to check again.");
      }
    } catch (assignError: unknown) {
      if (!mounted.current) return;
      if (isAlreadyAssignedError(assignError)) {
        persistCachedAssignment({
          projectId,
          assignedAt: new Date().toISOString(),
          source: "already-assigned-error",
        });
        setAssignProjectId(null);
        toast.info("This project already has a Tantou Editor assigned.");
      } else {
        setAssignmentError(errorMessage(assignError, "Failed to assign the Tantou Editor."));
      }
    } finally {
      if (mounted.current) setAssigning(false);
    }
  };

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
      <style>{`
        @keyframes mf-project-spin { to { transform: rotate(360deg); } }
        .mf-spin { animation: mf-project-spin 1s linear infinite; }
        .custom-select-menu::-webkit-scrollbar { width: 4px; }
        .custom-select-menu::-webkit-scrollbar-track { background: transparent; }
        .custom-select-menu::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.3); border-radius: 4px; }
        .custom-select-menu::-webkit-scrollbar-thumb:hover { background: var(--mf-cyan); }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Active Projects</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>{loading ? "Loading…" : `${projects.length} project${projects.length === 1 ? "" : "s"}`}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{ ...actionButtonStyle, background: "var(--mf-cyan)", color: "#000", cursor: "pointer" }}
          >
            <Plus size={14} /> Create Project
          </button>
          <button onClick={() => void loadProjects()} disabled={loading} style={{ ...actionButtonStyle, background: "var(--mf-bg-surface)", color: "var(--mf-text)", border: "1px solid var(--mf-border)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1 }}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>
      {loading && <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "var(--mf-text-muted)" }}><Loader2 size={20} className="mf-spin" /> Loading projects…</div>}
      {!loading && error && <div style={{ padding: 24, borderRadius: 12, background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", color: "var(--mf-magenta)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><AlertCircle size={24} /><span>{error}</span><button onClick={() => void loadProjects()} style={{ ...actionButtonStyle, background: "var(--mf-bg-surface)", color: "var(--mf-text)", border: "1px solid var(--mf-border)", cursor: "pointer" }}><RefreshCw size={12} /> Retry</button></div>}
      {!loading && !error && projects.length === 0 && <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--mf-text-muted)", textAlign: "center" }}><Package size={40} style={{ opacity: 0.35 }} /><div style={{ fontSize: 14, fontWeight: 700 }}>No active projects were returned by the backend.</div><div style={{ fontSize: 12 }}>If a submission was approved after the final vote, this indicates a backend or data issue.</div></div>}
      {!loading && !error && projects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.map((project, index) => {
            const color = CARD_COLORS[index % CARD_COLORS.length];
            const assignment = resolveProjectAssignment(project, assignmentCache);

            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => void loadDetails(project.id)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") void loadDetails(project.id);
                }}
                style={{ padding: "16px 20px", borderRadius: 12, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", cursor: "pointer", display: "grid", gridTemplateColumns: "260px 1fr 100px 140px", alignItems: "center", gap: 20, transition: "border-color 0.15s, background 0.15s" }}
                onMouseEnter={event => { event.currentTarget.style.borderColor = color; event.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                onMouseLeave={event => { event.currentTarget.style.borderColor = "var(--mf-border)"; event.currentTarget.style.background = "var(--mf-surface)"; }}
              >
                {/* Column 1: Title & Date */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>{project.title || "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={11} /> Created {formatDate(project.createdAt)}
                  </div>
                  {project.ownerName && (
                    <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>
                      Submitted by: <span style={{ color: "var(--mf-text-secondary)", fontWeight: 700 }}>{project.ownerName}</span>
                    </div>
                  )}
                </div>

                {/* Column 2: Description */}
                <div style={{ minWidth: 0, paddingRight: 20 }}>
                  <div style={{ fontSize: 12, color: "var(--mf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.description || "—"}</div>
                </div>

                {/* Column 3: Status */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ padding: "4px 12px", borderRadius: 100, background: `${color}15`, border: `1px solid ${color}30`, color, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>{project.status || "—"}</span>
                </div>

                {/* Column 4: Assign Button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {assignment.assigned ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,230,160,0.3)", background: "rgba(0,230,160,0.08)", color: "var(--mf-green)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, cursor: "default", width: "100%", justifyContent: "center" }}
                    >
                      <CheckCircle size={13} /> {assignment.displayText ?? "Assigned"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        void openAssignment(project);
                      }}
                      onKeyDown={event => event.stopPropagation()}
                      style={{ ...actionButtonStyle, padding: "8px 14px", cursor: "pointer", width: "100%", justifyContent: "center", fontSize: 11 }}
                    >
                      <UserPlus size={13} /> Assign
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedProjectId !== null && <ProjectDetailsDialog key={`${selectedProjectId}-${details?.id ?? "loading"}`} project={details} assignmentCache={assignmentCache} loading={detailsLoading} error={detailsError} saving={saving} onClose={() => { if (!saving) { detailRequest.current += 1; setSelectedProjectId(null); setDetails(null); } }} onRetry={() => void loadDetails(selectedProjectId)} onSave={saveProject} />}
      {assignProjectId !== null && <AssignmentDialog key={assignProjectId} accounts={accounts} loading={accountsLoading} accountsError={accountsError} assignmentError={assignmentError} assigning={assigning} onClose={() => { if (!assigning) { accountRequest.current += 1; setAssignProjectId(null); setAssignmentError(null); } }} onConfirm={assign} />}
      {isCreateOpen && <CreateProjectDialog creating={creatingProject} onClose={() => setIsCreateOpen(false)} onConfirm={handleCreateProject} />}
    </div>
  );
}
