import { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  DollarSign, Calendar, Rocket, FileText,
  User, Clock, CheckCircle, Edit3, Layers, TrendingUp, X,
  Star, Package, AlertCircle, Loader2,
} from "lucide-react";
import { getProjects, type ProjectUI } from "../../services/projectApi";
import { getPlannings, getSubmissions, type SubmissionApi } from "../../services/workflowApi";

const proposals = [
  { id: 1, title: "Neon Samurai: The Last Blade", mangaka: "Ryu Akimoto", editor: "Kenji Yamada", genre: ["Action", "Cyberpunk"], synopsis: "In 2187 Neo-Tokyo, disgraced ronin Kaito discovers his katana can cut digital constructs. When a corrupt AI enslaves humanity, Kaito must master ancient and digital combat.", editorNotes: "Exceptional world-building. Character design sheets are outstanding. Recommend priority Q3 scheduling. High streaming adaptation value.", escalatedAt: "2 hours ago", pages: 32, concepts: 4, priority: "high" },
  { id: 2, title: "Ghost Meridian", mangaka: "Sora Hayashi", editor: "Maya Oishi", genre: ["Thriller", "Supernatural"], synopsis: "A detective who can see 48 hours into the future must prevent crimes before they happen — but each vision costs a piece of her soul.", editorNotes: "Strong female protagonist with compelling supernatural hook. Script pacing is excellent. Significant streaming adaptation potential.", escalatedAt: "3 days ago", pages: 24, concepts: 6, priority: "medium" },
];

const calendarEvents: Record<number, { title: string; color: string }[]> = {
  8: [{ title: "Bloom Protocol Ch.3", color: "var(--mf-green)" }],
  15: [{ title: "Neon Samurai Ch.1", color: "var(--mf-cyan)" }],
  18: [{ title: "Iron Lotus deadline", color: "var(--mf-orange)" }],
  22: [{ title: "Ghost Meridian Ch.1", color: "var(--mf-magenta)" }],
  28: [{ title: "Circuit Dancer Ch.1", color: "var(--mf-cyan)" }],
  30: [{ title: "Summer Oni Ch.2", color: "var(--mf-orange)" }],
};

const budgetItems = [
  { project: "Neon Samurai", allocated: 45000, spent: 35000, color: "var(--mf-cyan)" },
  { project: "Ghost Meridian", allocated: 30000, spent: 13500, color: "var(--mf-orange)" },
  { project: "Iron Lotus", allocated: 42000, spent: 9240, color: "var(--mf-magenta)" },
  { project: "Bloom Protocol", allocated: 28000, spent: 25200, color: "var(--mf-green)" },
  { project: "Circuit Dancer", allocated: 32000, spent: 18000, color: "var(--mf-cyan)" },
  { project: "Summer Oni", allocated: 22000, spent: 14000, color: "var(--mf-orange)" },
];

interface BoardProposal {
  id: number;
  title: string;
  mangaka: string;
  editor: string;
  genre: string[];
  synopsis: string;
  editorNotes: string;
  escalatedAt: string;
  pages: number;
  concepts: number;
  priority: "high" | "medium";
}

function submissionToProposal(submission: SubmissionApi): BoardProposal {
  return {
    id: submission.id,
    title: submission.title || `Submission #${submission.id}`,
    mangaka: "Submitted account",
    editor: "Editorial review",
    genre: ["Unspecified"],
    synopsis: submission.contentUrl || "No synopsis or content URL was provided.",
    editorNotes: submission.status || "No editorial recommendation has been stored yet.",
    escalatedAt: submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "From API",
    pages: 0,
    concepts: 0,
    priority: (submission.status || "").toLowerCase().includes("urgent") ? "high" : "medium",
  };
}

// --- Pending Approvals View ---
function PendingApprovalsView() {
  const [proposalsFromApi, setProposalsFromApi] = useState<BoardProposal[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [budget, setBudget] = useState(45000);
  const [months, setMonths] = useState(6);
  const [startDate, setStartDate] = useState("2026-07-01");
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const proposal = proposalsFromApi.find(p => p.id === selected) || proposalsFromApi[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSubmissions()
      .then(rows => {
        if (cancelled) return;
        const mapped = rows.map(submissionToProposal);
        setProposalsFromApi(mapped);
        setSelected(mapped[0]?.id ?? null);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message || "Failed to load pending submissions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleApprove = () => {
    if (!selected) return;
    setApproved(prev => new Set([...prev, selected]));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>Loading pending submissions...</div>;
  }

  if (error) {
    return <div style={{ flex: 1, padding: 24, color: "var(--mf-magenta)" }}>{error}</div>;
  }

  if (!proposal) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>No pending submissions found in the database.</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}>
      {showSuccess && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "14px 24px", background: "var(--mf-green-dim)", border: "1px solid var(--mf-green)50", borderRadius: 12, color: "var(--mf-green)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 0 30px rgba(57,255,138,0.25)", whiteSpace: "nowrap" }}>
          <CheckCircle size={16} /> Project Approved! Mangaka workspace created.
        </div>
      )}
      <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--mf-border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 900 }}>Pending Review</h2>
          <p style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 3 }}>Escalated by Editorial Team</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {proposalsFromApi.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              style={{ display: "block", width: "100%", padding: 12, marginBottom: 7, background: selected === p.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)", border: `1px solid ${selected === p.id ? "rgba(255,140,66,0.4)" : "var(--mf-border)"}`, borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", lineHeight: 1.3, marginBottom: 3 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 4 }}><Edit3 size={9} /> {p.editor}</div>
                </div>
                <span style={{ padding: "2px 7px", background: p.priority === "high" ? "var(--mf-magenta-dim)" : "rgba(255,140,66,0.14)", color: p.priority === "high" ? "var(--mf-magenta)" : "var(--mf-orange)", fontSize: 9, fontWeight: 800, borderRadius: 5, flexShrink: 0 }}>{p.priority.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {p.escalatedAt}</div>
              {approved.has(p.id) && <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--mf-green)", fontWeight: 700 }}><CheckCircle size={11} /> Approved</div>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px 12px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)" }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 5 }}>{proposal.title}</h1>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--mf-text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{proposal.mangaka}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Edit3 size={11} />Editor: {proposal.editor}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16, padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 9 }}>SYNOPSIS</div>
              <p style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.7 }}>{proposal.synopsis}</p>
            </div>
            <div style={{ marginBottom: 16, padding: 16, background: "var(--mf-cyan-dim)", borderRadius: 12, border: "1px solid var(--mf-cyan)25" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-cyan)", letterSpacing: "0.08em", marginBottom: 9, display: "flex", alignItems: "center", gap: 6 }}><Edit3 size={10} /> EDITOR RECOMMENDATION</div>
              <p style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.7 }}>{proposal.editorNotes}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[{ icon: FileText, label: "Pages", value: proposal.pages }, { icon: Layers, label: "Concepts", value: proposal.concepts }, { icon: TrendingUp, label: "Market", value: "High" }].map(s => {
                const Icon = s.icon;
                return <div key={s.label} style={{ padding: 14, background: "var(--mf-bg-surface)", borderRadius: 10, border: "1px solid var(--mf-border)" }}><Icon size={16} color="var(--mf-orange)" style={{ marginBottom: 8 }} /><div style={{ fontSize: 20, fontWeight: 900, color: "var(--mf-text)", marginBottom: 2 }}>{s.value}</div><div style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>{s.label}</div></div>;
              })}
            </div>
          </div>
          <div style={{ width: 272, flexShrink: 0 }}>
            <div style={{ marginBottom: 12, padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}><DollarSign size={11} color="var(--mf-green)" /> BUDGET ESTIMATOR</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 11, color: "var(--mf-text-secondary)" }}>Total Budget</span><span style={{ fontSize: 13, fontWeight: 900, color: "var(--mf-green)" }}>${budget.toLocaleString()}</span></div>
              <input type="range" min={10000} max={200000} step={5000} value={budget} onChange={e => setBudget(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--mf-green)", marginBottom: 10 }} />
              {[{ label: "Mangaka Fee", pct: 0.45 }, { label: "Assistants", pct: 0.25 }, { label: "Production", pct: 0.2 }, { label: "Marketing", pct: 0.1 }].map(item => (
                <div key={item.label} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10 }}><span style={{ color: "var(--mf-text-muted)" }}>{item.label}</span><span style={{ color: "var(--mf-text-secondary)", fontWeight: 700 }}>${Math.round(budget * item.pct).toLocaleString()}</span></div>
                  <div style={{ height: 3, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}><div style={{ height: "100%", width: `${item.pct * 100}%`, background: "var(--mf-green)", borderRadius: 100 }} /></div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12, padding: 16, background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}><Calendar size={11} color="var(--mf-cyan)" /> TIMELINE</div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, color: "var(--mf-text-muted)", display: "block", marginBottom: 4 }}>START DATE</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border-bright)", borderRadius: 7, color: "var(--mf-text)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>DURATION</span><span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-cyan)" }}>{months}mo</span></div>
              <input type="range" min={3} max={24} step={1} value={months} onChange={e => setMonths(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--mf-cyan)" }} />
            </div>
            <button onClick={handleApprove} disabled={approved.has(proposal.id)}
              style={{ width: "100%", padding: "13px", background: approved.has(proposal.id) ? "var(--mf-green-dim)" : "linear-gradient(135deg, var(--mf-magenta), #C2006A)", border: approved.has(proposal.id) ? "1px solid var(--mf-green)" : "none", borderRadius: 12, color: approved.has(proposal.id) ? "var(--mf-green)" : "#fff", fontSize: 13, fontWeight: 900, cursor: approved.has(proposal.id) ? "default" : "pointer", letterSpacing: "0.04em", boxShadow: approved.has(proposal.id) ? "none" : "0 0 28px var(--mf-magenta-glow)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {approved.has(proposal.id) ? <><CheckCircle size={14} /> LAUNCHED</> : <><Rocket size={14} /> APPROVE & LAUNCH</>}
            </button>
            <button style={{ width: "100%", marginTop: 7, padding: "10px", background: "transparent", border: "1px solid var(--mf-magenta)30", borderRadius: 10, color: "var(--mf-magenta)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <X size={12} /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Active Projects View ---
function ActiveProjectsView() {
  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message ?? "Không thể tải danh sách project.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Active Projects</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>
            {loading ? "Loading…" : `${projects.length} series in production`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Production", "Review", "Scripting"].map((f, i) => (
            <button key={f} style={{ padding: "5px 12px", background: i === 0 ? "var(--mf-orange)" : "var(--mf-bg-surface)", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, color: i === 0 ? "#000" : "var(--mf-text-muted)", cursor: "pointer" }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "var(--mf-text-muted)" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Loading projects…</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 24px", background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", borderRadius: 12, color: "#ff4d6d" }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 0", color: "var(--mf-text-muted)" }}>
          <Package size={40} style={{ opacity: 0.35 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No projects found. Please create a project first.</p>
        </div>
      )}

      {/* Project cards */}
      {!loading && !error && projects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {projects.map(p => (
            <div key={p.id} style={{ padding: 18, background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border)", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${p.color}50`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--mf-border)")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "var(--mf-text)", marginBottom: 3 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", display: "flex", gap: 8 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={10} />{p.mangaka}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FileText size={10} />{p.chapter}</span>
                  </div>
                </div>
                <div style={{ padding: "4px 10px", background: `${p.color}18`, border: `1px solid ${p.color}40`, borderRadius: 7, fontSize: 10, color: p.color, fontWeight: 800 }}>{p.status}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Production Progress</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: p.color }}>{p.progress}%</span>
                </div>
                <div style={{ height: 6, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p.progress}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}90)`, borderRadius: 100, transition: "width 0.6s" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: "9px 12px", background: "var(--mf-bg-elevated)", borderRadius: 9 }}>
                  <div style={{ fontSize: 9, color: "var(--mf-text-muted)", marginBottom: 3 }}>BUDGET SPENT</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-green)" }}>${p.budget.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "var(--mf-text-muted)" }}>of ${p.allocated.toLocaleString()}</div>
                </div>
                <div style={{ padding: "9px 12px", background: "var(--mf-bg-elevated)", borderRadius: 9 }}>
                  <div style={{ fontSize: 9, color: "var(--mf-text-muted)", marginBottom: 3 }}>NEXT DEADLINE</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-orange)" }}>{p.nextDeadline}</div>
                  <div style={{ fontSize: 9, color: "var(--mf-text-muted)" }}>{p.genre}</div>
                </div>
              </div>
              {p.description && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--mf-bg-elevated)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
        setItems(projects.map(project => ({
          project: project.title,
          allocated: project.allocated,
          spent: project.budget,
          color: project.color,
        })));
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
  const [activeNav, setActiveNav] = useState("Pending Approvals");

  return (
    <AppLayout role="board" activeNav={activeNav} onNavClick={setActiveNav}>
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
