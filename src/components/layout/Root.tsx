import { Outlet } from "react-router";
import { DemoNav } from "./DemoNav";

export function Root() {
  return (
    <div style={{ background: "var(--mf-bg-deep)", minHeight: "100vh", color: "var(--mf-text)" }}>
      <Outlet />
      <DemoNav />
    </div>
  );
}
