import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Calendar, CheckCircle, Edit3, Loader2, Package, RefreshCw, Save, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import { getAllAccounts, type AdminAccount } from "../../services/adminApi";
import {
  assignTantouToProject,
  getProjectById,
  getProjects,
  updateProject,
  type ProjectAccountSummary,
  type ProjectFromApi,
  type UpdateProjectPayload,
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
  return positiveInteger(project.tantou?.id) !== null;
}

function resolveProjectAssignment(
  project: ProjectFromApi,
  cache: ProjectAssignmentCache,
): ResolvedProjectAssignment {
  const backendTantouId = positiveInteger(project.tantou?.id);
  if (backendTantouId) {
    const identity = readableAccountName(project.tantou);
    return {
      assigned: true,
      displayText: identity ? `Assigned to ${identity}` : `Assigned to Tantou #${backendTantouId}`,
      tantouId: backendTantouId,
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
  const tantouId = positiveInteger(project.tantou?.id);
  if (!tantouId) return null;

  const tantou = project.tantou;
  const fullName = `${tantou?.firstName ?? ""} ${tantou?.lastName ?? ""}`.trim();
  const displayName = fullName || tantou?.name?.trim() || tantou?.username?.trim() || previous?.displayName;
  const email = tantou?.email?.trim() || previous?.email;
  return {
    projectId: project.id,
    tantouId,
    ...(displayName ? { displayName } : {}),
    ...(email ? { email } : {}),
    assignedAt: previous?.assignedAt ?? new Date().toISOString(),
    source: "backend",
  };
}

function isAlreadyAssignedError(error: unknown): boolean {
  return errorMessage(error, "").toLowerCase().includes("project already has a tantou assigned");
}

function mergeProjectLists(current: ProjectFromApi[], incoming: ProjectFromApi[]): ProjectFromApi[] {
  const currentById = new Map(current.map(project => [project.id, project]));
  return incoming.map(project => ({ ...currentById.get(project.id), ...project }));
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

interface ProjectDetailsDialogProps {
  project: ProjectFromApi | null;
  assignmentCache: ProjectAssignmentCache;
  loading: boolean;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSave: (payload: UpdateProjectPayload) => Promise<boolean>;
}

function ProjectDetailsDialog({ project, assignmentCache, loading, error, saving, onClose, onRetry, onSave }: ProjectDetailsDialogProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const beginEditing = () => {
    if (!project) return;
    setTitle(project.title ?? "");
    setDescription(project.description ?? "");
    setStatus(project.status ?? "");
    setValidationError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (project) {
      setTitle(project.title ?? "");
      setDescription(project.description ?? "");
      setStatus(project.status ?? "");
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
    if (await onSave(payload)) setEditing(false);
  };

  const assignment = project ? resolveProjectAssignment(project, assignmentCache) : null;
  const rows = project ? [
    ["Created", formatDate(project.createdAt)],
    ["Start date", formatDate(project.startDate)],
    ["Expected end", formatDate(project.expectedEndDate)],
    ["Current phase", project.currentPhase || "—"],
    ["Genre", project.genre || "—"],
    ["Target audience", project.targetAudience || "—"],
    ["Format", project.format || "—"],
    ["Workflow status", project.projectWorkflowStatus || "—"],
    ["Tantou", assignment?.assigned ? (assignment.displayText?.replace(/^Assigned to /, "") ?? "Tantou Assigned") : "—"],
    ["Mangaka", accountName(project.mangaka)],
  ] : [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, padding: 20, background: "rgba(0,0,0,0.68)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(720px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--mf-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>Project Details</div>
          <button onClick={onClose} disabled={saving} aria-label="Close project details" style={{ background: "none", border: "none", color: "var(--mf-text-muted)", cursor: saving ? "not-allowed" : "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          {loading && <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--mf-text-muted)" }}><Loader2 size={18} className="mf-spin" /> Loading project details…</div>}
          {!loading && error && !project && <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--mf-magenta)" }}><AlertCircle size={28} /><span>{error}</span><button onClick={onRetry} style={{ ...actionButtonStyle, background: "var(--mf-bg-elevated)", color: "var(--mf-text)", border: "1px solid var(--mf-border)" }}>Retry</button></div>}
          {!loading && project && (
            <>
              {(error || validationError) && <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 8, color: "var(--mf-magenta)", background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", fontSize: 12 }}>{validationError || error}</div>}
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>TITLE<input value={title} onChange={event => setTitle(event.target.value)} disabled={saving} style={fieldStyle} /></label>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>DESCRIPTION<textarea value={description} onChange={event => setDescription(event.target.value)} disabled={saving} rows={5} style={{ ...fieldStyle, resize: "vertical" }} /></label>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>STATUS<input value={status} onChange={event => setStatus(event.target.value)} disabled={saving} style={fieldStyle} /></label>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 18 }}><div style={{ fontSize: 20, fontWeight: 900, marginBottom: 7 }}>{project.title || "—"}</div><div style={{ fontSize: 13, color: "var(--mf-text-muted)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{project.description || "—"}</div><div style={{ display: "inline-flex", marginTop: 12, padding: "4px 10px", borderRadius: 7, background: "var(--mf-orange)18", border: "1px solid var(--mf-orange)40", color: "var(--mf-orange)", fontSize: 10, fontWeight: 800 }}>{project.status || "—"}</div></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>{rows.map(([label, value]) => <div key={label} style={{ padding: "10px 12px", background: "var(--mf-bg-elevated)", borderRadius: 9 }}><div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 4 }}>{label.toUpperCase()}</div><div style={{ fontSize: 12, wordBreak: "break-word" }}>{value}</div></div>)}</div>
                </>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
                {editing ? <><button onClick={cancelEditing} disabled={saving} style={{ ...actionButtonStyle, background: "transparent", color: "var(--mf-text)", border: "1px solid var(--mf-border)", cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button><button onClick={() => void save()} disabled={saving} style={{ ...actionButtonStyle, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.65 : 1 }}>{saving ? <Loader2 size={13} className="mf-spin" /> : <Save size={13} />}{saving ? "Saving…" : "Save"}</button></> : <button onClick={beginEditing} style={{ ...actionButtonStyle, cursor: "pointer" }}><Edit3 size={13} /> Edit</button>}
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
  const [selectedId, setSelectedId] = useState("");
  const [manualId, setManualId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const confirm = async () => {
    const id = Number(selectedId || manualId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      setValidationError("Select a Tantou Editor or enter a valid positive Tantou account ID.");
      return;
    }
    setValidationError(null);
    const selectedAccount = selectedId ? accounts.find(account => account.id === id) : undefined;
    await onConfirm(id, selectedAccount);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, padding: 20, background: "rgba(0,0,0,0.68)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(480px, 100%)", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--mf-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 17, fontWeight: 900 }}>Assign Tantou</div><button onClick={onClose} disabled={assigning} aria-label="Close assignment dialog" style={{ background: "none", border: "none", color: "var(--mf-text-muted)", cursor: assigning ? "not-allowed" : "pointer" }}><X size={18} /></button></div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 15 }}>
          {loading && <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--mf-text-muted)", fontSize: 12 }}><Loader2 size={14} className="mf-spin" /> Loading Tantou Editor accounts…</div>}
          {!loading && accounts.length > 0 && <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>TANTOU EDITOR<select value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={assigning} style={fieldStyle}><option value="">Select a Tantou Editor</option>{accounts.map(account => <option key={account.id} value={account.id}>{accountOption(account)}</option>)}</select></label>}
          {accountsError && <div style={{ padding: "10px 12px", borderRadius: 8, color: "var(--mf-orange)", background: "rgba(255,140,66,0.08)", border: "1px solid rgba(255,140,66,0.3)", fontSize: 12, lineHeight: 1.5 }}>{accountsError}</div>}
          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>TANTOU ACCOUNT ID<input type="number" min={1} step={1} value={manualId} onChange={event => setManualId(event.target.value)} disabled={assigning || Boolean(selectedId)} placeholder="Enter a positive account ID" style={{ ...fieldStyle, opacity: selectedId ? 0.55 : 1 }} /></label>
          {(validationError || assignmentError) && <div style={{ padding: "10px 12px", borderRadius: 8, color: "var(--mf-magenta)", background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", fontSize: 12 }}>{validationError || assignmentError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}><button onClick={onClose} disabled={assigning} style={{ ...actionButtonStyle, background: "transparent", color: "var(--mf-text)", border: "1px solid var(--mf-border)", cursor: assigning ? "not-allowed" : "pointer" }}>Cancel</button><button onClick={() => void confirm()} disabled={assigning || loading} style={{ ...actionButtonStyle, cursor: assigning || loading ? "not-allowed" : "pointer", opacity: assigning || loading ? 0.65 : 1 }}>{assigning ? <Loader2 size={13} className="mf-spin" /> : <UserPlus size={13} />}{assigning ? "Assigning…" : "Confirm"}</button></div>
        </div>
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
  const [assignmentCache, setAssignmentCache] = useState<ProjectAssignmentCache>(() => readAssignmentCache());
  const mounted = useRef(true);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const accountRequest = useRef(0);

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
        const incoming = Array.isArray(result) ? result : [];
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
        setDetails(current => current?.id === projectId ? { ...current, ...result } : result);
        setProjects(current => current.map(project => (
          project.id === projectId ? { ...project, ...result } : project
        )));
        persistBackendAssignments([result]);
      }
    } catch (loadError: unknown) {
      if (mounted.current && detailRequest.current === requestId) setDetailsError(errorMessage(loadError, "Failed to load project details."));
    } finally {
      if (mounted.current && detailRequest.current === requestId) setDetailsLoading(false);
    }
  };

  const saveProject = async (payload: UpdateProjectPayload): Promise<boolean> => {
    if (!details || saving) return false;
    setSaving(true);
    setDetailsError(null);
    try {
      const updated = await updateProject(details.id, payload);
      if (!mounted.current) return false;
      setDetails(current => current ? { ...current, ...updated } : updated);
      setProjects(current => current.map(project => (
        project.id === updated.id ? { ...project, ...updated } : project
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

    const projectId = project.id;
    const requestId = ++accountRequest.current;
    setAssignProjectId(projectId);
    setAccounts([]);
    setAccountsError(null);
    setAssignmentError(null);
    setAccountsLoading(true);
    try {
      const result = await getAllAccounts();
      if (!mounted.current || accountRequest.current !== requestId) return;
      const editors = result.filter(account => account.systemRole?.some(role => role.roleName?.toUpperCase() === "TANTOU_EDITOR")).sort((a, b) => {
        const aActive = ["ACTIVE", "ENABLED"].includes(a.status?.toUpperCase());
        const bActive = ["ACTIVE", "ENABLED"].includes(b.status?.toUpperCase());
        return aActive === bActive ? accountOption(a).localeCompare(accountOption(b)) : aActive ? -1 : 1;
      });
      setAccounts(editors);
      if (editors.length === 0) setAccountsError("No Tantou Editor accounts were returned. Enter a Tantou account ID below.");
    } catch (loadError: unknown) {
      if (!mounted.current || accountRequest.current !== requestId) return;
      setAccountsError(errorStatus(loadError) === 403 ? "The current backend does not provide an authorized Tantou listing endpoint for Editorial Board accounts. Enter a Tantou account ID below." : errorMessage(loadError, "Failed to load Tantou Editor accounts. Enter a Tantou account ID below."));
    } finally {
      if (mounted.current && accountRequest.current === requestId) setAccountsLoading(false);
    }
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
        const refreshedDetails = detailResult.value;
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
      <style>{`@keyframes mf-project-spin { to { transform: rotate(360deg); } } .mf-spin { animation: mf-project-spin 1s linear infinite; }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22, flexWrap: "wrap" }}><div><h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Active Projects</h2><p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>{loading ? "Loading…" : `${projects.length} project${projects.length === 1 ? "" : "s"}`}</p></div><button onClick={() => void loadProjects()} disabled={loading} style={{ ...actionButtonStyle, background: "var(--mf-bg-surface)", color: "var(--mf-text)", border: "1px solid var(--mf-border)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1 }}><RefreshCw size={13} /> Refresh</button></div>
      {loading && <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "var(--mf-text-muted)" }}><Loader2 size={20} className="mf-spin" /> Loading projects…</div>}
      {!loading && error && <div style={{ padding: 24, borderRadius: 12, background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", color: "var(--mf-magenta)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><AlertCircle size={24} /><span>{error}</span><button onClick={() => void loadProjects()} style={{ ...actionButtonStyle, background: "var(--mf-bg-surface)", color: "var(--mf-text)", border: "1px solid var(--mf-border)", cursor: "pointer" }}><RefreshCw size={12} /> Retry</button></div>}
      {!loading && !error && projects.length === 0 && <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--mf-text-muted)", textAlign: "center" }}><Package size={40} style={{ opacity: 0.35 }} /><div style={{ fontSize: 14, fontWeight: 700 }}>No active projects were returned by the backend.</div><div style={{ fontSize: 12 }}>If a submission was approved after the final vote, this indicates a backend or data issue.</div></div>}
      {!loading && !error && projects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
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
                style={{ padding: 18, borderRadius: 16, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", cursor: "pointer" }}
                onMouseEnter={event => { event.currentTarget.style.borderColor = color; }}
                onMouseLeave={event => { event.currentTarget.style.borderColor = "var(--mf-border)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>{project.title || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--mf-text-muted)", lineHeight: 1.55 }}>{project.description || "—"}</div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 7, background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: 10, fontWeight: 800, height: "fit-content" }}>{project.status || "—"}</span>
                </div>
                {project.createdAt && <div style={{ fontSize: 11, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}><Calendar size={11} /> Created {formatDate(project.createdAt)}</div>}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--mf-border)" }}>
                  {assignment.assigned ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(0,230,160,0.3)", background: "rgba(0,230,160,0.08)", color: "var(--mf-green)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, cursor: "default" }}
                    >
                      <CheckCircle size={12} /> {assignment.displayText ?? "Tantou Assigned"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        void openAssignment(project);
                      }}
                      onKeyDown={event => event.stopPropagation()}
                      style={{ ...actionButtonStyle, padding: "7px 12px", cursor: "pointer" }}
                    >
                      <UserPlus size={12} /> Assign
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
    </div>
  );
}
