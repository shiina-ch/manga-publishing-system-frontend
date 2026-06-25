import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type Role = "editor" | "board" | "mangaka" | "assistant" | "admin" | "manager";

interface AppLayoutProps {
  /** Compatibility hint for existing callers. Authorization and navigation use JWT roles. */
  role?: Role;
  children: ReactNode;
  activeNav?: string;
  onNavClick?: (label: string) => void;
  navBadges?: Record<string, number>;
}

export function AppLayout(props: AppLayoutProps) {
  const { children, activeNav, onNavClick, navBadges } = props;
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--mf-bg-deep)" }}>
      <Sidebar activeNav={activeNav} onNavClick={onNavClick} navBadges={navBadges} />
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
