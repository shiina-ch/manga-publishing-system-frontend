import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Layers, X, ChevronRight, BookOpen, Edit3, Users, PenTool, Brush, Vote, LogIn, UserPlus, Shield } from "lucide-react";

const screens = [
  { path: "/", label: "Login", role: "Auth — Screen 1", icon: LogIn, color: "var(--mf-magenta)" },
  { path: "/register", label: "Register", role: "Auth — Screen 2", icon: UserPlus, color: "var(--mf-magenta)" },
  { path: "/editor", label: "Editor Review Dashboard", role: "Editor — Screen 3", icon: Edit3, color: "var(--mf-cyan)" },
  { path: "/board", label: "Board Approval & Planning", role: "Board Member — Screen 4", icon: Users, color: "var(--mf-orange)" },
  { path: "/mangaka", label: "Mangaka Studio Workspace", role: "Mangaka — Screen 5", icon: PenTool, color: "var(--mf-magenta)" },
  { path: "/assistant", label: "Assistant Canvas Portal", role: "Assistant — Screen 6", icon: Brush, color: "var(--mf-green)" },
  { path: "/board/voting", label: "Board Publishing & Voting", role: "Board Member — Screen 7", icon: Vote, color: "var(--mf-orange)" },
  { path: "/admin", label: "Admin Dashboard", role: "Admin — Screen 8", icon: Shield, color: "var(--mf-cyan)" },
];

export function DemoNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: "linear-gradient(135deg, var(--mf-magenta), var(--mf-cyan))",
          border: "none",
          borderRadius: 12,
          padding: "10px 18px",
          cursor: "pointer",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 0 28px var(--mf-magenta-glow), 0 6px 20px rgba(0,0,0,0.6)",
        }}
      >
        <Layers size={15} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em" }}>ALL SCREENS</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(18,18,20,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 20, padding: 28, width: 440, maxWidth: "90vw", boxShadow: "0 0 60px rgba(255,42,122,0.12), 0 32px 64px rgba(0,0,0,0.8)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BookOpen size={18} color="var(--mf-magenta)" />
                  <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em" }}>MangaFlow</span>
                </div>
                <p style={{ color: "var(--mf-text-muted)", fontSize: 11, marginTop: 3, letterSpacing: "0.04em" }}>DEMO SCREEN NAVIGATOR</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "var(--mf-bg-elevated)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--mf-text-secondary)" }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {screens.map((s) => {
                const Icon = s.icon;
                const active = location.pathname === s.path;
                return (
                  <button
                    key={s.path}
                    onClick={() => { navigate(s.path); setOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: active ? "var(--mf-bg-elevated)" : "transparent", border: active ? `1px solid ${s.color}35` : "1px solid transparent", borderRadius: 10, cursor: "pointer", color: "var(--mf-text)", textAlign: "left", transition: "all 0.12s" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${s.color}30` }}>
                      <Icon size={15} color={s.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: s.color, marginTop: 1, fontWeight: 700, letterSpacing: "0.05em" }}>{s.role.toUpperCase()}</div>
                    </div>
                    <ChevronRight size={13} color="var(--mf-text-muted)" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
