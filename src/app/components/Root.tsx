import { Outlet } from "react-router";
import { DemoNav } from "./shared/DemoNav";

export function Root() {
  return (
    <div style={{ background: "var(--mf-bg-deep)", minHeight: "100vh", color: "var(--mf-text)" }}>
      <Outlet />
      <DemoNav />
    </div>
  );
}
