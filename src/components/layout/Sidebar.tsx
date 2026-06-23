import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  BookOpen, Hash, Settings, Bell, ChevronDown, ChevronRight,
  Plus, Edit3, Users, PenTool, Brush, Home, Search,
  FileText, Clock, AlertTriangle, CheckCircle, BarChart3, Layers, Star,
  Inbox, Shield, Activity, UserPlus, Eye, User, LogOut
} from "lucide-react";
import { logout } from "../../services/adminApi";

type Role = "editor" | "board" | "mangaka" | "assistant" | "admin";

const roleConfig = {
  editor: {
    label: "Editor", color: "var(--mf-cyan)", icon: Edit3, user: "Kenji Yamada",
    nav: [
      { icon: Inbox, label: "New Proposals", badge: 8 },
      { icon: Clock, label: "In Revision", badge: 3 },
      { icon: AlertTriangle, label: "Escalated to Board", badge: 2, badgeColor: "var(--mf-orange)" },
      { icon: CheckCircle, label: "Approved" },
    ],
    channels: ["one-piece-ch-1120", "blue-lock-ch-290", "spy-family-ch-97", "jjk-ch-265"],
    dms: ["Mangaka: Oda-san", "Board Chief Tanaka", "Art Team Lead"],
  },
  board: {
    label: "Board Member", color: "var(--mf-orange)", icon: Users, user: "Director Tanaka",
    nav: [
      { icon: Inbox, label: "Pending Approvals", badge: 5 },
      { icon: Star, label: "Active Projects", badge: 12 },
      { icon: FileText, label: "Publishing Calendar" },
      { icon: BarChart3, label: "Budget Overview" },
    ],
    channels: ["editorial-strategy", "publishing-ops", "finance-review", "board-announcements"],
    dms: ["Chief Editor Yamamoto", "Legal: Sato-san", "Marketing Lead"],
  },
  mangaka: {
    label: "Mangaka", color: "var(--mf-magenta)", icon: PenTool, user: "Masashi Kishimoto",
    nav: [
      { icon: Layers, label: "My Projects", badge: 3 },
      { icon: AlertTriangle, label: "Deadlines", badge: 2, badgeColor: "var(--mf-orange)" },
      { icon: FileText, label: "Script Drafts" },
      { icon: CheckCircle, label: "Submitted" },
    ],
    channels: ["naruto-ch-101", "team-chat", "assistant-coloring", "background-art"],
    dms: ["Editor: Yamada-san", "Assistant Aiko", "Assistant Kenji"],
  },
  assistant: {
    label: "Assistant", color: "var(--mf-green)", icon: Brush, user: "Kenji Mori",
    nav: [
      { icon: Inbox, label: "My Assignments", badge: 4 },
      { icon: Clock, label: "In Progress", badge: 2 },
      { icon: CheckCircle, label: "Submitted" },
    ],
    channels: ["assistant-coloring", "background-art", "team-updates"],
    dms: ["Mangaka: Kishimoto-san", "Lead Aiko"],
  },
  admin: {
    label: "Admin", color: "var(--mf-cyan)", icon: Shield, user: "System Admin",
    nav: [
      { icon: Activity, label: "System Overview" },
      { icon: UserPlus, label: "Registration Requests", badge: 4, badgeColor: "var(--mf-orange)" },
      { icon: Eye, label: "Chapter Monitor" },
      { icon: Users, label: "User Management" },
    ],
    channels: ["system-alerts", "admin-logs", "moderation", "announcements"],
    dms: ["Chief Editor Yamamoto", "Director Tanaka", "Support Team"],
  },
};

interface SidebarProps {
  role: Role;
  activeNav?: string;
  onNavClick?: (label: string) => void;
}

export function Sidebar({ role, activeNav, onNavClick }: SidebarProps) {
  const config = roleConfig[role];
  const RoleIcon = config.icon;
  const navigate = useNavigate();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  const effectiveActive = activeNav ?? config.nav[0].label;

  function handleLogout() {
    logout();
    toast.success("Đăng xuất thành công");
    navigate("/", { replace: true });
  }

  return (
    <div style={{ width: 240, flexShrink: 0, background: "var(--mf-sidebar)", borderRight: "1px solid var(--mf-border)", display: "flex", flexDirection: "column", height: "100%", userSelect: "none" }}>
      {/* Workspace header */}
      <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--mf-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${config.color}70, ${config.color}25)`, border: `1px solid ${config.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BookOpen size={14} color={config.color} />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--mf-text)" }}>MangaFlow</div>
            <div style={{ fontSize: 9, color: config.color, letterSpacing: "0.07em", fontWeight: 800 }}>{config.label.toUpperCase()}</div>
          </div>
          <ChevronDown size={12} color="var(--mf-text-muted)" />
        </div>
        <div style={{ fontSize: 11, color: "var(--mf-text-muted)", padding: "6px 10px", background: "var(--mf-bg-surface)", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Search size={11} /><span>Search...</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Quick nav */}
        <div style={{ padding: "0 10px 6px" }}>
          {[{ icon: Home, label: "Home" }, { icon: Bell, label: "Notifications" }].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: 7, cursor: "pointer", color: "var(--mf-text-secondary)", fontSize: 13, textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--mf-sidebar-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Icon size={14} /><span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: "var(--mf-border)", margin: "4px 10px 6px" }} />

        {/* Role-specific nav */}
        <div style={{ padding: "0 10px 6px" }}>
          {config.nav.map((item) => {
            const Icon = item.icon;
            const isActive = effectiveActive === item.label;
            return (
              <button
                key={item.label}
                onClick={() => onNavClick?.(item.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%",
                  padding: "8px 10px",
                  background: isActive ? `${config.color}12` : "transparent",
                  border: "none",
                  borderLeft: isActive ? `2px solid ${config.color}` : "2px solid transparent",
                  borderRadius: "0 7px 7px 0",
                  cursor: "pointer",
                  color: isActive ? config.color : "var(--mf-text-secondary)",
                  fontSize: 13, fontWeight: isActive ? 700 : 400,
                  textAlign: "left",
                  marginLeft: -10, paddingLeft: 18,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--mf-sidebar-hover)"; e.currentTarget.style.color = "var(--mf-text)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mf-text-secondary)"; } }}
              >
                <Icon size={13} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {(item as any).badge && (
                  <span style={{
                    background: isActive ? config.color : ((item as any).badgeColor || "var(--mf-bg-elevated)"),
                    color: isActive ? "#fff" : ((item as any).badgeColor ? "#fff" : "var(--mf-text-muted)"),
                    fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 100, minWidth: 18, textAlign: "center",
                  }}>{(item as any).badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: "var(--mf-border)", margin: "4px 10px 8px" }} />

        {/* Channels */}
        <div style={{ padding: "0 10px" }}>
          <button onClick={() => setChannelsOpen(!channelsOpen)} style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", padding: "3px 6px", marginBottom: 3 }}>
            {channelsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            CHANNELS
            <div style={{ marginLeft: "auto", width: 16, height: 16, borderRadius: 4, background: "var(--mf-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={9} color="var(--mf-text-muted)" />
            </div>
          </button>
          {channelsOpen && config.channels.map((ch) => (
            <button key={ch} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "5px 8px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 12, textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-sidebar-hover)"; e.currentTarget.style.color = "var(--mf-text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mf-text-muted)"; }}
            >
              <Hash size={12} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch}</span>
            </button>
          ))}
        </div>

        {/* DMs */}
        <div style={{ padding: "8px 10px 0" }}>
          <button onClick={() => setDmsOpen(!dmsOpen)} style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", padding: "3px 6px", marginBottom: 3 }}>
            {dmsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            DIRECT MESSAGES
          </button>
          {dmsOpen && config.dms.map((dm) => (
            <button key={dm} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "5px 8px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 12, textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--mf-sidebar-hover)"; e.currentTarget.style.color = "var(--mf-text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mf-text-muted)"; }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--mf-green)", flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dm}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User footer */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${config.color}, ${config.color}50)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <RoleIcon size={15} color="#fff" />
        </div>
        <div style={{ flex: 1, overflow: "hidden", cursor: "pointer" }} onClick={() => navigate("/profile")}>
          <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--mf-text)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--mf-cyan)"} onMouseLeave={e => e.currentTarget.style.color = "var(--mf-text)"}>{config.user}</div>
          <div style={{ fontSize: 10, color: config.color, fontWeight: 700 }}>{config.label}</div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 4, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--mf-cyan)"} onMouseLeave={e => e.currentTarget.style.color = "var(--mf-text-muted)"} onClick={() => navigate("/profile")}>
          <User size={14} />
        </button>
        <button
          title="Đăng xuất"
          onClick={handleLogout}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 4, transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ff4d6d")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--mf-text-muted)")}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

