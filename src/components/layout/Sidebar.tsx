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
      { icon: FileText, label: "Production Plan" },
    ],
    channels: [],
    dms: [],
  },
  board: {
    label: "Editorial Board Member", color: "var(--mf-orange)", icon: Users,
    nav: [
      { icon: Inbox, label: "Pending Approvals", path: "/board/voting" },
      { icon: Star, label: "Active Projects", path: "/board?tab=active-projects" },
      { icon: FileText, label: "Publishing Calendar", path: "/board?tab=publishing-calendar" },
      { icon: BarChart3, label: "Budget Overview", path: "/board?tab=budget-overview" },
    ],
    channels: ["editorial-strategy", "publishing-ops", "finance-review", "board-announcements"],
    dms: ["Chief Editor Yamamoto", "Legal: Sato-san", "Marketing Lead"],
  },
  mangaka: {
    label: "Mangaka", color: "var(--mf-magenta)", icon: PenTool,
    nav: [
      { icon: Layers, label: "My Projects" },
      { icon: AlertTriangle, label: "Deadlines", badgeColor: "var(--mf-orange)" },
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
  const [isCollapsed, setIsCollapsedState] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");

  const setIsCollapsed = (val: boolean) => {
    setIsCollapsedState(val);
    localStorage.setItem("sidebar_collapsed", String(val));
  };

  if (!config) return null;

  const RoleIcon = config.icon;

  const effectiveActive = activeNav ?? config.nav[0].label;

  function handleLogout() {
    logout();
    toast.success("Signed out successfully.");
    navigate("/", { replace: true });
  }

  // All nav items unified: Notifications + role-specific
  const allNavItems: (NavItem & { isQuickNav?: boolean })[] = [
    { icon: Bell, label: "Notifications", isQuickNav: true },
    ...config.nav,
  ];

  return (
    <div style={{
      width: isCollapsed ? 56 : 240,
      transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      overflowX: "hidden",
      flexShrink: 0,
      background: "var(--mf-sidebar)",
      borderRight: "1px solid var(--mf-border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      userSelect: "none",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: isCollapsed ? "16px 0 12px" : "16px 16px 12px",
        borderBottom: "1px solid var(--mf-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: isCollapsed ? "center" : "space-between",
        transition: "padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Logo + brand text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `linear-gradient(135deg, ${config.color}70, ${config.color}25)`,
            border: `1px solid ${config.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <BookOpen size={13} color={config.color} />
          </div>
          <div style={{
            overflow: "hidden",
            opacity: isCollapsed ? 0 : 1,
            maxWidth: isCollapsed ? 0 : 160,
            transition: "opacity 0.2s ease, max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            whiteSpace: "nowrap",
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--mf-text)" }}>MangaFlow</div>
            <div style={{ fontSize: 9, color: config.color, letterSpacing: "0.06em", fontWeight: 700, marginTop: -1 }}>{config.label.toUpperCase()}</div>
          </div>
        </div>

        {/* Collapse button (expanded only) */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--mf-text-muted)", padding: 4,
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--mf-text)"; e.currentTarget.style.background = "var(--mf-sidebar-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.background = "none"; }}
            title="Collapse sidebar"
          >
            <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>

        {/* Expand button (collapsed only — sits above nav icons) */}
        {isCollapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 6px" }}>
            <button
              onClick={() => setIsCollapsed(false)}
              style={{
                width: 32, height: 28,
                background: "none", border: "1px solid var(--mf-border)",
                borderRadius: 7, cursor: "pointer",
                color: "var(--mf-text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = config.color; e.currentTarget.style.borderColor = config.color; e.currentTarget.style.background = `${config.color}10`; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "var(--mf-border)"; e.currentTarget.style.background = "none"; }}
              title="Expand sidebar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Unified nav list */}
        <div style={{ padding: isCollapsed ? "0 8px" : "0 8px" }}>
          {allNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = !item.isQuickNav && effectiveActive === item.label;
            const badge = navBadges?.[item.label] ?? item.badge;
            const shouldShowBadge = typeof badge === "number" && badge > 0;

            return (
              <button
                key={item.label}
                onClick={() => item.path ? navigate(item.path) : onNavClick?.(item.label)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: isCollapsed ? "9px 0" : "7px 10px",
                  marginBottom: 1,
                  background: isActive ? `${config.color}10` : "transparent",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: isActive ? config.color : "var(--mf-text-secondary)",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  position: "relative",
                  boxSizing: "border-box",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--mf-sidebar-hover)"; e.currentTarget.style.color = "var(--mf-text)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--mf-text-secondary)"; } }}
              >
                <div style={{ width: 22, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span style={{
                  flex: isCollapsed ? 0 : 1,
                  opacity: isCollapsed ? 0 : 1,
                  maxWidth: isCollapsed ? 0 : 170,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.15s ease, max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}>
                  {item.label}
                </span>
                {shouldShowBadge && (
                  <span style={{
                    background: isActive ? config.color : (item.badgeColor || "var(--mf-bg-elevated)"),
                    color: isActive ? "#fff" : (item.badgeColor ? "#fff" : "var(--mf-text-muted)"),
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 100,
                    minWidth: 16,
                    textAlign: "center",
                    transition: "all 0.15s ease",
                    ...(isCollapsed ? { position: "absolute" as const, top: 2, right: 0, transform: "scale(0.75)" } : {}),
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── User footer ── */}
      <div style={{
        padding: isCollapsed ? "14px 0" : "12px 14px",
        borderTop: "none",
        display: "flex",
        alignItems: "center",
        gap: isCollapsed ? 8 : 10,
        flexDirection: isCollapsed ? "column" : "row",
        transition: "padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
      }}>
        {/* Accent top border */}
        <div style={{
          position: "absolute", top: 0, left: isCollapsed ? 12 : 14, right: isCollapsed ? 12 : 14,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${config.color}50, transparent)`,
          transition: "left 0.25s, right 0.25s",
        }} />

        {/* Avatar — only when expanded */}
        {!isCollapsed && (
          <div
            onClick={() => navigate("/profile")}
            title={accountName}
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: `linear-gradient(135deg, ${config.color}, ${config.color}60)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: `0 0 12px ${config.color}25`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = `0 0 18px ${config.color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 0 12px ${config.color}25`; }}
          >
            <User size={15} color="#fff" strokeWidth={2.2} />
          </div>
        )}

        {/* Name + role — only when expanded */}
        <div style={{
          flex: isCollapsed ? 0 : 1,
          overflow: "hidden",
          cursor: "pointer",
          opacity: isCollapsed ? 0 : 1,
          maxWidth: isCollapsed ? 0 : 170,
          transition: "opacity 0.15s ease, max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          whiteSpace: "nowrap",
          display: isCollapsed ? "none" : "block",
        }} onClick={() => navigate("/profile")}>
          <div style={{
            fontSize: 12, fontWeight: 700,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            color: "var(--mf-text)", transition: "color 0.15s",
            letterSpacing: "-0.01em",
          }}
            onMouseEnter={e => e.currentTarget.style.color = config.color}
            onMouseLeave={e => e.currentTarget.style.color = "var(--mf-text)"}
          >
            {accountName}
          </div>
          <div style={{ fontSize: 9, color: config.color, fontWeight: 700, letterSpacing: "0.05em" }}>{config.label.toUpperCase()}</div>
        </div>

        {/* Logout button — always visible */}
        <button
          title="Sign out"
          onClick={handleLogout}
          style={{
            background: "none", border: `1px solid transparent`,
            cursor: "pointer",
            color: "var(--mf-text-muted)", padding: "5px 7px",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
            marginLeft: isCollapsed ? 0 : "auto",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ff4d6d"; e.currentTarget.style.background = "#ff4d6d10"; e.currentTarget.style.borderColor = "#ff4d6d30"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

