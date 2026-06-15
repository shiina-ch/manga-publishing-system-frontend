import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type Role = "editor" | "board" | "mangaka" | "assistant";

interface AppLayoutProps {
  role: Role;
  children: ReactNode;
  activeNav?: string;
  onNavClick?: (label: string) => void;
}

export function AppLayout({ role, children, activeNav, onNavClick }: AppLayoutProps) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--mf-bg-deep)" }}>
      <Sidebar role={role} activeNav={activeNav} onNavClick={onNavClick} />
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
