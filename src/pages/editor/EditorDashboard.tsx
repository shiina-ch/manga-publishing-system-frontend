import { useEffect, useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  Send, RefreshCw, ArrowUpRight, X, MessageSquare, BookOpen,
  Tag, Clock, Eye, MoreHorizontal, Sparkles, User, CheckCircle,
  AlertTriangle, Inbox,
} from "lucide-react";
import { getSubmissions, submissionToEditorProposal, type EditorProposal } from "../../services/workflowApi";

const allProposals = [
  { id: 1, title: "Neon Samurai: The Last Blade", mangaka: "Ryu Akimoto", genre: ["Action", "Cyberpunk"], synopsis: "In 2187 Neo-Tokyo, disgraced ronin Kaito discovers his katana can cut digital constructs. When a corrupt AI enslaves humanity through AR, Kaito must master ancient and digital combat.", pages: 32, status: "new", time: "2h ago", concepts: 4 },
  { id: 2, title: "Bloom Protocol", mangaka: "Yuki Tanaka", genre: ["Romance", "Sci-Fi"], synopsis: "A bioengineer and a synthetic human navigate the boundaries of love and ethics. What does it mean to feel, when feelings can be patched?", pages: 28, status: "revision", time: "1d ago", concepts: 2, editorNote: "Great premise! Please expand the second act — the romantic tension needs more buildup before the emotional reveal." },
  { id: 3, title: "Ghost Meridian", mangaka: "Sora Hayashi", genre: ["Thriller", "Supernatural"], synopsis: "A detective who can see 48 hours into the future must prevent crimes before they happen — but each vision costs a piece of her soul.", pages: 24, status: "escalated", time: "3d ago", concepts: 6 },
  { id: 4, title: "Iron Lotus", mangaka: "Hana Mori", genre: ["Sports", "Drama"], synopsis: "A deaf gymnast from rural Kyushu fights her way to the World Championships, her routines inspired by patterns only she can perceive.", pages: 40, status: "new", time: "5h ago", concepts: 3 },
  { id: 5, title: "Void Chronicle", mangaka: "Daichi Ito", genre: ["Sci-Fi", "Action"], synopsis: "Humanity's last astronaut drifts through a dead universe and discovers that stars can think — and they are angry.", pages: 36, status: "revision", time: "2d ago", concepts: 5, editorNote: "Strong concept but chapter 2 pacing drags significantly. Please tighten the exposition." },
  { id: 6, title: "Summer Oni", mangaka: "Rei Fujimoto", genre: ["Fantasy", "Slice of Life"], synopsis: "A high school girl discovers her grandmother is actually an ancient oni spirit, and must help her navigate modern life before summer ends.", pages: 22, status: "approved", time: "5d ago", concepts: 4 },
  { id: 7, title: "Circuit Dancer", mangaka: "Nao Kimura", genre: ["Music", "Drama"], synopsis: "An underground DJ in Neo-Osaka can alter reality through illegal music frequencies — until the government notices.", pages: 30, status: "approved", time: "1w ago", concepts: 3 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New Proposal", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  revision: { label: "In Revision", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  escalated: { label: "Escalated", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
  approved: { label: "Approved", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] || statusConfig.new;
  return <span style={{ padding: "3px 10px", background: s.bg, color: s.color, fontSize: 10, fontWeight: 800, borderRadius: 100, letterSpacing: "0.06em", border: `1px solid ${s.color}35`, whiteSpace: "nowrap" }}>{s.label}</span>;
}

function ProposalFeed({ filter, escalated, onEscalate, proposals }: { filter: string; escalated: Set<number>; onEscalate: (id: number) => void; proposals: EditorProposal[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revisionMode, setRevisionMode] = useState<number | null>(null);
  const [revisionText, setRevisionText] = useState("");

  const filtered = proposals.filter(p => {
    if (filter === "New Proposals") return p.status === "new";
    if (filter === "In Revision") return p.status === "revision";
    if (filter === "Escalated to Board") return escalated.has(p.id) || p.status === "escalated";
    if (filter === "Approved") return p.status === "approved";
    return true;
  });

  const proposal = filtered.find(p => p.id === selected) || filtered[0];
  const effectiveSelected = proposal?.id ?? null;

  if (filtered.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-text-muted)" }}>
        <Inbox size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>No proposals in this category</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Feed list */}
      <div style={{ width: 350, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900 }}>{filter}</h2>
            <p style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2 }}>{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ padding: "4px 10px", background: "var(--mf-cyan-dim)", border: "1px solid var(--mf-cyan)35", borderRadius: 7, fontSize: 10, color: "var(--mf-cyan)", fontWeight: 800 }}>{filtered.length}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              style={{ display: "block", width: "100%", padding: "12px 13px", marginBottom: 7, background: effectiveSelected === p.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)", border: `1px solid ${effectiveSelected === p.id ? "var(--mf-cyan)35" : "var(--mf-border)"}`, borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--mf-text)", lineHeight: 1.3, flex: 1 }}>{p.title}</span>
                <StatusBadge status={escalated.has(p.id) ? "escalated" : p.status} />
              </div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                <User size={10} /><span>{p.mangaka}</span><span style={{ opacity: 0.4 }}>·</span><Clock size={10} /><span>{p.time}</span>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {p.genre.map(g => <span key={g} style={{ padding: "2px 7px", background: "var(--mf-bg-elevated)", borderRadius: 5, fontSize: 10, color: "var(--mf-text-secondary)", fontWeight: 600 }}>{g}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail view */}
      {proposal && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px 13px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>{proposal.title}</h1>
                <StatusBadge status={escalated.has(proposal.id) ? "escalated" : proposal.status} />
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--mf-text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} />{proposal.mangaka}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{proposal.time}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={11} />{proposal.pages}pp</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={11} />{proposal.concepts} concepts</span>
              </div>
            </div>
            <button style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 8, padding: "6px 13px", fontSize: 12, color: "var(--mf-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <MoreHorizontal size={13} /> Actions
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
              {proposal.genre.map(g => <div key={g} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)35", borderRadius: 8, fontSize: 12, color: "var(--mf-magenta)", fontWeight: 700 }}><Tag size={10} />{g}</div>)}
            </div>
            <div style={{ marginBottom: 20, padding: 18, background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 10 }}>SYNOPSIS</div>
              <p style={{ fontSize: 14, color: "var(--mf-text-secondary)", lineHeight: 1.72 }}>{proposal.synopsis}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 11 }}>CONCEPT ART — {proposal.concepts} SHEETS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                {[...Array(proposal.concepts)].map((_, i) => (
                  <div key={i} style={{ aspectRatio: "3/4", background: `linear-gradient(135deg, ${["#2D1E3A","#1A1028","#221630","#1E1828"][i%4]} 0%, var(--mf-bg-deep) 100%)`, borderRadius: 10, border: "1px solid var(--mf-border-bright)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                    <Sparkles size={16} color={["var(--mf-magenta)","var(--mf-cyan)","var(--mf-orange)","var(--mf-green)"][i%4]} />
                    <span style={{ fontSize: 9, color: "var(--mf-text-muted)", fontWeight: 700 }}>CONCEPT {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
            {(proposal as any).editorNote && (
              <div style={{ marginBottom: 20, padding: 16, background: "rgba(255,140,66,0.08)", borderRadius: 12, border: "1px solid rgba(255,140,66,0.25)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-orange)", letterSpacing: "0.08em", marginBottom: 8 }}>EDITOR NOTE (SENT)</div>
                <p style={{ fontSize: 13, color: "var(--mf-text-secondary)", lineHeight: 1.65 }}>{(proposal as any).editorNote}</p>
              </div>
            )}
            {revisionMode === proposal.id && (
              <div style={{ marginBottom: 20, padding: 18, background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border-bright)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Send Feedback to Mangaka</div>
                  <button onClick={() => setRevisionMode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)" }}><X size={13} /></button>
                </div>
                <textarea value={revisionText} onChange={e => setRevisionText(e.target.value)} rows={4}
                  placeholder="Write specific, actionable feedback..."
                  style={{ width: "100%", padding: "11px 14px", background: "var(--mf-bg-deep)", border: "1px solid var(--mf-border-bright)", borderRadius: 9, color: "var(--mf-text)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "var(--mf-orange)")}
                  onBlur={e => (e.target.style.borderColor = "var(--mf-border-bright)")}
                />
                <button onClick={() => { setRevisionMode(null); setRevisionText(""); }}
                  style={{ marginTop: 10, padding: "8px 16px", background: "rgba(255,140,66,0.13)", border: "1px solid rgba(255,140,66,0.4)", borderRadius: 8, color: "var(--mf-orange)", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Send size={12} /> Send to Mangaka
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: "13px 24px", borderTop: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setRevisionMode(proposal.id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 17px", background: "rgba(255,140,66,0.12)", border: "1px solid rgba(255,140,66,0.4)", borderRadius: 10, color: "var(--mf-orange)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <RefreshCw size={13} /> Request Revision
            </button>
            <button onClick={() => onEscalate(proposal.id)} disabled={escalated.has(proposal.id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: escalated.has(proposal.id) ? "var(--mf-green-dim)" : "var(--mf-cyan)", border: escalated.has(proposal.id) ? "1px solid var(--mf-green)" : "none", borderRadius: 10, color: escalated.has(proposal.id) ? "var(--mf-green)" : "#000", fontSize: 13, fontWeight: 800, cursor: escalated.has(proposal.id) ? "default" : "pointer", boxShadow: escalated.has(proposal.id) ? "none" : "0 0 18px var(--mf-cyan-glow)" }}>
              {escalated.has(proposal.id) ? <><CheckCircle size={13} /> Escalated</> : <><ArrowUpRight size={13} /> Escalate to Board</>}
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 10, color: "var(--mf-text-secondary)", fontSize: 13, cursor: "pointer" }}>
              <MessageSquare size={13} /> Comment
            </button>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--mf-green)" }} />
              <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Mangaka online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorDashboard() {
  const [activeNav, setActiveNav] = useState("New Proposals");
  const [escalated, setEscalated] = useState<Set<number>>(new Set());
  const [proposals, setProposals] = useState<EditorProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSubmissions()
      .then(rows => {
        if (!cancelled) setProposals(rows.map(submissionToEditorProposal));
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message || "Failed to load editor submissions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout role="editor" activeNav={activeNav} onNavClick={setActiveNav}>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ position: "absolute", top: 0, left: 240, right: 0, zIndex: 10 }}>
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeNav === "Approved" ? "var(--mf-magenta)" : activeNav === "Escalated to Board" ? "var(--mf-green)" : activeNav === "In Revision" ? "var(--mf-orange)" : "var(--mf-cyan)" }} />
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>{activeNav}</span>
            {activeNav === "Escalated to Board" && (
              <span style={{ fontSize: 11, color: "var(--mf-green)", padding: "2px 8px", background: "var(--mf-green-dim)", borderRadius: 6, fontWeight: 700 }}>Sent to Board for Approval</span>
            )}
            {activeNav === "Approved" && (
              <span style={{ fontSize: 11, color: "var(--mf-magenta)", padding: "2px 8px", background: "var(--mf-magenta-dim)", borderRadius: 6, fontWeight: 700 }}>Ready to Escalate</span>
            )}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: 53, overflow: "hidden" }}>
          {loading && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-text-muted)" }}>
              Loading editor submissions...
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: 24, color: "var(--mf-magenta)" }}>{error}</div>
          )}
          {!loading && !error && (
            <ProposalFeed
              filter={activeNav}
              escalated={escalated}
              proposals={proposals}
              onEscalate={(id) => setEscalated(prev => new Set([...prev, id]))}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
