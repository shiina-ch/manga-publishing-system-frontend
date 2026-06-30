import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  BookOpen, Hash, Bell, ChevronDown, ChevronRight,
  Plus, Edit3, Users, PenTool, Brush, Home, Search,
  FileText, Clock, AlertTriangle, CheckCircle, BarChart3, Layers, Star,
  Inbox, Shield, Activity, UserPlus, Eye, User, LogOut
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logout } from "../../services/adminApi";
import { tokenStorage } from "../../storage/tokenStorage";
import { getPrimaryRole } from "../../auth/roleRouting";
import type { ActiveRole } from "../../types/account";

type LayoutRole = "editor" | "board" | "mangaka" | "assistant" | "admin" | "manager";

interface NavItem {
  icon: LucideIcon;
  label: string;
  badge?: number;
  badgeColor?: string;
  path?: string;
}

interface RoleConfig {
  label: string;
  color: string;
  icon: LucideIcon;
  nav: NavItem[];
  channels: string[];
  dms: string[];
}

const activeRoleToLayoutRole: Record<ActiveRole, LayoutRole> = {
  ADMIN: "admin",
  MANAGER: "manager",
  TANTOU_EDITOR: "editor",
  EDITORIAL_BOARD_MEMBER: "board",
  MANGAKA: "mangaka",
  ASSISTANT: "assistant",
};

const roleConfig: Record<LayoutRole, RoleConfig> = {
  editor: {
    label: "Tantou Editor", color: "var(--mf-cyan)", icon: Edit3,
    nav: [
      { icon: Inbox, label: "New Proposals" },
      { icon: Clock, label: "In Revision" },
      { icon: AlertTriangle, label: "Escalated to Board", badgeColor: "var(--mf-orange)" },
      { icon: CheckCircle, label: "Approved" },
      { icon: FileText, label: "Mangaka Submissions" },
    ],
    channels: [],
    dms: [],
  },
  board: {
    label: "Editorial Board Member", color: "var(--mf-orange)", icon: Users,
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
    label: "Mangaka", color: "var(--mf-magenta)", icon: PenTool,
    nav: [
      { icon: Layers, label: "My Projects", badge: 3 },
      { icon: AlertTriangle, label: "Deadlines", badge: 2, badgeColor: "var(--mf-orange)" },
      { icon: FileText, label: "Script Drafts" },
      { icon: CheckCircle, label: "Submissions" },
    ],
    channels: ["naruto-ch-101", "team-chat", "assistant-coloring", "background-art"],
    dms: ["Editor: Yamada-san", "Assistant Aiko", "Assistant Kenji"],
  },
  assistant: {
    label: "Assistant", color: "var(--mf-green)", icon: Brush,
    nav: [
      { icon: Inbox, label: "My Assignments", badge: 4 },
      { icon: Clock, label: "In Progress", badge: 2 },
      { icon: CheckCircle, label: "Submitted" },
    ],
    channels: ["assistant-coloring", "background-art", "team-updates"],
    dms: ["Mangaka: Kishimoto-san", "Lead Aiko"],
  },
  admin: {
    label: "Admin", color: "var(--mf-cyan)", icon: Shield,
    nav: [
      { icon: Activity, label: "System Overview", path: "/admin?tab=overview" },
      { icon: UserPlus, label: "Account Requests", path: "/account-requests", badgeColor: "var(--mf-orange)" },
      { icon: Eye, label: "Chapter Monitor", path: "/admin?tab=chapters" },
      { icon: Users, label: "User Management", path: "/admin?tab=users" },
    ],
    channels: ["system-alerts", "admin-logs", "moderation", "announcements"],
    dms: ["Chief Editor Yamamoto", "Director Tanaka", "Support Team"],
  },
  manager: {
    label: "Manager", color: "var(--mf-orange)", icon: Shield,
    nav: [
      { icon: UserPlus, label: "Account Requests", path: "/account-requests" },
    ],
    channels: [],
    dms: [],
  },
};

interface SidebarProps {
  activeNav?: string;
  onNavClick?: (label: string) => void;

  navBadges?: Record<string, number>;
}

export function Sidebar({ activeNav, onNavClick, navBadges }: SidebarProps) {
  const activeRole = getPrimaryRole(tokenStorage.getRoles());
  const config = activeRole ? roleConfig[activeRoleToLayoutRole[activeRole]] : null;
  const account = tokenStorage.getAccount();
  const accountName = account ? (`${account.firstName} ${account.lastName}`.trim() || account.email) : "Current User";
  const navigate = useNavigate();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  if (!config) return null;

  const RoleIcon = config.icon;

  const effectiveActive = activeNav ?? config.nav[0].label;

  function handleLogout() {
    logout();
    toast.success("Signed out successfully.");
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
      </div>


      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Quick nav */}
        <div style={{ padding: "0 10px 6px" }}>
          {[{ icon: Bell, label: "Notifications" }].map((item) => {
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
            const badge = navBadges?.[item.label] ?? item.badge;
            const shouldShowBadge = typeof badge === "number" && badge > 0;
            return (
              <button
                key={item.label}
                onClick={() => item.path ? navigate(item.path) : onNavClick?.(item.label)}
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
                {shouldShowBadge && (
                  <span style={{
                    background: isActive ? config.color : (item.badgeColor || "var(--mf-bg-elevated)"),
                    color: isActive ? "#fff" : (item.badgeColor ? "#fff" : "var(--mf-text-muted)"),
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 100,
                    minWidth: 18,
                    textAlign: "center",
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>


      </div>

      {/* User footer */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${config.color}, ${config.color}50)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <RoleIcon size={15} color="#fff" />
        </div>
        <div style={{ flex: 1, overflow: "hidden", cursor: "pointer" }} onClick={() => navigate("/profile")}>
          <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--mf-text)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--mf-cyan)"} onMouseLeave={e => e.currentTarget.style.color = "var(--mf-text)"}>{accountName}</div>
          <div style={{ fontSize: 10, color: config.color, fontWeight: 700 }}>{config.label}</div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 4, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--mf-cyan)"} onMouseLeave={e => e.currentTarget.style.color = "var(--mf-text-muted)"} onClick={() => navigate("/profile")}>
          <User size={14} />
        </button>
        <button
          title="Sign out"
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

