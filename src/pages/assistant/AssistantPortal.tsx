import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  Brush, Layers, Send, CheckCircle, AlertTriangle,
  Plus, Eraser, Pipette, ZoomIn, ZoomOut,
  RotateCcw, Eye, EyeOff, Lock, Unlock,
} from "lucide-react";
import { getSketchTasks, getTasks, taskToAssistantTask, type AssistantTask } from "../../services/workflowApi";

const allTasks = [
  { id: 1, page: 4, panel: "A", label: "Draw Background — Cyberpunk City", tags: ["Background Art"], mangaka: "Kishimoto-san", due: "Jun 20", priority: "high", status: "active" },
  { id: 2, page: 1, panel: "A", label: "Color — Opening Wide Shot", tags: ["Coloring", "Screentone"], mangaka: "Kishimoto-san", due: "Jun 18", priority: "high", status: "active" },
  { id: 3, page: 2, panel: "B", label: "Screentone — Rain Effect", tags: ["Screentone"], mangaka: "Kishimoto-san", due: "Jun 22", priority: "medium", status: "pending" },
  { id: 4, page: 3, panel: "A", label: "Effects — Speed Lines + FX", tags: ["Effects"], mangaka: "Kishimoto-san", due: "Jun 25", priority: "low", status: "pending" },
  { id: 5, page: 2, panel: "A", label: "Color — Dialogue Scene", tags: ["Coloring"], mangaka: "Kishimoto-san", due: "Jun 19", priority: "medium", status: "submitted" },
];

const canvasLayers = [
  { id: 1, name: "Line Art (from Mangaka)", locked: true, visible: true, opacity: 100 },
  { id: 2, name: "BG Color Base", locked: false, visible: true, opacity: 100 },
  { id: 3, name: "Building Neons", locked: false, visible: true, opacity: 85 },
  { id: 4, name: "Street Details", locked: false, visible: true, opacity: 90 },
  { id: 5, name: "Atmosphere / Fog", locked: false, visible: true, opacity: 60 },
];

const tagColor: Record<string, string> = {
  "Background Art": "var(--mf-cyan)",
  "Coloring": "var(--mf-magenta)",
  "Screentone": "var(--mf-orange)",
  "Effects": "var(--mf-green)",
};

const priorityColor: Record<string, string> = {
  high: "var(--mf-magenta)",
  medium: "var(--mf-orange)",
  low: "var(--mf-text-muted)",
};

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "In Progress", color: "var(--mf-cyan)" },
  pending: { label: "Pending", color: "var(--mf-text-muted)" },
  submitted: { label: "Submitted", color: "var(--mf-green)" },
};

function drawCyberpunkBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#080615");
  sky.addColorStop(0.45, "#0F0A20");
  sky.addColorStop(1, "#1A0D2E");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 60; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h * 0.5;
    const sr = Math.random() * 1.2 + 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.2})`;
    ctx.fill();
  }

  // Buildings
  const buildings = [
    { x: 0, y: 320, w: 70, h: 280 },
    { x: 80, y: 260, w: 55, h: 340 },
    { x: 145, y: 340, w: 45, h: 260 },
    { x: 200, y: 200, w: 80, h: 400 },
    { x: 290, y: 280, w: 60, h: 320 },
    { x: 360, y: 150, w: 90, h: 450 },
    { x: 460, y: 240, w: 55, h: 360 },
    { x: 525, y: 270, w: 75, h: 330 },
  ];

  buildings.forEach((b, i) => {
    const buildingGrad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y);
    const hue = 250 + i * 12;
    buildingGrad.addColorStop(0, `hsl(${hue}, 35%, 10%)`);
    buildingGrad.addColorStop(1, `hsl(${hue}, 30%, 7%)`);
    ctx.fillStyle = buildingGrad;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Windows
    const cols = Math.floor(b.w / 12);
    const rowCount = Math.floor(b.h / 16);
    for (let row = 1; row < rowCount; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > 0.45) continue;
        const wx = b.x + col * 12 + 3;
        const wy = b.y + row * 16 + 2;
        const colors = ["#00F0FF", "#FF2A7A", "#FFD700", "#39FF8A", "#FFFFFF"];
        const wc = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = wc;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillRect(wx, wy, 5, 6);
        ctx.globalAlpha = 1;
      }
    }

    // Rooftop antennae
    ctx.strokeStyle = `hsl(${hue}, 30%, 20%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w / 2, b.y);
    ctx.lineTo(b.x + b.w / 2, b.y - 20 - Math.random() * 30);
    ctx.stroke();
  });

  // Ground / street
  const groundGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
  groundGrad.addColorStop(0, "#0A0618");
  groundGrad.addColorStop(1, "#050310");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.75, w, h * 0.25);

  // Street neon glow reflections
  const neons = [
    { x: 0, color: "#FF2A7A" },
    { x: w * 0.4, color: "#00F0FF" },
    { x: w * 0.75, color: "#39FF8A" },
  ];
  neons.forEach(n => {
    const g = ctx.createRadialGradient(n.x, h * 0.76, 0, n.x, h * 0.76, 200);
    g.addColorStop(0, `${n.color}40`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
  });

  // Horizontal scanline overlay
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, y, w, 1);
  }

  // Panel border
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, w - 4, h - 4);
}

export function AssistantPortal() {
  const [activeNav, setActiveNav] = useState("My Assignments");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [allTasksFromApi, setAllTasksFromApi] = useState<AssistantTask[]>([]);
  const [layers, setLayers] = useState(canvasLayers);
  const [activeTool, setActiveTool] = useState("brush");
  const [brushSize, setBrushSize] = useState(12);
  const [submitted, setSubmitted] = useState<Set<number>>(new Set([5]));
  const [zoom, setZoom] = useState(100);
  const [activeColor, setActiveColor] = useState("#00F0FF");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef<ImageData[]>([]);
  const bgDrawnRef = useRef(false);

  // Draw background once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bgDrawnRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCyberpunkBackground(ctx, canvas.width, canvas.height);
    bgDrawnRef.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getTasks(), getSketchTasks()])
      .then(([tasks, sketchTasks]) => {
        if (cancelled) return;
        const mapped = [...tasks.map(taskToAssistantTask), ...sketchTasks.map(taskToAssistantTask)];
        setAllTasksFromApi(mapped);
        setSelectedTask(mapped[0]?.id ?? null);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message || "Failed to load assistant tasks.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 40) historyRef.current.shift();
  }, []);

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "brush" && activeTool !== "eraser") return;
    saveHistory();
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e);
  }, [activeTool, getPos, saveHistory]);

  const onDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = brushSize * 2.5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = brushSize > 6 ? 8 : 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    lastPosRef.current = pos;
  }, [activeTool, brushSize, activeColor, getPos]);

  const stopDraw = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = historyRef.current.pop()!;
    ctx.putImageData(prev, 0, 0);
  }, []);

  const handleNavClick = (label: string) => {
    setActiveNav(label);
  };

  const tasks = activeNav === "In Progress"
    ? allTasksFromApi.filter(t => t.status === "active" || t.status === "in_progress")
    : activeNav === "Submitted"
    ? allTasksFromApi.filter(t => submitted.has(t.id) || t.status === "submitted")
    : allTasksFromApi;

  const activeTask = allTasksFromApi.find(t => t.id === selectedTask);

  const toggleLayerVisibility = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };
  const toggleLayerLock = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const handleSubmit = () => {
    if (!activeTask) return;
    setSubmitted(prev => new Set([...prev, activeTask.id]));
  };

  const toolList = [
    { id: "brush", icon: Brush, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "eyedropper", icon: Pipette, label: "Eyedropper" },
    { id: "zoom-in", icon: ZoomIn, label: "Zoom In", action: () => setZoom(z => Math.min(400, z + 25)) },
    { id: "zoom-out", icon: ZoomOut, label: "Zoom Out", action: () => setZoom(z => Math.max(25, z - 25)) },
    { id: "undo", icon: RotateCcw, label: "Undo", action: handleUndo },
  ];

  return (
    <AppLayout role="assistant" activeNav={activeNav} onNavClick={handleNavClick}>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

        {/* Left: Task list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid var(--mf-border)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em" }}>{activeNav}</h2>
            <p style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 3 }}>Ch.101 — Naruto Returns</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mf-text-muted)", fontSize: 13 }}>
                Loading tasks...
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mf-magenta)", fontSize: 13 }}>
                {error}
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mf-text-muted)", fontSize: 13 }}>
                No tasks found in the database.
              </div>
            ) : tasks.map(task => {
              const isSubmitted = submitted.has(task.id);
              const statusInfo = isSubmitted ? { label: "Submitted", color: "var(--mf-green)" } : statusMap[task.status];
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  style={{
                    display: "block", width: "100%", padding: "12px 14px", marginBottom: 8,
                    background: selectedTask === task.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)",
                    border: `1px solid ${selectedTask === task.id ? "var(--mf-green)40" : "var(--mf-border)"}`,
                    borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    opacity: isSubmitted ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)", lineHeight: 1.3, flex: 1 }}>{task.label}</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor[task.priority], flexShrink: 0, marginTop: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 8 }}>
                    Page {task.page} · Panel {task.panel} · Due {task.due}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {task.tags.map(tag => (
                      <span key={tag} style={{ padding: "2px 8px", background: `${tagColor[tag] || "var(--mf-text-muted)"}18`, border: `1px solid ${tagColor[tag] || "var(--mf-text-muted)"}30`, borderRadius: 100, fontSize: 10, color: tagColor[tag] || "var(--mf-text-muted)", fontWeight: 700 }}>{tag}</span>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: statusInfo.color, fontWeight: 700 }}>{statusInfo.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Canvas area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Canvas toolbar */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)" }}>
              {activeTask ? `Pg ${activeTask.page} · Panel ${activeTask.panel} — ${activeTask.label}` : "Select a task"}
            </div>
            <div style={{ height: 18, width: 1, background: "var(--mf-border)" }} />
            {/* Tools */}
            <div style={{ display: "flex", gap: 4 }}>
              {toolList.map(tool => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (tool.action) { tool.action(); }
                      else setActiveTool(tool.id);
                    }}
                    title={tool.label}
                    style={{ width: 32, height: 32, borderRadius: 8, background: isActive ? "var(--mf-green-dim)" : "var(--mf-bg-surface)", border: `1px solid ${isActive ? "var(--mf-green)50" : "var(--mf-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isActive ? "var(--mf-green)" : "var(--mf-text-muted)" }}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
            <div style={{ height: 18, width: 1, background: "var(--mf-border)" }} />
            {/* Brush size */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setBrushSize(s => Math.max(1, s - 2))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 14, fontWeight: 700 }}>−</button>
              <span style={{ fontSize: 12, color: "var(--mf-text-secondary)", minWidth: 28, textAlign: "center" }}>{brushSize}px</span>
              <button onClick={() => setBrushSize(s => Math.min(80, s + 2))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 14, fontWeight: 700 }}>+</button>
            </div>
            {/* Color swatches */}
            <div style={{ display: "flex", gap: 5 }}>
              {["#00F0FF", "#FF2A7A", "#39FF8A", "#FF8C42", "#FFFFFF", "#9B59B6", "#F1C40F"].map(c => (
                <button
                  key={c}
                  onClick={() => setActiveColor(c)}
                  style={{ width: 22, height: 22, borderRadius: 5, background: c, border: `2px solid ${activeColor === c ? "#fff" : "transparent"}`, cursor: "pointer", flexShrink: 0, boxShadow: activeColor === c ? `0 0 8px ${c}` : "none", transition: "all 0.12s" }}
                />
              ))}
            </div>
            {/* Zoom */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--mf-text-secondary)", minWidth: 44, textAlign: "center" }}>{zoom}%</span>
            </div>
          </div>

          {/* Drawing canvas */}
          <div style={{ flex: 1, background: "#0C0912", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
            {/* Checkerboard grid (shows through transparent erased areas) */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

            <canvas
              ref={canvasRef}
              width={600}
              height={750}
              style={{
                width: `${Math.min(600, 600 * zoom / 100)}px`,
                height: `${Math.min(750, 750 * zoom / 100)}px`,
                borderRadius: 4,
                border: "2px solid var(--mf-border-bright)",
                boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 20px rgba(0,240,255,0.08)",
                cursor: activeTool === "brush" ? "crosshair" : activeTool === "eraser" ? "cell" : "default",
                display: "block",
                position: "relative",
              }}
              onMouseDown={startDraw}
              onMouseMove={onDraw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />

            {/* HUD overlay */}
            <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
              <div style={{ padding: "4px 10px", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(0,240,255,0.3)", borderRadius: 6, fontSize: 10, color: "var(--mf-cyan)", fontWeight: 700, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mf-cyan)", boxShadow: "0 0 6px var(--mf-cyan)" }} />
                CANVAS ACTIVE · {activeTool.toUpperCase()}
              </div>
            </div>

            <div style={{ position: "absolute", bottom: 12, right: 14, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(0,0,0,0.7)", borderRadius: 8, border: "1px solid var(--mf-border)", backdropFilter: "blur(4px)" }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: activeColor, border: "1px solid rgba(255,255,255,0.3)", boxShadow: `0 0 6px ${activeColor}` }} />
              <span style={{ fontSize: 10, color: "var(--mf-text-secondary)", fontWeight: 700 }}>{activeColor}</span>
              <span style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>· {brushSize}px</span>
            </div>
          </div>
        </div>

        {/* Right: Layers panel */}
        <div style={{ width: 256, flexShrink: 0, borderLeft: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--mf-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={15} color="var(--mf-green)" />
              <span style={{ fontSize: 13, fontWeight: 800 }}>Layers</span>
              <button style={{ marginLeft: "auto", width: 24, height: 24, borderRadius: 6, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--mf-text-muted)" }}>
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            {[...layers].reverse().map(layer => (
              <div
                key={layer.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginBottom: 4,
                  background: layer.id === 2 ? "var(--mf-green-dim)" : "var(--mf-bg-surface)",
                  border: `1px solid ${layer.id === 2 ? "var(--mf-green)30" : "var(--mf-border)"}`,
                  borderRadius: 9, opacity: layer.visible ? 1 : 0.4, transition: "opacity 0.2s",
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{layer.name}</div>
                  <div style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>{layer.opacity}%</div>
                </div>
                <button onClick={() => toggleLayerVisibility(layer.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 2 }}>
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => toggleLayerLock(layer.id)} style={{ background: "none", border: "none", cursor: layer.locked ? "default" : "pointer", color: layer.locked ? "var(--mf-orange)" : "var(--mf-text-muted)", padding: 2 }}>
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            ))}
          </div>

          {/* Opacity slider */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--mf-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Layer Opacity</span>
              <span style={{ fontSize: 11, color: "var(--mf-text-secondary)", fontWeight: 700 }}>85%</span>
            </div>
            <input type="range" min={0} max={100} defaultValue={85} style={{ width: "100%", accentColor: "var(--mf-green)" }} />
          </div>

          {/* Submit button */}
          <div style={{ padding: "14px", borderTop: "1px solid var(--mf-border)" }}>
            {activeTask && submitted.has(activeTask.id) ? (
              <div style={{ padding: "12px", background: "var(--mf-green-dim)", border: "1px solid var(--mf-green)40", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={15} color="var(--mf-green)" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-green)" }}>Draft Submitted!</div>
                  <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 1 }}>Sent to Kishimoto-san</div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                style={{ width: "100%", padding: "12px", background: "var(--mf-green)", border: "none", borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.04em", boxShadow: "0 0 20px rgba(57,255,138,0.35)" }}
              >
                <Send size={14} /> SUBMIT PANEL DRAFT
              </button>
            )}
            <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--mf-bg-surface)", borderRadius: 8, display: "flex", alignItems: "center", gap: 7 }}>
              <AlertTriangle size={11} color="var(--mf-orange)" />
              <span style={{ fontSize: 10, color: "var(--mf-text-muted)", lineHeight: 1.4 }}>Submitting sends this draft directly to the Mangaka's workspace.</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
