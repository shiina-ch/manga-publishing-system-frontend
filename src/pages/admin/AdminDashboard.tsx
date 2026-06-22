import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  Users, BookOpen, Clock, CheckCircle, AlertTriangle, XCircle,
  Eye, RefreshCw, UserPlus, FileText, Mail, Phone, MapPin,
  Shield, Activity, TrendingUp, Wifi, WifiOff, MoreHorizontal,
  ChevronRight, Search, Filter, Download, Inbox, ChevronDown,
  BarChart3, Zap, Globe, PenTool, Layers, Edit3, ArrowUpRight,
  Info,
} from "lucide-react";
import { getAllAccounts, approveAccount, type AdminAccount } from "../../services/adminApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnlineUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: "online" | "idle" | "busy" | "offline";
  lastActive: string;
  currentPage: string;
  joinedAt: string;
}

interface ChapterStatus {
  id: number;
  manga: string;
  chapter: number;
  title: string;
  status: "draft" | "in_review" | "approved" | "published" | "rejected";
  author: string;
  updatedAt: string;
  progress: number;
  pages: number;
  mangaColor: string;
}

interface RegistrationRequest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  cvFileName: string;
  cvSize: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  avatar: string;
  status: "online" | "idle" | "busy" | "offline";
  lastActive: string;
  joinedAt: string;
  source: "existing" | "approved";
}

interface ActivityEvent {
  id: number;
  type: "chapter_published" | "user_approved" | "registration" | "chapter_submitted" | "role_assigned" | "chapter_rejected";
  message: string;
  timestamp: string;
  color: string;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const initialOnlineUsers: OnlineUser[] = [
  { id: 1, name: "Kenji Yamada", email: "kenji.y@mangaflow.io", role: "Editor", avatar: "KY", status: "online", lastActive: "Now", currentPage: "Editor Dashboard", joinedAt: "Jan 2024" },
  { id: 2, name: "Director Tanaka", email: "d.tanaka@mangaflow.io", role: "Board Member", avatar: "DT", status: "online", lastActive: "Now", currentPage: "Board Approval", joinedAt: "Dec 2023" },
  { id: 3, name: "Masashi Kishimoto", email: "m.kishi@mangaflow.io", role: "Mangaka", avatar: "MK", status: "busy", lastActive: "2m ago", currentPage: "Mangaka Studio", joinedAt: "Feb 2024" },
  { id: 4, name: "Kenji Mori", email: "k.mori@mangaflow.io", role: "Assistant", avatar: "KM", status: "online", lastActive: "Now", currentPage: "Assistant Portal", joinedAt: "Mar 2024" },
  { id: 5, name: "Yuki Tanaka", email: "y.tanaka@mangaflow.io", role: "Mangaka", avatar: "YT", status: "idle", lastActive: "8m ago", currentPage: "Script Drafts", joinedAt: "Jan 2024" },
  { id: 6, name: "Aiko Suzuki", email: "a.suzuki@mangaflow.io", role: "Assistant", avatar: "AS", status: "online", lastActive: "Now", currentPage: "Coloring Tasks", joinedAt: "Apr 2024" },
  { id: 7, name: "Ryu Akimoto", email: "r.akimoto@mangaflow.io", role: "Mangaka", avatar: "RA", status: "online", lastActive: "1m ago", currentPage: "Chapter Upload", joinedAt: "Feb 2024" },
  { id: 8, name: "Sato Hiroshi", email: "s.hiroshi@mangaflow.io", role: "Board Member", avatar: "SH", status: "idle", lastActive: "15m ago", currentPage: "Voting Room", joinedAt: "Dec 2023" },
  { id: 9, name: "Hana Mori", email: "h.mori@mangaflow.io", role: "Mangaka", avatar: "HM", status: "online", lastActive: "Now", currentPage: "Concept Upload", joinedAt: "Mar 2024" },
  { id: 10, name: "Rei Fujimoto", email: "r.fuji@mangaflow.io", role: "Editor", avatar: "RF", status: "busy", lastActive: "3m ago", currentPage: "Review Queue", joinedAt: "Jan 2024" },
  { id: 11, name: "Nao Kimura", email: "n.kimura@mangaflow.io", role: "Mangaka", avatar: "NK", status: "online", lastActive: "Now", currentPage: "Deadlines", joinedAt: "May 2024" },
  { id: 12, name: "Daichi Ito", email: "d.ito@mangaflow.io", role: "Assistant", avatar: "DI", status: "online", lastActive: "Now", currentPage: "Background Art", joinedAt: "Apr 2024" },
];

const initialChapters: ChapterStatus[] = [
  { id: 1, manga: "Neon Samurai", chapter: 1, title: "The Last Blade Awakens", status: "published", author: "Ryu Akimoto", updatedAt: "2m ago", progress: 100, pages: 24, mangaColor: "#FF2A7A" },
  { id: 2, manga: "Neon Samurai", chapter: 2, title: "Digital Ronin", status: "approved", author: "Ryu Akimoto", updatedAt: "15m ago", progress: 100, pages: 22, mangaColor: "#FF2A7A" },
  { id: 3, manga: "Neon Samurai", chapter: 3, title: "Code of the Katana", status: "in_review", author: "Ryu Akimoto", updatedAt: "1h ago", progress: 78, pages: 20, mangaColor: "#FF2A7A" },
  { id: 4, manga: "Bloom Protocol", chapter: 1, title: "First Bloom", status: "published", author: "Yuki Tanaka", updatedAt: "3d ago", progress: 100, pages: 26, mangaColor: "#39FF8A" },
  { id: 5, manga: "Bloom Protocol", chapter: 2, title: "Synthetic Heart", status: "in_review", author: "Yuki Tanaka", updatedAt: "30m ago", progress: 65, pages: 18, mangaColor: "#39FF8A" },
  { id: 6, manga: "Ghost Meridian", chapter: 1, title: "48 Hours", status: "approved", author: "Sora Hayashi", updatedAt: "2h ago", progress: 100, pages: 28, mangaColor: "#00F0FF" },
  { id: 7, manga: "Ghost Meridian", chapter: 2, title: "Soul Fragments", status: "draft", author: "Sora Hayashi", updatedAt: "5m ago", progress: 42, pages: 16, mangaColor: "#00F0FF" },
  { id: 8, manga: "Iron Lotus", chapter: 1, title: "Silent Rhythm", status: "in_review", author: "Hana Mori", updatedAt: "45m ago", progress: 88, pages: 22, mangaColor: "#FF8C42" },
  { id: 9, manga: "Iron Lotus", chapter: 2, title: "The Floor Speaks", status: "draft", author: "Hana Mori", updatedAt: "10m ago", progress: 30, pages: 14, mangaColor: "#FF8C42" },
  { id: 10, manga: "Void Chronicle", chapter: 1, title: "The Last Astronaut", status: "published", author: "Daichi Ito", updatedAt: "1w ago", progress: 100, pages: 30, mangaColor: "#A855F7" },
  { id: 11, manga: "Void Chronicle", chapter: 2, title: "Thinking Stars", status: "rejected", author: "Daichi Ito", updatedAt: "3h ago", progress: 100, pages: 24, mangaColor: "#A855F7" },
  { id: 12, manga: "Summer Oni", chapter: 1, title: "Grandma's Secret", status: "published", author: "Rei Fujimoto", updatedAt: "5d ago", progress: 100, pages: 20, mangaColor: "#F472B6" },
  { id: 13, manga: "Summer Oni", chapter: 2, title: "Modern Spirits", status: "approved", author: "Rei Fujimoto", updatedAt: "1d ago", progress: 100, pages: 22, mangaColor: "#F472B6" },
  { id: 14, manga: "Circuit Dancer", chapter: 1, title: "Underground Frequency", status: "draft", author: "Nao Kimura", updatedAt: "20m ago", progress: 55, pages: 18, mangaColor: "#FACC15" },
  { id: 15, manga: "Circuit Dancer", chapter: 2, title: "Reality Remix", status: "draft", author: "Nao Kimura", updatedAt: "Just now", progress: 12, pages: 8, mangaColor: "#FACC15" },
];

const initialRegistrations: RegistrationRequest[] = [
  { id: 1, firstName: "Takeshi", lastName: "Obata", email: "t.obata@mangaflow.io", phone: "+81 90-1234-5678", role: "mangaka", address: "567 Art Lane, Shibuya, Tokyo 150-0002", cvFileName: "obata_portfolio.pdf", cvSize: "2.4 MB", submittedAt: "10 minutes ago", status: "pending" },
  { id: 2, firstName: "Misa", lastName: "Hayakawa", email: "misa.h@mangaflow.io", phone: "+81 80-9876-5432", role: "assistant", address: "12-5 Manga District, Nakano, Tokyo 164-0001", cvFileName: "hayakawa_cv.pdf", cvSize: "1.1 MB", submittedAt: "32 minutes ago", status: "pending" },
  { id: 3, firstName: "Ryota", lastName: "Ishikawa", email: "r.ishikawa@mangaflow.io", phone: "+81 70-5555-1234", role: "tantor_editor", address: "888 Publishing Blvd, Chiyoda, Tokyo 100-0001", cvFileName: "ishikawa_resume.docx", cvSize: "890 KB", submittedAt: "1 hour ago", status: "pending" },
  { id: 4, firstName: "Yuna", lastName: "Watanabe", email: "yuna.w@mangaflow.io", phone: "+81 90-6789-0123", role: "mangaka", address: "34 Creative St, Nerima, Tokyo 176-0001", cvFileName: "watanabe_portfolio.pdf", cvSize: "4.7 MB", submittedAt: "2 hours ago", status: "pending" },
  { id: 5, firstName: "Kaito", lastName: "Morimoto", email: "k.morimoto@mangaflow.io", phone: "+81 80-1111-2222", role: "assistant", address: "55-3 Color Ave, Toshima, Tokyo 171-0022", cvFileName: "morimoto_cv.pdf", cvSize: "1.5 MB", submittedAt: "3 hours ago", status: "pending" },
  { id: 6, firstName: "Sakura", lastName: "Nakajima", email: "s.nakajima@mangaflow.io", phone: "+81 70-3333-4444", role: "mangaka", address: "78 Ink Road, Bunkyo, Tokyo 112-0001", cvFileName: "nakajima_work.pdf", cvSize: "3.2 MB", submittedAt: "5 hours ago", status: "approved" },
  { id: 7, firstName: "Hiroto", lastName: "Kato", email: "h.kato@mangaflow.io", phone: "+81 90-7777-8888", role: "tantor_editor", address: "22 Editor Plaza, Minato, Tokyo 105-0001", cvFileName: "kato_resume.pdf", cvSize: "720 KB", submittedAt: "1 day ago", status: "rejected" },
];

const initialActivities: ActivityEvent[] = [
  { id: 1, type: "chapter_published", message: "Neon Samurai Ch.1 was published", timestamp: "2 min ago", color: "var(--mf-green)" },
  { id: 2, type: "user_approved", message: "Sakura Nakajima registration approved", timestamp: "15 min ago", color: "var(--mf-cyan)" },
  { id: 3, type: "chapter_submitted", message: "Iron Lotus Ch.1 submitted for review", timestamp: "45 min ago", color: "var(--mf-orange)" },
  { id: 4, type: "registration", message: "New registration: Takeshi Obata", timestamp: "1h ago", color: "var(--mf-magenta)" },
  { id: 5, type: "chapter_rejected", message: "Void Chronicle Ch.2 was rejected", timestamp: "3h ago", color: "var(--mf-magenta)" },
  { id: 6, type: "role_assigned", message: "Kenji Mori assigned role: Assistant", timestamp: "5h ago", color: "var(--mf-cyan)" },
  { id: 7, type: "chapter_published", message: "Bloom Protocol Ch.1 was published", timestamp: "3d ago", color: "var(--mf-green)" },
  { id: 8, type: "user_approved", message: "Daichi Ito registration approved", timestamp: "4d ago", color: "var(--mf-cyan)" },
];

// ─── Shared Sub-Components ────────────────────────────────────────────────────

const statusChapterConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "var(--mf-text-muted)", bg: "var(--mf-bg-elevated)" },
  in_review: { label: "In Review", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
  approved: { label: "Approved", color: "var(--mf-cyan)", bg: "var(--mf-cyan-dim)" },
  published: { label: "Published", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
  rejected: { label: "Rejected", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
};

const roleLabel: Record<string, string> = {
  assistant: "Assistant",
  mangaka: "Mangaka",
  tantor_editor: "Tantor Editor",
  Editor: "Editor",
  "Board Member": "Board Member",
  Mangaka: "Mangaka",
  Assistant: "Assistant",
  Unassigned: "Unassigned",
};

const roleColor: Record<string, string> = {
  Editor: "var(--mf-cyan)",
  "Board Member": "var(--mf-orange)",
  Mangaka: "var(--mf-magenta)",
  Assistant: "var(--mf-green)",
  Unassigned: "var(--mf-text-muted)",
  assistant: "var(--mf-green)",
  mangaka: "var(--mf-magenta)",
  tantor_editor: "var(--mf-cyan)",
};

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: "3px 10px", background: bg, color, fontSize: 10, fontWeight: 800,
      borderRadius: 100, letterSpacing: "0.06em", border: `1px solid ${color}35`, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function ChapterStatusBadge({ status }: { status: string }) {
  const s = statusChapterConfig[status] || statusChapterConfig.draft;
  return <StatusBadge label={s.label} color={s.color} bg={s.bg} />;
}

function RegistrationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pending", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
    approved: { label: "Approved", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
    rejected: { label: "Rejected", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
  };
  const s = config[status] || config.pending;
  return <StatusBadge label={s.label} color={s.color} bg={s.bg} />;
}

function StatCard({ icon: Icon, label, value, color, trend, subtitle }: {
  icon: any; label: string; value: string | number; color: string; trend?: string; subtitle?: string;
}) {
  return (
    <div style={{
      padding: "20px 22px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
      borderRadius: 16, flex: 1, minWidth: 180, transition: "all 0.25s", position: "relative", overflow: "hidden",
    }}>
      {/* Subtle gradient accent */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 16px 0 80px",
        background: `${color}08`, pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={color} />
        </div>
        {trend && (
          <div style={{
            display: "flex", alignItems: "center", gap: 3, fontSize: 11,
            color: trend.startsWith("-") ? "var(--mf-magenta)" : "var(--mf-green)", fontWeight: 700,
            padding: "3px 8px", background: trend.startsWith("-") ? "var(--mf-magenta-dim)" : "var(--mf-green-dim)",
            borderRadius: 6,
          }}>
            <TrendingUp size={11} /> {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "var(--mf-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 3, opacity: 0.7 }}>{subtitle}</div>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, rightContent }: { title: string; subtitle?: string; rightContent?: React.ReactNode }) {
  return (
    <div style={{
      padding: "16px 20px 14px", borderBottom: "1px solid var(--mf-border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: "var(--mf-text)" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 2, margin: 0 }}>{subtitle}</p>}
      </div>
      {rightContent}
    </div>
  );
}

// Table header row for consistent dark-header tables (Material Dashboard style)
function TableHeader({ columns }: { columns: { label: string; width?: string | number; align?: string }[] }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "12px 20px",
      background: "var(--mf-bg-elevated)", borderBottom: "1px solid var(--mf-border)",
      borderRadius: "14px 14px 0 0",
    }}>
      {columns.map((col, i) => (
        <div key={i} style={{
          flex: col.width ? `0 0 ${col.width}` : 1,
          fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)",
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          textAlign: (col.align as any) || "left",
        }}>
          {col.label}
        </div>
      ))}
    </div>
  );
}

// ─── Tab 1: System Overview ──────────────────────────────────────────────────

function OverviewTab({ onlineUsers, chapters, registrations, activities }: {
  onlineUsers: OnlineUser[]; chapters: ChapterStatus[]; registrations: AdminAccount[]; activities: ActivityEvent[];
}) {
  const totalOnline = onlineUsers.filter(u => u.status === "online").length;
  const publishedCount = chapters.filter(c => c.status === "published").length;
  const pendingRegs = registrations.filter(r => r.status === "PENDING").length;
  const inReviewCount = chapters.filter(c => c.status === "in_review").length;

  // Pipeline counts
  const pipeline = {
    draft: chapters.filter(c => c.status === "draft").length,
    in_review: chapters.filter(c => c.status === "in_review").length,
    approved: chapters.filter(c => c.status === "approved").length,
    published: chapters.filter(c => c.status === "published").length,
    rejected: chapters.filter(c => c.status === "rejected").length,
  };
  const totalChapters = chapters.length;

  const statusDotColor: Record<string, string> = {
    online: "var(--mf-green)", idle: "var(--mf-orange)", busy: "var(--mf-magenta)", offline: "var(--mf-text-muted)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard icon={Users} label="Total Users" value={onlineUsers.length} color="var(--mf-cyan)" trend="+3 this week" />
        <StatCard icon={BookOpen} label="Total Chapters" value={chapters.length} color="var(--mf-magenta)" trend="+5" />
        <StatCard icon={UserPlus} label="Pending Registrations" value={pendingRegs} color="var(--mf-orange)" />
        <StatCard icon={CheckCircle} label="Published Chapters" value={publishedCount} color="var(--mf-green)" trend="+2" />
      </div>

      {/* Two-column: Activity Timeline + Chapter Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Activity Timeline */}
        <div style={{
          background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
          borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <SectionHeader title="Recent Activity" subtitle="System events timeline" />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {activities.map((activity, idx) => (
              <div key={activity.id} style={{
                display: "flex", gap: 14, paddingBottom: idx < activities.length - 1 ? 18 : 0,
                position: "relative",
              }}>
                {/* Timeline line */}
                {idx < activities.length - 1 && (
                  <div style={{
                    position: "absolute", left: 7, top: 18, bottom: 0, width: 1,
                    background: "var(--mf-border)",
                  }} />
                )}
                {/* Dot */}
                <div style={{
                  width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                  background: `${activity.color}20`, border: `2px solid ${activity.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: activity.color }} />
                </div>
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--mf-text)", fontWeight: 600, lineHeight: 1.4 }}>
                    {activity.message}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={9} /> {activity.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chapter Pipeline */}
        <div style={{
          background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
          borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <SectionHeader title="Chapter Pipeline" subtitle="Distribution by status" />
          <div style={{ flex: 1, padding: "20px" }}>
            {/* Stacked bar */}
            <div style={{ display: "flex", height: 24, borderRadius: 12, overflow: "hidden", marginBottom: 20, background: "var(--mf-bg-elevated)" }}>
              {[
                { key: "draft", color: "var(--mf-text-muted)", count: pipeline.draft },
                { key: "in_review", color: "var(--mf-orange)", count: pipeline.in_review },
                { key: "approved", color: "var(--mf-cyan)", count: pipeline.approved },
                { key: "published", color: "var(--mf-green)", count: pipeline.published },
                { key: "rejected", color: "var(--mf-magenta)", count: pipeline.rejected },
              ].filter(s => s.count > 0).map(s => (
                <div key={s.key} style={{
                  width: `${(s.count / totalChapters) * 100}%`, background: s.color,
                  transition: "width 0.6s ease", minWidth: s.count > 0 ? 8 : 0,
                  opacity: 0.85,
                }} />
              ))}
            </div>

            {/* Status breakdown cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "published", label: "Published", icon: CheckCircle, color: "var(--mf-green)", count: pipeline.published },
                { key: "approved", label: "Approved", icon: Eye, color: "var(--mf-cyan)", count: pipeline.approved },
                { key: "in_review", label: "In Review", icon: Clock, color: "var(--mf-orange)", count: pipeline.in_review },
                { key: "draft", label: "Draft", icon: FileText, color: "var(--mf-text-muted)", count: pipeline.draft },
                { key: "rejected", label: "Rejected", icon: XCircle, color: "var(--mf-magenta)", count: pipeline.rejected },
              ].map(item => {
                const ItemIcon = item.icon;
                const pct = totalChapters > 0 ? Math.round((item.count / totalChapters) * 100) : 0;
                return (
                  <div key={item.key} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    background: "var(--mf-bg-elevated)", borderRadius: 10, border: "1px solid var(--mf-border)",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, background: `${item.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <ItemIcon size={14} color={item.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)" }}>{item.label}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: item.color, marginRight: 8 }}>{item.count}</div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)",
                      padding: "2px 6px", background: "var(--mf-bg-surface)", borderRadius: 4,
                    }}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Users Online — compact horizontal strip */}
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, overflow: "hidden",
      }}>
        <SectionHeader
          title="Users Online"
          subtitle="Real-time user activity"
          rightContent={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mf-green)", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "var(--mf-green)", fontWeight: 700 }}>LIVE</span>
            </div>
          }
        />
        <div style={{ padding: "14px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onlineUsers.filter(u => u.status !== "offline").map(user => (
            <div key={user.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 10px",
              background: "var(--mf-bg-elevated)", borderRadius: 10, border: "1px solid var(--mf-border)",
              transition: "all 0.15s", cursor: "default",
            }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `linear-gradient(135deg, ${roleColor[user.role] || "var(--mf-cyan)"}50, ${roleColor[user.role] || "var(--mf-cyan)"}20)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: roleColor[user.role] || "var(--mf-cyan)",
                }}>
                  {user.avatar}
                </div>
                <div style={{
                  position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%",
                  background: statusDotColor[user.status], border: "2px solid var(--mf-bg-elevated)",
                }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text)", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ fontSize: 9, color: roleColor[user.role] || "var(--mf-text-muted)", fontWeight: 700 }}>{user.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Chapter Monitor ──────────────────────────────────────────────────

function ChapterMonitorTab({ chapters }: { chapters: ChapterStatus[] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = chapters.filter(ch => {
    const matchStatus = filter === "all" || ch.status === filter;
    const matchSearch = search === "" ||
      ch.manga.toLowerCase().includes(search.toLowerCase()) ||
      ch.title.toLowerCase().includes(search.toLowerCase()) ||
      ch.author.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const selected = filtered.find(ch => ch.id === selectedId);

  const progressColor = (p: number) =>
    p === 100 ? "var(--mf-green)" : p > 60 ? "var(--mf-cyan)" : "var(--mf-orange)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      {/* Top stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard icon={BookOpen} label="Total Chapters" value={chapters.length} color="var(--mf-cyan)" />
        <StatCard icon={Clock} label="In Review" value={chapters.filter(c => c.status === "in_review").length} color="var(--mf-orange)" />
        <StatCard icon={CheckCircle} label="Published" value={chapters.filter(c => c.status === "published").length} color="var(--mf-green)" />
        <StatCard icon={AlertTriangle} label="Rejected" value={chapters.filter(c => c.status === "rejected").length} color="var(--mf-magenta)" />
      </div>

      {/* Table + detail layout */}
      <div style={{ display: "flex", flex: 1, gap: 18, minHeight: 0 }}>
        {/* Table */}
        <div style={{
          flex: selected ? "0 0 60%" : 1, background: "var(--mf-bg-surface)",
          border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden",
          display: "flex", flexDirection: "column", transition: "flex 0.3s ease",
        }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "var(--mf-bg-elevated)", borderRadius: 8, border: "1px solid var(--mf-border)", flex: "0 0 220px",
            }}>
              <Search size={12} color="var(--mf-text-muted)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search manga, title, author..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--mf-text)", fontSize: 12 }}
              />
            </div>
            {/* Filter chips */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
              {[
                { key: "all", label: "All", count: chapters.length },
                { key: "draft", label: "Draft" },
                { key: "in_review", label: "In Review" },
                { key: "approved", label: "Approved" },
                { key: "published", label: "Published" },
                { key: "rejected", label: "Rejected" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: "pointer",
                    border: "1px solid",
                    background: filter === f.key ? (statusChapterConfig[f.key]?.bg || "var(--mf-bg-elevated)") : "transparent",
                    borderColor: filter === f.key ? (statusChapterConfig[f.key]?.color || "var(--mf-border-bright)") + "50" : "var(--mf-border)",
                    color: filter === f.key ? (statusChapterConfig[f.key]?.color || "var(--mf-text)") : "var(--mf-text-muted)",
                    transition: "all 0.12s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <TableHeader columns={[
            { label: "Manga", width: "25%" },
            { label: "Chapter" },
            { label: "Author", width: "15%" },
            { label: "Status", width: "12%" },
            { label: "Progress", width: "18%" },
            { label: "Updated", width: "10%", align: "right" },
          ]} />

          {/* Table body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)" }}>
                <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No chapters match your filters</p>
              </div>
            ) : (
              filtered.map(ch => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedId(selectedId === ch.id ? null : ch.id)}
                  style={{
                    display: "flex", alignItems: "center", padding: "12px 20px",
                    borderBottom: "1px solid var(--mf-border)", cursor: "pointer",
                    background: selectedId === ch.id ? "var(--mf-bg-elevated)" : "transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (selectedId !== ch.id) e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                  onMouseLeave={e => { if (selectedId !== ch.id) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Manga */}
                  <div style={{ flex: "0 0 25%", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${ch.mangaColor}20`, border: `1px solid ${ch.mangaColor}40`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <BookOpen size={14} color={ch.mangaColor} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ch.manga}
                    </span>
                  </div>
                  {/* Chapter */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mf-text)" }}>Ch. {ch.chapter}</div>
                    <div style={{ fontSize: 10, color: "var(--mf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.title}</div>
                  </div>
                  {/* Author */}
                  <div style={{ flex: "0 0 15%", fontSize: 12, color: "var(--mf-text-secondary)" }}>{ch.author}</div>
                  {/* Status */}
                  <div style={{ flex: "0 0 12%" }}><ChapterStatusBadge status={ch.status} /></div>
                  {/* Progress */}
                  <div style={{ flex: "0 0 18%", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{
                        width: `${ch.progress}%`, height: "100%", borderRadius: 100,
                        background: progressColor(ch.progress), transition: "width 0.6s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: progressColor(ch.progress), minWidth: 30, textAlign: "right" }}>
                      {ch.progress}%
                    </span>
                  </div>
                  {/* Updated */}
                  <div style={{ flex: "0 0 10%", fontSize: 10, color: "var(--mf-text-muted)", textAlign: "right" }}>{ch.updatedAt}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            flex: "0 0 38%", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
            borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
            animation: "slideIn 0.2s ease",
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid var(--mf-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${selected.mangaColor}20`, border: `1px solid ${selected.mangaColor}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <BookOpen size={18} color={selected.mangaColor} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{selected.manga}</h2>
                    <p style={{ fontSize: 11, color: "var(--mf-text-muted)", margin: 0 }}>Chapter {selected.chapter}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} style={{
                  background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 6,
                  padding: "4px 8px", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 11,
                }}>✕</button>
              </div>
              <ChapterStatusBadge status={selected.status} />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "TITLE", value: selected.title },
                  { label: "AUTHOR", value: selected.author },
                  { label: "PAGES", value: `${selected.pages} pages` },
                  { label: "LAST UPDATED", value: selected.updatedAt },
                ].map((info, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", background: "var(--mf-bg-elevated)", borderRadius: 10,
                    border: "1px solid var(--mf-border)",
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>
                      {info.label}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--mf-text)", fontWeight: 600 }}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div style={{
                padding: "14px 16px", background: "var(--mf-bg-elevated)", borderRadius: 10,
                border: "1px solid var(--mf-border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em" }}>COMPLETION PROGRESS</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: progressColor(selected.progress) }}>{selected.progress}%</span>
                </div>
                <div style={{ height: 8, background: "var(--mf-bg-surface)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{
                    width: `${selected.progress}%`, height: "100%", borderRadius: 100,
                    background: progressColor(selected.progress), transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: User Management ──────────────────────────────────────────────────

function UserManagementTab({ managedUsers, onAddRole, onRemoveRole }: {
  managedUsers: ManagedUser[];
  onAddRole: (userId: number, newRole: string) => void;
  onRemoveRole: (userId: number, role: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const unassignedCount = managedUsers.filter(u => u.roles.length === 0).length;
  const activeCount = managedUsers.filter(u => u.status === "online").length;

  const allRoles = ["all", "Editor", "Board Member", "Mangaka", "Assistant", "Unassigned"];
  const assignableRoles = ["Mangaka", "Assistant", "Editor", "Board Member"];

  const filtered = managedUsers.filter(u => {
    const matchRole = roleFilter === "all"
      || (roleFilter === "Unassigned" && u.roles.length === 0)
      || u.roles.includes(roleFilter);
    const matchSearch = search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const selected = filtered.find(u => u.id === selectedId);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    online: { label: "Online", color: "var(--mf-green)", bg: "var(--mf-green-dim)" },
    idle: { label: "Idle", color: "var(--mf-orange)", bg: "rgba(255,140,66,0.14)" },
    busy: { label: "Busy", color: "var(--mf-magenta)", bg: "var(--mf-magenta-dim)" },
    offline: { label: "Offline", color: "var(--mf-text-muted)", bg: "var(--mf-bg-elevated)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard icon={Users} label="Total Users" value={managedUsers.length} color="var(--mf-cyan)" />
        <StatCard icon={Activity} label="Active Now" value={activeCount} color="var(--mf-green)" />
        <StatCard icon={AlertTriangle} label="Unassigned Role" value={unassignedCount} color="var(--mf-orange)" subtitle={unassignedCount > 0 ? "Requires attention" : undefined} />
      </div>

      {/* Table + detail */}
      <div style={{ display: "flex", flex: 1, gap: 18, minHeight: 0 }}>
        {/* Table */}
        <div style={{
          flex: selected ? "0 0 58%" : 1, background: "var(--mf-bg-surface)",
          border: "1px solid var(--mf-border)", borderRadius: 16, overflow: "hidden",
          display: "flex", flexDirection: "column", transition: "flex 0.3s ease",
        }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "var(--mf-bg-elevated)", borderRadius: 8, border: "1px solid var(--mf-border)", flex: "0 0 200px",
            }}>
              <Search size={12} color="var(--mf-text-muted)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email..."
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--mf-text)", fontSize: 12 }}
              />
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
              {allRoles.map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: "pointer",
                    border: `1px solid ${roleFilter === r ? (roleColor[r] || "var(--mf-border-bright)") + "50" : "var(--mf-border)"}`,
                    background: roleFilter === r ? `${roleColor[r] || "var(--mf-text)"}15` : "transparent",
                    color: roleFilter === r ? (roleColor[r] || "var(--mf-text)") : "var(--mf-text-muted)",
                    transition: "all 0.12s",
                  }}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <TableHeader columns={[
            { label: "User", width: "32%" },
            { label: "Role", width: "20%" },
            { label: "Status", width: "14%" },
            { label: "Last Active", width: "14%" },
            { label: "Joined", width: "12%" },
            { label: "", width: "8%", align: "center" },
          ]} />

          {/* Table body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--mf-text-muted)" }}>
                <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>No users match your filters</p>
              </div>
            ) : (
              filtered.map(user => {
                const st = statusConfig[user.status] || statusConfig.offline;
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedId(selectedId === user.id ? null : user.id)}
                    style={{
                      display: "flex", alignItems: "center", padding: "10px 20px",
                      borderBottom: "1px solid var(--mf-border)", cursor: "pointer",
                      background: selectedId === user.id ? "var(--mf-bg-elevated)" : "transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (selectedId !== user.id) e.currentTarget.style.background = "var(--mf-bg-elevated)"; }}
                    onMouseLeave={e => { if (selectedId !== user.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* User */}
                    <div style={{ flex: "0 0 32%", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: `linear-gradient(135deg, ${roleColor[user.roles[0]] || "var(--mf-text-muted)"}50, ${roleColor[user.roles[0]] || "var(--mf-text-muted)"}20)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: roleColor[user.roles[0]] || "var(--mf-text-muted)",
                        }}>
                          {user.avatar}
                        </div>
                        <div style={{
                          position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%",
                          background: st.color, border: "2px solid var(--mf-bg-surface)",
                        }} />
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mf-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--mf-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    {/* Roles (tags) */}
                    <div style={{ flex: "0 0 20%", display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                      {user.roles.length === 0 ? (
                        <span style={{
                          padding: "3px 8px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                          background: "rgba(255,140,66,0.14)", color: "var(--mf-orange)",
                          border: "1px solid rgba(255,140,66,0.3)",
                        }}>Unassigned</span>
                      ) : (
                        user.roles.map(r => (
                          <span key={r} style={{
                            padding: "2px 8px", fontSize: 9, fontWeight: 800, borderRadius: 5,
                            background: `${roleColor[r] || "var(--mf-text-muted)"}15`,
                            color: roleColor[r] || "var(--mf-text-muted)",
                            border: `1px solid ${roleColor[r] || "var(--mf-text-muted)"}35`,
                            letterSpacing: "0.04em", whiteSpace: "nowrap",
                          }}>{r}</span>
                        ))
                      )}
                    </div>
                    {/* Status */}
                    <div style={{ flex: "0 0 14%" }}>
                      <StatusBadge label={st.label} color={st.color} bg={st.bg} />
                    </div>
                    {/* Last Active */}
                    <div style={{ flex: "0 0 14%", fontSize: 11, color: "var(--mf-text-muted)" }}>{user.lastActive}</div>
                    {/* Joined */}
                    <div style={{ flex: "0 0 12%", fontSize: 11, color: "var(--mf-text-muted)" }}>{user.joinedAt}</div>
                    {/* Action */}
                    <div style={{ flex: "0 0 8%", textAlign: "center" }}>
                      <Eye size={14} color="var(--mf-text-muted)" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            flex: "0 0 40%", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
            borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
            animation: "slideIn 0.2s ease",
          }}>
            {/* Header */}
            <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid var(--mf-border)", textAlign: "center", position: "relative" }}>
              <button onClick={() => setSelectedId(null)} style={{
                position: "absolute", right: 16, top: 16,
                background: "var(--mf-bg-elevated)", border: "1px solid var(--mf-border)", borderRadius: 6,
                padding: "4px 8px", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 11,
              }}>✕</button>
              <div style={{
                width: 56, height: 56, borderRadius: 14, margin: "0 auto 12px",
                background: `linear-gradient(135deg, ${roleColor[selected.roles[0]] || "var(--mf-text-muted)"}60, ${roleColor[selected.roles[0]] || "var(--mf-text-muted)"}20)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, color: roleColor[selected.roles[0]] || "var(--mf-text-muted)",
                border: `2px solid ${roleColor[selected.roles[0]] || "var(--mf-text-muted)"}40`,
              }}>
                {selected.avatar}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{selected.name}</h2>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 10 }}>{selected.email}</div>
              {/* Role tags */}
              <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                {selected.roles.length === 0 ? (
                  <span style={{
                    padding: "3px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                    background: "rgba(255,140,66,0.14)", color: "var(--mf-orange)",
                    border: "1px solid rgba(255,140,66,0.3)",
                  }}>Unassigned</span>
                ) : (
                  selected.roles.map(r => (
                    <span key={r} style={{
                      padding: "3px 10px", fontSize: 10, fontWeight: 800, borderRadius: 6,
                      background: `${roleColor[r] || "var(--mf-text-muted)"}15`,
                      color: roleColor[r] || "var(--mf-text-muted)",
                      border: `1px solid ${roleColor[r] || "var(--mf-text-muted)"}35`,
                      letterSpacing: "0.06em",
                    }}>{r}</span>
                  ))
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { icon: Activity, label: "STATUS", value: (statusConfig[selected.status] || statusConfig.offline).label },
                  { icon: Clock, label: "LAST ACTIVE", value: selected.lastActive },
                  { icon: Globe, label: "JOINED", value: selected.joinedAt },
                  { icon: Layers, label: "SOURCE", value: selected.source === "approved" ? "Registration" : "Existing" },
                ].map((info, i) => {
                  const InfoIcon = info.icon;
                  return (
                    <div key={i} style={{
                      padding: "12px 14px", background: "var(--mf-bg-elevated)", borderRadius: 10,
                      border: "1px solid var(--mf-border)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                        <InfoIcon size={10} color="var(--mf-text-muted)" />
                        <span style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em" }}>{info.label}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mf-text)" }}>{info.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Current roles section - always visible */}
              {selected.roles.length > 0 && (
                <div style={{
                  marginTop: 16, padding: "16px", background: "var(--mf-bg-elevated)",
                  borderRadius: 12, border: "1px solid var(--mf-border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <Shield size={12} color="var(--mf-cyan)" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", letterSpacing: "0.06em" }}>ASSIGNED ROLES</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {selected.roles.map(r => (
                      <div key={r} style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 12px",
                        background: `${roleColor[r]}12`, border: `1px solid ${roleColor[r]}35`,
                        borderRadius: 8, fontSize: 11, fontWeight: 700, color: roleColor[r],
                      }}>
                        {r}
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveRole(selected.id, r); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: roleColor[r], opacity: 0.6, padding: "0 2px",
                            fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; }}
                          title={`Remove ${r} role`}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  {/* Add more roles */}
                  {assignableRoles.filter(r => !selected.roles.includes(r)).length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginBottom: 6, fontWeight: 600 }}>Add another role:</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {assignableRoles.filter(r => !selected.roles.includes(r)).map(r => (
                          <button
                            key={r}
                            onClick={() => onAddRole(selected.id, r)}
                            style={{
                              padding: "5px 12px", fontSize: 10, fontWeight: 700, borderRadius: 6,
                              background: "transparent", border: `1px dashed ${roleColor[r]}50`,
                              color: roleColor[r], cursor: "pointer", transition: "all 0.15s",
                              opacity: 0.7,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${roleColor[r]}15`; e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = "0.7"; }}
                          >
                            + {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role assignment section for users with no roles */}
              {selected.roles.length === 0 && (
                <div style={{
                  marginTop: 16, padding: "16px", background: "rgba(255,140,66,0.08)",
                  borderRadius: 12, border: "1px solid rgba(255,140,66,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <AlertTriangle size={12} color="var(--mf-orange)" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-orange)" }}>ROLE ASSIGNMENT REQUIRED</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {assignableRoles.map(r => (
                      <button
                        key={r}
                        onClick={() => onAddRole(selected.id, r)}
                        style={{
                          padding: "7px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8,
                          background: `${roleColor[r]}15`, border: `1px solid ${roleColor[r]}40`,
                          color: roleColor[r], cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${roleColor[r]}30`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${roleColor[r]}15`; }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Registration Requests ─────────────────────────────────────────────

function RegistrationRequestsTab({ registrations, onApprove, onReject }: {
  registrations: AdminAccount[];
  onApprove: (id: number, role: string) => void;
  onReject: (id: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const pendingCount = registrations.filter(r => r.status === "PENDING").length;
  const approvedCount = registrations.filter(r => r.status === "ACTIVE").length;
  const rejectedCount = registrations.filter(r => r.status === "REJECTED").length;

  const filtered = registrations.filter(r => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return r.status === "PENDING";
    if (filterStatus === "approved") return r.status === "ACTIVE";
    if (filterStatus === "rejected") return r.status === "REJECTED";
    return true;
  });
  const selectedReq = filtered.find(r => r.id === selected) || filtered[0];

  if (filtered.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--mf-text-muted)", minHeight: 400 }}>
        <Inbox size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>No registration requests in this category</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", borderRadius: 16, border: "1px solid var(--mf-border)", background: "var(--mf-bg-surface)" }}>
      {/* Left: List */}
      <div style={{ width: 360, flexShrink: 0, borderRight: "1px solid var(--mf-border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--mf-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Registration Requests</h3>
            <div style={{ padding: "3px 10px", background: "var(--mf-orange)", borderRadius: 100, fontSize: 10, fontWeight: 800, color: "#000" }}>{pendingCount} new</div>
          </div>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 5 }}>
            {[
              { key: "all", label: "All", count: registrations.length },
              { key: "pending", label: "Pending", count: pendingCount },
              { key: "approved", label: "Approved", count: approvedCount },
              { key: "rejected", label: "Rejected", count: rejectedCount },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{
                  padding: "4px 9px", fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                  background: filterStatus === f.key ? "var(--mf-bg-elevated)" : "transparent",
                  border: `1px solid ${filterStatus === f.key ? "var(--mf-border-bright)" : "var(--mf-border)"}`,
                  color: filterStatus === f.key ? "var(--mf-text)" : "var(--mf-text-muted)",
                  transition: "all 0.12s",
                }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {filtered.map(req => (
            <button
              key={req.id}
              onClick={() => setSelected(req.id)}
              style={{
                display: "block", width: "100%", padding: "12px 13px", marginBottom: 6, textAlign: "left",
                background: selectedReq?.id === req.id ? "var(--mf-bg-elevated)" : "transparent",
                border: `1px solid ${selectedReq?.id === req.id ? "var(--mf-border-bright)" : "var(--mf-border)"}`,
                borderRadius: 12, cursor: "pointer", transition: "all 0.12s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)" }}>{req.firstName} {req.lastName}</span>
                <RegistrationStatusBadge status={(req.status || "pending").toLowerCase()} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--mf-text-muted)" }}>
                <span style={{ color: roleColor[req.requestedRole || ""] || "var(--mf-text-muted)", fontWeight: 700 }}>{req.requestedRole || "N/A"}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{req.email}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Detail */}
      {selectedReq && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--mf-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>{selectedReq.firstName} {selectedReq.lastName}</h2>
                <RegistrationStatusBadge status={(selectedReq.status || "pending").toLowerCase()} />
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--mf-text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} />{selectedReq.requestedRole || "N/A"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={10} />{selectedReq.email}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              {[
                { icon: Mail, label: "EMAIL", value: selectedReq.email },
                { icon: Phone, label: "PHONE", value: selectedReq.phoneNumber || "—" },
                { icon: Shield, label: "REQUESTED ROLE", value: selectedReq.requestedRole || "N/A", valueColor: roleColor[selectedReq.requestedRole || ""] },
                { icon: Activity, label: "STATUS", value: selectedReq.status },
              ].map((info, i) => {
                const InfoIcon = info.icon;
                return (
                  <div key={i} style={{ padding: "14px 16px", background: "var(--mf-bg-elevated)", borderRadius: 12, border: "1px solid var(--mf-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <InfoIcon size={11} color="var(--mf-text-muted)" />
                      <span style={{ fontSize: 9, fontWeight: 800, color: "var(--mf-text-muted)", letterSpacing: "0.08em" }}>{info.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: (info as any).valueColor || "var(--mf-text)", fontWeight: 600, lineHeight: 1.5 }}>{info.value}</div>
                  </div>
                );
              })}
            </div>



            {/* Info note */}
            {selectedReq.status === "PENDING" && (
              <div style={{ padding: "12px 16px", background: "var(--mf-cyan-dim)", borderRadius: 10, border: "1px solid rgba(0,240,255,0.2)", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 }}>
                <Info size={14} color="var(--mf-cyan)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 11, color: "var(--mf-text-secondary)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--mf-cyan)" }}>Note:</strong> Approving will assign the requested role <strong style={{ color: roleColor[selectedReq.requestedRole || ""] }}>{selectedReq.requestedRole}</strong> to this account.
                </div>
              </div>
            )}
            {selectedReq.status === "ACTIVE" && (
              <div style={{ padding: "12px 16px", background: "var(--mf-green-dim)", borderRadius: 10, border: "1px solid rgba(57,255,138,0.2)", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 }}>
                <CheckCircle size={14} color="var(--mf-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 11, color: "var(--mf-text-secondary)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--mf-green)" }}>Approved:</strong> This account is now active with role <strong>{selectedReq.requestedRole}</strong>.
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          {selectedReq.status === "PENDING" && (
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => onApprove(selectedReq.id, selectedReq.requestedRole || "")}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "10px 22px",
                  background: "var(--mf-green)", border: "none", borderRadius: 10,
                  color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 0 18px rgba(57,255,138,0.3)", transition: "box-shadow 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 30px rgba(57,255,138,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 18px rgba(57,255,138,0.3)")}
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={() => onReject(selectedReq.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "10px 22px",
                  background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)50",
                  borderRadius: 10, color: "var(--mf-magenta)", fontSize: 13, fontWeight: 800,
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("System Overview");
  const [onlineUsers, setOnlineUsers] = useState(initialOnlineUsers);
  const [chapters, setChapters] = useState(initialChapters);
  const [registrations, setRegistrations] = useState<AdminAccount[]>([]);
  const [activities] = useState(initialActivities);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    // Build initial managed users from existing online users
    const existing: ManagedUser[] = initialOnlineUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roles: [u.role],
      avatar: u.avatar,
      status: u.status,
      lastActive: u.lastActive,
      joinedAt: u.joinedAt,
      source: "existing" as const,
    }));
    // Add approved registrations with no roles
    const approved: ManagedUser[] = initialRegistrations
      .filter(r => r.status === "approved")
      .map(r => ({
        id: 1000 + r.id,
        name: `${r.firstName} ${r.lastName}`,
        email: r.email,
        roles: [],
        avatar: `${r.firstName[0]}${r.lastName[0]}`,
        status: "offline" as const,
        lastActive: r.submittedAt,
        joinedAt: "Just now",
        source: "approved" as const,
      }));
    return [...existing, ...approved];
  });
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch real registration data from API
  useEffect(() => {
    getAllAccounts()
      .then(accounts => setRegistrations(accounts))
      .catch(err => console.error("Failed to fetch accounts", err));
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly toggle user status
      setOnlineUsers(prev => prev.map(u => {
        if (Math.random() > 0.85) {
          const statuses: OnlineUser["status"][] = ["online", "idle", "busy"];
          return { ...u, status: statuses[Math.floor(Math.random() * statuses.length)], lastActive: "Just now" };
        }
        return u;
      }));

      // Randomly update chapter progress
      setChapters(prev => prev.map(ch => {
        if (ch.progress < 100 && Math.random() > 0.7) {
          const newProgress = Math.min(100, ch.progress + Math.floor(Math.random() * 5) + 1);
          return { ...ch, progress: newProgress, updatedAt: "Just now" };
        }
        return ch;
      }));

      setLastRefreshed(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleApprove = useCallback(async (id: number, roleName: string) => {
    try {
      await approveAccount(id, roleName);
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: "ACTIVE" } : r));
    } catch (err: any) {
      console.error("Failed to approve account", err);
    }
    // Add approved user to managed users
    setRegistrations(prev => {
      const reg = prev.find(r => r.id === id);
      if (reg) {
        setManagedUsers(mu => {
          if (mu.some(u => u.id === 1000 + id)) return mu;
          return [...mu, {
            id: 1000 + id,
            name: `${reg.firstName} ${reg.lastName}`,
            email: reg.email,
            roles: [reg.requestedRole || ""].filter(Boolean),
            avatar: `${reg.firstName[0]}${reg.lastName[0]}`,
            status: "offline" as const,
            lastActive: "Just now",
            joinedAt: "Just now",
            source: "approved" as const,
          }];
        });
      }
      return prev;
    });
  }, []);

  const handleReject = useCallback((id: number) => {
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" as const } : r));
  }, []);

  const handleAddRole = useCallback((userId: number, newRole: string) => {
    setManagedUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      if (u.roles.includes(newRole)) return u;
      return { ...u, roles: [...u.roles, newRole] };
    }));
  }, []);

  const handleRemoveRole = useCallback((userId: number, role: string) => {
    setManagedUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, roles: u.roles.filter(r => r !== role) };
    }));
  }, []);

  // Each nav maps to its own unique tab
  const navToTab: Record<string, string> = {
    "System Overview": "overview",
    "Registration Requests": "requests",
    "Chapter Monitor": "chapters",
    "User Management": "users",
  };

  const currentTab = navToTab[activeNav] || "overview";

  return (
    <AppLayout role="admin" activeNav={activeNav} onNavClick={setActiveNav}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: activeNav === "Registration Requests" ? "var(--mf-orange)"
                : activeNav === "Chapter Monitor" ? "var(--mf-magenta)"
                : activeNav === "User Management" ? "var(--mf-green)"
                : "var(--mf-cyan)",
            }} />
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>{activeNav}</span>
            {activeNav === "Registration Requests" && (
              <span style={{ fontSize: 11, color: "var(--mf-orange)", padding: "2px 8px", background: "rgba(255,140,66,0.14)", borderRadius: 6, fontWeight: 700 }}>
                {registrations.filter(r => r.status === "pending").length} pending
              </span>
            )}
            {activeNav === "User Management" && managedUsers.filter(u => u.roles.length === 0).length > 0 && (
              <span style={{ fontSize: 11, color: "var(--mf-orange)", padding: "2px 8px", background: "rgba(255,140,66,0.14)", borderRadius: 6, fontWeight: 700 }}>
                {managedUsers.filter(u => u.roles.length === 0).length} unassigned
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--mf-text-muted)" }}>
            <RefreshCw size={11} style={{ animation: "spin 3s linear infinite" }} />
            <span>Updated {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {currentTab === "overview" && (
            <OverviewTab onlineUsers={onlineUsers} chapters={chapters} registrations={registrations} activities={activities} />
          )}
          {currentTab === "chapters" && (
            <ChapterMonitorTab chapters={chapters} />
          )}
          {currentTab === "users" && (
            <UserManagementTab managedUsers={managedUsers} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />
          )}
          {currentTab === "requests" && (
            <RegistrationRequestsTab
              registrations={registrations}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </AppLayout>
  );
}
