import { useState } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  Calendar, FileText, Users, Layers, Send, Plus, Check,
  ChevronRight, Clock, AlertTriangle, CheckCircle, Circle,
  Brush, Palette, Image, GripVertical, Tag, X, User,
  ArrowRight, Sparkles, Upload,
} from "lucide-react";

// --- Production Schedule Tab ---
const milestones = [
  { id: 1, label: "Script Finalization", due: "Jun 10", done: true, assigned: "Kishimoto-san" },
  { id: 2, label: "Character Rough Drafts (6 chars)", due: "Jun 17", done: true, assigned: "Kishimoto-san" },
  { id: 3, label: "Page Layouts (Ch.101, 20 pages)", due: "Jun 25", done: false, progress: 65, assigned: "Kishimoto-san" },
  { id: 4, label: "Inking & Line Art Complete", due: "Jul 3", done: false, progress: 20, assigned: "Kishimoto-san" },
  { id: 5, label: "Color Pass by Assistants", due: "Jul 10", done: false, progress: 0, assigned: "Team" },
  { id: 6, label: "Background Art Complete", due: "Jul 14", done: false, progress: 0, assigned: "Kenji (BG)" },
  { id: 7, label: "Final Compilation & Submit", due: "Jul 18", done: false, progress: 0, assigned: "Kishimoto-san" },
];

function ProductionSchedule() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Production Schedule</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Naruto Returns — Chapter 101 · Editor: Kishimoto-san</p>
        </div>
        <div style={{ padding: "7px 16px", background: "rgba(255,140,66,0.14)", border: "1px solid rgba(255,140,66,0.4)", borderRadius: 8, fontSize: 12, color: "var(--mf-orange)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={13} /> Due Jul 18 — 46 days
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ marginBottom: 28, padding: 18, background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text-secondary)" }}>Overall Chapter Progress</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: "var(--mf-magenta)" }}>31%</span>
        </div>
        <div style={{ height: 8, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "31%", background: "linear-gradient(90deg, var(--mf-magenta), var(--mf-cyan))", borderRadius: 100 }} />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          {[{ label: "Done", val: 2, color: "var(--mf-green)" }, { label: "In Progress", val: 2, color: "var(--mf-orange)" }, { label: "Pending", val: 3, color: "var(--mf-text-muted)" }].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--mf-text-muted)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span>{s.val} {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {milestones.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "var(--mf-bg-surface)", borderRadius: 12, border: `1px solid ${m.done ? "var(--mf-green)30" : "var(--mf-border)"}` }}>
            {/* Step indicator */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: m.done ? "var(--mf-green-dim)" : (m.progress && m.progress > 0) ? "var(--mf-magenta-dim)" : "var(--mf-bg-elevated)",
                border: `2px solid ${m.done ? "var(--mf-green)" : (m.progress && m.progress > 0) ? "var(--mf-magenta)" : "var(--mf-border-bright)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {m.done ? <Check size={13} color="var(--mf-green)" /> : <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>{i + 1}</span>}
              </div>
              {i < milestones.length - 1 && <div style={{ width: 2, height: 10, background: "var(--mf-border)" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: m.done ? "var(--mf-text-muted)" : "var(--mf-text)", textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
                {m.done && <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--mf-green-dim)", color: "var(--mf-green)", borderRadius: 100, fontWeight: 700 }}>DONE</span>}
              </div>
              {!m.done && m.progress !== undefined && m.progress > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ height: 4, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${m.progress}%`, background: "var(--mf-magenta)", borderRadius: 100 }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--mf-magenta)", marginTop: 2, display: "block" }}>{m.progress}% complete</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--mf-text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={10} /> {m.assigned}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> Due {m.due}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Script Drafts Tab ---
const scriptPages = [
  { page: 1, lines: ["Panel 1: WIDE — Neo-Tokyo skyline at dusk. Neon kanji signs everywhere.", "Panel 2: CLOSE — Kaito's eye, reflected city lights.", "SFX: 電子音 [Electronic hum]", "Panel 3: Kaito (narration): 'Ten years since the Akari Incident...'", "Panel 4: Street level. Rain. Kaito walks through holographic crowds.", "Panel 5: A hand on shoulder. MASKED FIGURE: 'You're him. The Null Blade.'"] },
  { page: 2, lines: ["Panel 1: Kaito turns slowly. His katana hilt glows faint cyan.", "Panel 2: MASKED FIGURE: 'The Sovereignty needs you. One last job.'", "Panel 3: Kaito: 'I don't work for ghosts.'", "Panel 4: WIDE — Figure removes mask. Reveal: AIRI, 28, battle-scarred.", "Panel 5: Airi: 'They have my brother. And they're coming for yours.'"] },
];

const characterSheets = [
  { name: "Kaito Murakami", role: "Protagonist · Ronin", color: "var(--mf-cyan)" },
  { name: "Airi Nakano", role: "Antagonist-Ally · Rebel", color: "var(--mf-magenta)" },
  { name: "The Sovereignty", role: "Faction · AI Collective", color: "var(--mf-orange)" },
];

function ScriptDrafts() {
  const [activePage, setActivePage] = useState(0);
  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Script & Character Drafts</h2>
        <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Chapter 101 — Working Draft v3</p>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, overflow: "hidden", minHeight: 0 }}>
        {/* Script panel */}
        <div style={{ background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={14} color="var(--mf-cyan)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)" }}>Script Text</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {scriptPages.map((_, i) => (
                <button key={i} onClick={() => setActivePage(i)} style={{ padding: "3px 10px", background: activePage === i ? "var(--mf-cyan)" : "var(--mf-bg-elevated)", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, color: activePage === i ? "#000" : "var(--mf-text-muted)", cursor: "pointer" }}>
                  Pg {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            <div style={{ fontSize: 11, color: "var(--mf-cyan)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 12 }}>PAGE {activePage + 1} — {scriptPages[activePage].lines.length} PANELS</div>
            {scriptPages[activePage].lines.map((line, i) => (
              <div key={i} style={{ marginBottom: 10, padding: "8px 12px", background: "var(--mf-bg-elevated)", borderRadius: 8, borderLeft: `3px solid ${line.startsWith("Panel") ? "var(--mf-cyan)" : line.startsWith("SFX") ? "var(--mf-orange)" : "var(--mf-magenta)"}` }}>
                <p style={{ fontSize: 12, color: "var(--mf-text-secondary)", lineHeight: 1.6, margin: 0 }}>{line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Character design panel */}
        <div style={{ background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color="var(--mf-magenta)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)" }}>Character Design Sheets</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {characterSheets.map((char) => (
              <div key={char.name} style={{ marginBottom: 12, padding: 14, background: "var(--mf-bg-elevated)", borderRadius: 12, border: `1px solid ${char.color}30` }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* Character art placeholder */}
                  <div style={{ width: 70, height: 90, borderRadius: 10, background: `linear-gradient(160deg, ${char.color}25, var(--mf-bg-deep))`, border: `1px solid ${char.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={26} color={char.color} style={{ opacity: 0.7 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)", marginBottom: 4 }}>{char.name}</div>
                    <div style={{ fontSize: 11, color: char.color, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 10 }}>{char.role}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["Front View", "Side View", "Action Pose", "Expression Sheet"].map(v => (
                        <div key={v} style={{ padding: "3px 8px", background: `${char.color}15`, borderRadius: 5, fontSize: 10, color: char.color, fontWeight: 600 }}>{v}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button style={{ width: "100%", padding: "10px", background: "transparent", border: "1px dashed var(--mf-border-bright)", borderRadius: 10, color: "var(--mf-text-muted)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <Plus size={14} /> Add Character Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Assistant Delegation Tab ---
const pages = [
  { id: 1, panels: [{ id: "1a", label: "Wide Shot — Skyline", assigned: null }, { id: "1b", label: "Close-up — Kaito Eye", assigned: "Aiko (Color)" }, { id: "1c", label: "Street Scene", assigned: null }] },
  { id: 2, panels: [{ id: "2a", label: "Two-shot Dialogue", assigned: "Kenji (BG Art)" }, { id: "2b", label: "Reveal Shot", assigned: null }, { id: "2c", label: "Reaction Panel", assigned: null }] },
  { id: 3, panels: [{ id: "3a", label: "Action Spread", assigned: null }, { id: "3b", label: "FX Panel", assigned: null }] },
  { id: 4, panels: [{ id: "4a", label: "Background — Cyberpunk City", assigned: null }, { id: "4b", label: "Crowd Scene", assigned: null }, { id: "4c", label: "Interior Lab", assigned: "Kenji (BG Art)" }] },
];

const assistants = [
  { name: "Aiko Suzuki", skills: ["Coloring", "Screentone"], color: "var(--mf-magenta)" },
  { name: "Kenji Mori", skills: ["Background Art", "Props"], color: "var(--mf-cyan)" },
  { name: "Hana Ito", skills: ["Coloring", "Effects"], color: "var(--mf-orange)" },
];

const taskTags = ["Coloring", "Background Art", "Screentone", "Effects", "Line Clean-up", "Props"];

function DelegationPanel() {
  const [selectedPanel, setSelectedPanel] = useState<{ pageId: number; panelId: string } | null>(null);
  const [assignments, setAssignments] = useState<Record<string, { assistant: string; tags: string[] }>>({
    "1b": { assistant: "Aiko Suzuki", tags: ["Coloring"] },
    "2a": { assistant: "Kenji Mori", tags: ["Background Art"] },
    "4c": { assistant: "Kenji Mori", tags: ["Background Art", "Props"] },
  });
  const [pendingAssistant, setPendingAssistant] = useState("");
  const [pendingTags, setPendingTags] = useState<string[]>([]);

  const openAssign = (pageId: number, panelId: string) => {
    setSelectedPanel({ pageId, panelId });
    const existing = assignments[panelId];
    setPendingAssistant(existing?.assistant || "");
    setPendingTags(existing?.tags || []);
  };

  const saveAssignment = () => {
    if (!selectedPanel || !pendingAssistant) return;
    setAssignments(prev => ({ ...prev, [selectedPanel.panelId]: { assistant: pendingAssistant, tags: pendingTags } }));
    setSelectedPanel(null);
  };

  const toggleTag = (tag: string) => {
    setPendingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", gap: 22, overflow: "hidden" }}>
      {/* Pages grid */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Assistant Delegation</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Select a panel to assign an assistant</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {pages.map(page => (
            <div key={page.id} style={{ background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 8 }}>
                <Image size={13} color="var(--mf-magenta)" />
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-text)" }}>Page {page.id}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--mf-text-muted)" }}>{page.panels.filter(p => assignments[p.id]).length}/{page.panels.length} assigned</span>
              </div>
              {/* Page thumbnail mock */}
              <div style={{ margin: 12, height: 120, background: "var(--mf-bg-deep)", borderRadius: 8, display: "grid", gridTemplateColumns: `repeat(${page.panels.length}, 1fr)`, gap: 4, padding: 8, border: "1px solid var(--mf-border)" }}>
                {page.panels.map((panel, pi) => {
                  const asgn = assignments[panel.id];
                  return (
                    <button
                      key={panel.id}
                      onClick={() => openAssign(page.id, panel.id)}
                      style={{
                        background: asgn
                          ? (assistants.find(a => a.name === asgn.assistant)?.color + "20" || "var(--mf-magenta-dim)")
                          : "var(--mf-bg-elevated)",
                        border: `1px solid ${asgn ? (assistants.find(a => a.name === asgn.assistant)?.color || "var(--mf-magenta)") + "50" : "var(--mf-border)"}`,
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: 4,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--mf-cyan)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = asgn ? (assistants.find(a => a.name === asgn.assistant)?.color || "var(--mf-magenta)") + "50" : "var(--mf-border)")}
                    >
                      <span style={{ fontSize: 8, color: asgn ? "var(--mf-text-secondary)" : "var(--mf-text-muted)", textAlign: "center", lineHeight: 1.3 }}>P{pi + 1}</span>
                      {asgn ? <Check size={10} color={assistants.find(a => a.name === asgn.assistant)?.color || "var(--mf-green)"} /> : <Plus size={10} color="var(--mf-text-muted)" />}
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: "0 12px 12px" }}>
                {page.panels.map(panel => {
                  const asgn = assignments[panel.id];
                  const ast = assistants.find(a => a.name === asgn?.assistant);
                  return (
                    <div key={panel.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: asgn ? (ast?.color || "var(--mf-text-muted)") : "var(--mf-text-muted)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: "var(--mf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{panel.label}</span>
                      {asgn ? (
                        <span style={{ fontSize: 10, color: ast?.color, fontWeight: 700, letterSpacing: "0.03em", flexShrink: 0 }}>{asgn.assistant.split(" ")[0]}</span>
                      ) : (
                        <button onClick={() => openAssign(page.id, panel.id)} style={{ fontSize: 10, color: "var(--mf-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}>Assign</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment drawer */}
      {selectedPanel && (
        <div style={{ width: 280, flexShrink: 0, background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border-bright)", padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>Assign Panel</div>
            <button onClick={() => setSelectedPanel(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)" }}><X size={14} /></button>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--mf-bg-elevated)", borderRadius: 9, fontSize: 12, color: "var(--mf-text-secondary)" }}>
            Page {selectedPanel.pageId} — Panel {selectedPanel.panelId.slice(-1).toUpperCase()}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 10 }}>SELECT ASSISTANT</div>
            {assistants.map(ast => (
              <button
                key={ast.name}
                onClick={() => setPendingAssistant(ast.name)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 6, background: pendingAssistant === ast.name ? `${ast.color}18` : "var(--mf-bg-elevated)", border: `1px solid ${pendingAssistant === ast.name ? ast.color + "60" : "var(--mf-border)"}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${ast.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={13} color={ast.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)" }}>{ast.name}</div>
                  <div style={{ fontSize: 10, color: ast.color, fontWeight: 600 }}>{ast.skills.join(" · ")}</div>
                </div>
                {pendingAssistant === ast.name && <Check size={13} color={ast.color} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.06em", marginBottom: 10 }}>TASK TAGS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {taskTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{ padding: "5px 11px", background: pendingTags.includes(tag) ? "var(--mf-magenta-dim)" : "var(--mf-bg-elevated)", border: `1px solid ${pendingTags.includes(tag) ? "var(--mf-magenta)50" : "var(--mf-border)"}`, borderRadius: 100, fontSize: 11, color: pendingTags.includes(tag) ? "var(--mf-magenta)" : "var(--mf-text-muted)", cursor: "pointer", fontWeight: pendingTags.includes(tag) ? 700 : 400 }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveAssignment}
            disabled={!pendingAssistant}
            style={{ padding: "11px", background: pendingAssistant ? "var(--mf-magenta)" : "var(--mf-bg-elevated)", border: "none", borderRadius: 10, color: pendingAssistant ? "#fff" : "var(--mf-text-muted)", fontSize: 13, fontWeight: 800, cursor: pendingAssistant ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: pendingAssistant ? "0 0 18px var(--mf-magenta-glow)" : "none" }}
          >
            <Tag size={13} /> Assign Task
          </button>
        </div>
      )}
    </div>
  );
}

// --- Page Compilation Tab ---
const compiledPages = [
  { id: 1, title: "Page 1 — Opening Wide", layers: [{ name: "Line Art", status: "done" }, { name: "Coloring", status: "done" }, { name: "Background", status: "pending" }, { name: "Effects", status: "done" }] },
  { id: 2, title: "Page 2 — Dialogue Scene", layers: [{ name: "Line Art", status: "done" }, { name: "Coloring", status: "in-progress" }, { name: "Background", status: "done" }, { name: "Screentone", status: "pending" }] },
  { id: 3, title: "Page 3 — Action Spread", layers: [{ name: "Line Art", status: "done" }, { name: "Coloring", status: "pending" }, { name: "Speed Lines", status: "pending" }, { name: "Effects", status: "pending" }] },
  { id: 4, title: "Page 4 — Reveal Shot", layers: [{ name: "Line Art", status: "done" }, { name: "Background", status: "in-progress" }, { name: "Coloring", status: "pending" }] },
];

const layerStatusColor = (s: string) => s === "done" ? "var(--mf-green)" : s === "in-progress" ? "var(--mf-orange)" : "var(--mf-text-muted)";

function PageCompilation() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Page Compilation</h2>
          <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Drag pages to reorder · Merge all layers before submitting</p>
        </div>
        <button
          onClick={() => setSubmitted(true)}
          style={{
            padding: "11px 24px",
            background: submitted ? "var(--mf-green-dim)" : "var(--mf-magenta)",
            border: submitted ? "1px solid var(--mf-green)" : "none",
            borderRadius: 10,
            color: submitted ? "var(--mf-green)" : "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: submitted ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: submitted ? "none" : "0 0 24px var(--mf-magenta-glow)",
            letterSpacing: "0.04em",
          }}
        >
          {submitted ? <><CheckCircle size={15} /> SUBMITTED TO EDITOR</> : <><Send size={14} /> SUBMIT CHAPTER TO EDITOR</>}
        </button>
      </div>

      {submitted && (
        <div style={{ marginBottom: 18, padding: "14px 18px", background: "var(--mf-green-dim)", border: "1px solid var(--mf-green)40", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle size={16} color="var(--mf-green)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-green)" }}>Chapter 101 submitted successfully!</div>
            <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 2 }}>Editor Kenji Yamada has been notified. Expected review: 48 hours.</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {compiledPages.map((page) => {
          const allDone = page.layers.every(l => l.status === "done");
          return (
            <div key={page.id} style={{ display: "flex", gap: 16, padding: "16px 18px", background: "var(--mf-bg-surface)", borderRadius: 14, border: `1px solid ${allDone ? "var(--mf-green)30" : "var(--mf-border)"}`, alignItems: "flex-start" }}>
              <div style={{ color: "var(--mf-text-muted)", cursor: "grab", paddingTop: 2, flexShrink: 0 }}><GripVertical size={16} /></div>
              {/* Thumbnail */}
              <div style={{ width: 64, height: 80, background: "linear-gradient(160deg, var(--mf-bg-elevated), var(--mf-bg-deep))", borderRadius: 8, border: "1px solid var(--mf-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image size={20} color="var(--mf-text-muted)" style={{ opacity: 0.5 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>{page.title}</span>
                  {allDone && <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--mf-green-dim)", color: "var(--mf-green)", borderRadius: 100, fontWeight: 700 }}>ALL LAYERS READY</span>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {page.layers.map(layer => (
                    <div key={layer.name} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--mf-bg-elevated)", borderRadius: 7, border: `1px solid ${layerStatusColor(layer.status)}30` }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: layerStatusColor(layer.status) }} />
                      <span style={{ fontSize: 11, color: "var(--mf-text-secondary)", fontWeight: 600 }}>{layer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button style={{ padding: "6px 14px", background: allDone ? "var(--mf-green-dim)" : "var(--mf-bg-elevated)", border: `1px solid ${allDone ? "var(--mf-green)40" : "var(--mf-border)"}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: allDone ? "var(--mf-green)" : "var(--mf-text-muted)", cursor: "pointer", flexShrink: 0 }}>
                {allDone ? "Merged ✓" : "Merge"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Submitted Chapters View ---
const submittedChapters = [
  { id: 1, title: "Naruto Returns — Chapter 98", submittedDate: "May 3, 2026", editor: "Kenji Yamada", status: "approved", pages: 20 },
  { id: 2, title: "Naruto Returns — Chapter 99", submittedDate: "May 20, 2026", editor: "Kenji Yamada", status: "in-revision", pages: 18 },
  { id: 3, title: "Naruto Returns — Chapter 100", submittedDate: "Jun 1, 2026", editor: "Kenji Yamada", status: "under-review", pages: 22 },
];

const chapterStatusMap: Record<string, { label: string; color: string }> = {
  approved: { label: "Approved", color: "var(--mf-green)" },
  "in-revision": { label: "In Revision", color: "var(--mf-orange)" },
  "under-review": { label: "Under Review", color: "var(--mf-cyan)" },
};

function SubmittedChapters() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Submitted Chapters</h2>
        <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>Naruto Returns — All submissions to date</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {submittedChapters.map(ch => {
          const st = chapterStatusMap[ch.status];
          return (
            <div key={ch.id} style={{ padding: "18px 20px", background: "var(--mf-bg-surface)", borderRadius: 14, border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 56, height: 70, borderRadius: 8, background: "linear-gradient(160deg, var(--mf-magenta-dim), var(--mf-bg-deep))", border: "1px solid var(--mf-magenta)30", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={22} color="var(--mf-magenta)" style={{ opacity: 0.7 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--mf-text)", marginBottom: 4 }}>{ch.title}</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--mf-text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {ch.submittedDate}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FileText size={11} /> {ch.pages} pages</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={11} /> {ch.editor}</span>
                </div>
              </div>
              <div style={{ padding: "6px 14px", background: `${st.color}18`, border: `1px solid ${st.color}40`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                {st.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---
const tabs = [
  { id: "schedule", label: "Production Schedule", icon: Calendar },
  { id: "script", label: "Script Drafts", icon: FileText },
  { id: "delegate", label: "Delegate Work", icon: Users },
  { id: "compile", label: "Compile Chapter", icon: Layers },
];

export function MangakaStudio() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeNav, setActiveNav] = useState("My Projects");

  const handleNavClick = (label: string) => {
    setActiveNav(label);
    if (label === "My Projects") setActiveTab("schedule");
    else if (label === "Deadlines") setActiveTab("schedule");
    else if (label === "Script Drafts") setActiveTab("script");
    // "Submitted" shows the submitted view (handled by activeNav check in render)
  };

  return (
    <AppLayout role="mangaka" activeNav={activeNav} onNavClick={handleNavClick}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 28px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)40", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brush size={17} color="var(--mf-magenta)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>#naruto-ch-101</div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Naruto Returns · Chapter 101 · Due Jul 18</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ padding: "5px 12px", background: "var(--mf-green-dim)", border: "1px solid var(--mf-green)40", borderRadius: 7, fontSize: 11, color: "var(--mf-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mf-green)" }} /> 2 Assistants Online
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 2, padding: "10px 28px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", flexShrink: 0, overflowX: "auto" }}>
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <div key={tab.id} style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
                    background: active ? "var(--mf-magenta-dim)" : "transparent",
                    border: active ? "1px solid var(--mf-magenta)40" : "1px solid transparent",
                    borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap",
                    color: active ? "var(--mf-magenta)" : "var(--mf-text-muted)",
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span style={{ fontSize: 10, color: active ? "var(--mf-magenta)" : "var(--mf-text-muted)", fontWeight: 700 }}>
                    {i + 1}/4
                  </span>
                </button>
                {i < tabs.length - 1 && <ChevronRight size={13} color="var(--mf-text-muted)" style={{ margin: "0 2px", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeNav === "Submitted" ? (
            <SubmittedChapters />
          ) : (
            <>
              {activeTab === "schedule" && <ProductionSchedule />}
              {activeTab === "script" && <ScriptDrafts />}
              {activeTab === "delegate" && <DelegationPanel />}
              {activeTab === "compile" && <PageCompilation />}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
