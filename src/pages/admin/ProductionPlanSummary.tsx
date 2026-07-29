import { useEffect, useMemo, useState } from "react";
import {
  FileText, RefreshCw, Search, Filter, Calendar, Users, BarChart3,
  BookOpen, AlertTriangle, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  getProductionPlans, type ProductionPlanResponse,
} from "../../services/projectApi";
import { getProjects, type ProjectFromApi } from "../../services/projectApi";
import { ApiRequestError } from "../../services/adminApi";

type StatusFilter = "all" | "ACTIVE" | "COMPLETED" | "EXTENDED" | "IN_PRODUCTION" | "OTHER";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "IN_PRODUCTION", label: "In Production" },
  { key: "EXTENDED", label: "Extended" },
  { key: "COMPLETED", label: "Completed" },
  { key: "OTHER", label: "Other" },
];

function statusMeta(status: string | null | undefined) {
  const s = (status ?? "").toUpperCase();
  switch (s) {
    case "COMPLETED":
      return { label: "Completed", color: "var(--mf-green)", bg: "var(--mf-green-dim)" };
    case "ACTIVE":
    case "IN_PRODUCTION":
      return { label: "In Production", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" };
    case "EXTENDED":
      return { label: "Extended", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" };
    case "CANCELLED":
    case "REJECTED":
      return { label: s, color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" };
    default:
      return { label: s || "Unknown", color: "var(--mf-text-muted)", bg: "var(--mf-bg-elevated)" };
  }
}

function formatSafeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function matchesFilter(plan: ProductionPlanResponse, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  const s = (plan.planStatus ?? "").toUpperCase();
  if (filter === "OTHER") {
    return !["ACTIVE", "IN_PRODUCTION", "EXTENDED", "COMPLETED"].includes(s);
  }
  return s === filter;
}

export function ProductionPlanSummary() {
  const [plans, setPlans] = useState<ProductionPlanResponse[]>([]);
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRows, projectRows] = await Promise.all([
        getProductionPlans(),
        getProjects().catch(() => [] as ProjectFromApi[]),
      ]);
      setPlans(planRows);
      setProjects(projectRows);
    } catch (err) {
      const msg = err instanceof ApiRequestError
        ? (err.message || "Failed to load production plans.")
        : "Failed to load production plans.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const projectTitleById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of projects) {
      map.set(p.id, p.title || p.name || `Project #${p.id}`);
    }
    return map;
  }, [projects]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter(p => {
      if (!matchesFilter(p, filter)) return false;
      if (projectFilter !== "all" && String(p.projectId) !== projectFilter) return false;
      if (q) {
        const title = (p.title || "").toLowerCase();
        const proj = (projectTitleById.get(p.projectId) || "").toLowerCase();
        if (!title.includes(q) && !proj.includes(q)) return false;
      }
      return true;
    });
  }, [plans, filter, projectFilter, search, projectTitleById]);

  const stats = useMemo(() => {
    const total = plans.length;
    const norm = (s: string | null | undefined) => (s ?? "").toUpperCase();
    const completed = plans.filter(p => norm(p.planStatus) === "COMPLETED").length;
    const inProduction = plans.filter(p => ["IN_PRODUCTION", "ACTIVE"].includes(norm(p.planStatus))).length;
    const extended = plans.filter(p => norm(p.planStatus) === "EXTENDED").length;
    const other = Math.max(total - completed - inProduction - extended, 0);
    return { total, completed, inProduction, extended, other };
  }, [plans]);

  return (
    <AppLayout role="admin" activeNav="Production Plan Summary">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--mf-border)",
          background: "var(--mf-bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mf-cyan)" }} />
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>Production Plan Summary</span>
            <span style={{
              fontSize: 11, color: "var(--mf-text-muted)",
              padding: "2px 8px", background: "var(--mf-bg-elevated)",
              borderRadius: 6, fontWeight: 700,
            }}>
              {stats.total} plan{stats.total === 1 ? "" : "s"}
            </span>
          </div>
          <button
            onClick={() => void load()}
            title="Refresh"
            style={{
              background: "var(--mf-bg-elevated)",
              border: "1px solid var(--mf-border)",
              borderRadius: 8, padding: "7px 12px",
              color: "var(--mf-text-secondary)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 800,
              opacity: loading ? 0.65 : 1,
            }}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "spin" : undefined} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <SummaryCard icon={BarChart3} label="Total Plans" value={stats.total} color="var(--mf-cyan)" />
            <SummaryCard icon={CheckCircle} label="Completed" value={stats.completed} color="var(--mf-green)" />
            <SummaryCard icon={Clock} label="In Production" value={stats.inProduction} color="var(--mf-cyan)" />
            <SummaryCard icon={AlertTriangle} label="Extended" value={stats.extended} color="var(--mf-orange)" />
            <SummaryCard icon={XCircle} label="Other" value={stats.other} color="var(--mf-magenta)" />
          </div>

          {/* Toolbar */}
          <div style={{
            padding: "14px 18px",
            background: "var(--mf-bg-surface)",
            border: "1px solid var(--mf-border)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px",
              background: "var(--mf-bg-elevated)",
              borderRadius: 8,
              border: "1px solid var(--mf-border)",
              flex: "1 1 240px", minWidth: 220,
            }}>
              <Search size={12} color="var(--mf-text-muted)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by plan title or project…"
                style={{
                  flex: 1, background: "none", border: "none",
                  outline: "none", color: "var(--mf-text)", fontSize: 12,
                }}
              />
            </div>

            {/* Project filter */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px",
              background: "var(--mf-bg-elevated)",
              borderRadius: 8,
              border: "1px solid var(--mf-border)",
            }}>
              <Filter size={12} color="var(--mf-text-muted)" />
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                style={{
                  background: "none", border: "none", outline: "none",
                  color: "var(--mf-text)", fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <option value="all">All projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.name || `Project #${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter chips */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {STATUS_FILTERS.map(f => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      padding: "5px 12px", fontSize: 11, fontWeight: 800,
                      borderRadius: 7, cursor: "pointer",
                      border: "1px solid",
                      background: active ? "var(--mf-bg-elevated)" : "transparent",
                      borderColor: active ? "var(--mf-cyan)" : "var(--mf-border)",
                      color: active ? "var(--mf-cyan)" : "var(--mf-text-muted)",
                      transition: "all 0.12s",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plans list */}
          <div style={{
            background: "var(--mf-bg-surface)",
            border: "1px solid var(--mf-border)",
            borderRadius: 14,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(200px, 1.4fr) minmax(140px, 1fr) minmax(110px, 0.8fr) minmax(160px, 1fr) minmax(160px, 1fr) minmax(120px, 0.8fr)",
              gap: 12,
              padding: "12px 20px",
              borderBottom: "1px solid var(--mf-border)",
              background: "var(--mf-bg-base)",
              fontSize: 10, fontWeight: 800,
              color: "var(--mf-text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              <div>Plan</div>
              <div>Project</div>
              <div>Status</div>
              <div>Start Date</div>
              <div>Deadline</div>
              <div style={{ textAlign: "right" }}>Chapters</div>
            </div>

            {/* Body */}
            <div style={{ maxHeight: 540, overflowY: "auto" }}>
              {loading && plans.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 13 }}>
                  Loading production plans…
                </div>
              ) : error ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--mf-magenta)", fontSize: 13 }}>
                  {error}
                </div>
              ) : filteredPlans.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)", fontSize: 13 }}>
                  <FileText size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No production plans match the current filters.</p>
                </div>
              ) : (
                filteredPlans.map(plan => {
                  const meta = statusMeta(plan.planStatus);
                  const projectTitle = projectTitleById.get(plan.projectId) || `Project #${plan.projectId}`;
                  const chapterCount = Array.isArray(plan.chapters) ? plan.chapters.length : 0;
                  const startDate = plan.startDate || plan.publishDate;
                  const deadline = plan.deadlineDate || plan.endDate || plan.publishDate;
                  return (
                    <div
                      key={plan.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(200px, 1.4fr) minmax(140px, 1fr) minmax(110px, 0.8fr) minmax(160px, 1fr) minmax(160px, 1fr) minmax(120px, 0.8fr)",
                        gap: 12,
                        alignItems: "center",
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--mf-border)",
                        fontSize: 13,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Plan */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${meta.color}20`,
                          border: `1px solid ${meta.color}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <FileText size={14} color={meta.color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 800, color: "var(--mf-text)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }} title={plan.title || `Plan #${plan.id}`}>
                            {plan.title || `Plan #${plan.id}`}
                          </div>
                          <div style={{
                            fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2,
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            <span>Plan #{plan.id}</span>
                            {plan.priority && (
                              <>
                                <span>·</span>
                                <span style={{ textTransform: "uppercase", fontWeight: 700 }}>{plan.priority}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Project */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        color: "var(--mf-text-secondary)",
                        fontSize: 12, fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }} title={projectTitle}>
                        <BookOpen size={13} color="var(--mf-cyan)" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {projectTitle}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 9px",
                          borderRadius: 6,
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.color}40`,
                          fontSize: 10, fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: meta.color, display: "inline-block",
                          }} />
                          {meta.label}
                        </span>
                      </div>

                      {/* Start date */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--mf-text-secondary)" }}>
                        <Calendar size={12} color="var(--mf-text-muted)" />
                        {formatSafeDate(startDate)}
                      </div>

                      {/* Deadline */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--mf-text-secondary)" }}>
                        <Calendar size={12} color="var(--mf-text-muted)" />
                        {formatSafeDate(deadline)}
                      </div>

                      {/* Chapter count */}
                      <div style={{
                        textAlign: "right", fontSize: 13,
                        fontWeight: 800, color: "var(--mf-text)",
                      }}>
                        <Users size={11} color="var(--mf-text-muted)" style={{ display: "inline", marginRight: 4 }} />
                        {chapterCount}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "10px 20px",
              borderTop: "1px solid var(--mf-border)",
              fontSize: 11, color: "var(--mf-text-muted)",
              display: "flex", justifyContent: "space-between",
              background: "var(--mf-bg-base)",
            }}>
              <span>
                Showing <strong style={{ color: "var(--mf-text)" }}>{filteredPlans.length}</strong> of{" "}
                <strong style={{ color: "var(--mf-text)" }}>{plans.length}</strong> production plan
                {plans.length === 1 ? "" : "s"}
              </span>
              <span>
                Source: <code style={{ fontSize: 10, color: "var(--mf-cyan)" }}>/api/v1/production-plans</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

interface SummaryCardProps {
  icon: typeof FileText;
  label: string;
  value: number;
  color: string;
}

function SummaryCard({ icon: Icon, label, value, color }: SummaryCardProps) {
  return (
    <div style={{
      padding: 16,
      background: "var(--mf-bg-surface)",
      border: "1px solid var(--mf-border)",
      borderRadius: 14,
      display: "flex", flexDirection: "column", gap: 10,
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${color}1a`,
          border: `1px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={color} strokeWidth={2.4} />
        </div>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
          color: "var(--mf-text-muted)", textTransform: "uppercase",
        }}>
          {label}
        </div>
      </div>
      <div style={{
        fontSize: 28, fontWeight: 900, color: color,
        letterSpacing: "-0.02em", lineHeight: 1.1,
      }}>
        {value}
      </div>
    </div>
  );
}