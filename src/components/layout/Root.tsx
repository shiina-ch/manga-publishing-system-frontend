import { Outlet } from "react-router";


export function Root() {
  return (
    <div style={{ background: "var(--mf-bg-deep)", minHeight: "100vh", color: "var(--mf-text)" }}>
      <Outlet />

    </div>
  );
}
