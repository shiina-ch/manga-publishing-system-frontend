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
const assistants = [
  { name: "Aiko Suzuki", skills: ["Coloring", "Screentone"], color: "var(--mf-magenta)" },
  { name: "Kenji Mori", skills: ["Background Art", "Props"], color: "var(--mf-cyan)" },
  { name: "Hana Ito", skills: ["Coloring", "Effects"], color: "var(--mf-orange)" },
];

const taskTags = ["Coloring", "Background Art", "Screentone", "Effects", "Line Clean-up", "Props"];

type DrawnPanel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedTo?: string;
  tags: string[];
};

function DelegationPanel() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [panels, setPanels] = useState<DrawnPanel[]>([]);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  
  // Assignment state
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [pendingAssistant, setPendingAssistant] = useState("");
  const [pendingTags, setPendingTags] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setPanels([]); // Reset panels on new image upload
      setSelectedPanelId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedPanelId) {
       setSelectedPanelId(null);
    }
    
    // To prevent drawing when clicking on existing boxes, check if e.target is the container
    if ((e.target as HTMLElement).id === "image-draw-container" || (e.target as HTMLElement).tagName === "IMG") {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentBox({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    setCurrentBox({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width: Math.abs(currentX - startPos.x),
      height: Math.abs(currentY - startPos.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentBox && currentBox.width > 20 && currentBox.height > 20) {
      const newPanel = {
        id: Math.random().toString(36).substr(2, 9),
        ...currentBox,
        tags: []
      };
      setPanels([...panels, newPanel]);
      openAssign(newPanel.id, newPanel);
    }
    setCurrentBox(null);
  };

  const openAssign = (panelId: string, precomputedPanel?: DrawnPanel) => {
    setSelectedPanelId(panelId);
    const panel = precomputedPanel || panels.find(p => p.id === panelId);
    if (panel) {
      setPendingAssistant(panel.assignedTo || "");
      setPendingTags(panel.tags || []);
    }
  };

  const saveAssignment = () => {
    if (!selectedPanelId || !pendingAssistant) return;
    setPanels(panels.map(p => 
      p.id === selectedPanelId 
        ? { ...p, assignedTo: pendingAssistant, tags: pendingTags }
        : p
    ));
    setSelectedPanelId(null);
  };

  const toggleTag = (tag: string) => {
    setPendingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div style={{ padding: "24px 28px", height: "100%", display: "flex", gap: 22, overflow: "hidden" }}>
      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em" }}>Assistant Delegation</h2>
            <p style={{ fontSize: 13, color: "var(--mf-text-muted)", marginTop: 3 }}>
              {uploadedImage ? "Drag to draw panels on the page, then assign to assistants" : "Upload a raw page to begin"}
            </p>
          </div>
          <div>
            <input 
              type="file" 
              accept="image/*" 
              id="upload-page" 
              style={{ display: "none" }} 
              onChange={handleImageUpload} 
            />
            <label 
              htmlFor="upload-page"
              style={{
                padding: "9px 18px",
                background: "var(--mf-bg-elevated)",
                border: "1px solid var(--mf-border-bright)",
                borderRadius: 10,
                color: "var(--mf-text)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              <Upload size={14} /> {uploadedImage ? "Replace Page" : "Upload Page"}
            </label>
          </div>
        </div>

        {uploadedImage ? (
          <div 
            style={{ 
              flex: 1, 
              background: "var(--mf-bg-deep)", 
              borderRadius: 14, 
              border: "1px solid var(--mf-border)", 
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: 20
            }}
          >
            {/* The Drawing Container */}
            <div 
              id="image-draw-container"
              style={{ 
                position: "relative", 
                cursor: "crosshair",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                display: "inline-block" // Ensure it fits image exactly
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                src={uploadedImage} 
                alt="Page Layout" 
                draggable="false"
                style={{ 
                  display: "block", 
                  maxWidth: "100%", 
                  height: "auto",
                  userSelect: "none",
                  pointerEvents: "none" // Let container handle events
                }} 
              />
              
              {/* Render drawn panels */}
              {panels.map((panel, i) => {
                const asgn = assistants.find(a => a.name === panel.assignedTo);
                const isSelected = selectedPanelId === panel.id;
                return (
                  <div 
                    key={panel.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAssign(panel.id);
                    }}
                    style={{
                      position: "absolute",
                      left: panel.x,
                      top: panel.y,
                      width: panel.width,
                      height: panel.height,
                      border: `2px ${panel.assignedTo ? 'solid' : 'dashed'} ${isSelected ? '#fff' : (asgn?.color || 'var(--mf-magenta)')}`,
                      background: asgn ? `${asgn.color}20` : "rgba(255, 42, 109, 0.1)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? `0 0 15px ${asgn?.color || 'var(--mf-magenta)'}` : "none",
                      zIndex: 10
                    }}
                  >
                    <div style={{
                      background: "rgba(0,0,0,0.6)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "white" }}>Panel {i + 1}</span>
                      {panel.assignedTo ? (
                        <span style={{ fontSize: 11, color: asgn?.color, fontWeight: 700 }}>
                          <Check size={10} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                          {panel.assignedTo.split(' ')[0]}
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, color: "var(--mf-text-muted)" }}>Click to assign</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Render box currently being drawn */}
              {isDrawing && currentBox && (
                <div style={{
                  position: "absolute",
                  left: currentBox.x,
                  top: currentBox.y,
                  width: currentBox.width,
                  height: currentBox.height,
                  border: "2px dashed var(--mf-magenta)",
                  background: "rgba(255, 42, 109, 0.2)",
                  pointerEvents: "none",
                  zIndex: 20
                }} />
              )}
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: 1, 
            background: "var(--mf-bg-surface)", 
            borderRadius: 14, 
            border: "1px dashed var(--mf-border-bright)", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            gap: 16
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--mf-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image size={28} color="var(--mf-text-muted)" />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mf-text)", marginBottom: 4 }}>No Page Uploaded</div>
              <div style={{ fontSize: 13, color: "var(--mf-text-muted)" }}>Upload a raw sketch or layout to start delegating</div>
            </div>
            <label 
              htmlFor="upload-page-center"
              style={{
                padding: "10px 20px",
                background: "var(--mf-magenta)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                boxShadow: "0 0 15px var(--mf-magenta-glow)"
              }}
            >
              <Upload size={14} /> Upload Page
            </label>
            <input 
              type="file" 
              accept="image/*" 
              id="upload-page-center" 
              style={{ display: "none" }} 
              onChange={handleImageUpload} 
            />
          </div>
        )}
      </div>

      {/* Assignment drawer */}
      {selectedPanelId && (
        <div style={{ width: 280, flexShrink: 0, background: "var(--mf-bg-surface)", borderRadius: 16, border: "1px solid var(--mf-border-bright)", padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>Assign Panel</div>
            <button onClick={() => setSelectedPanelId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)" }}><X size={14} /></button>
          </div>
          
          <div style={{ padding: "10px 12px", background: "var(--mf-bg-elevated)", borderRadius: 9, fontSize: 12, color: "var(--mf-text-secondary)" }}>
            Panel #{panels.findIndex(p => p.id === selectedPanelId) + 1}
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
            style={{ padding: "11px", background: pendingAssistant ? "var(--mf-magenta)" : "var(--mf-bg-elevated)", border: "none", borderRadius: 10, color: pendingAssistant ? "#fff" : "var(--mf-text-muted)", fontSize: 13, fontWeight: 800, cursor: pendingAssistant ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: pendingAssistant ? "0 0 18px var(--mf-magenta-glow)" : "none", marginTop: "auto" }}
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
