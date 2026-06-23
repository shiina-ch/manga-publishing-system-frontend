import { createBrowserRouter } from "react-router";
import { Root } from "../components/layout/Root";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { UserProfile } from "../pages/profile/UserProfile";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { EditorDashboard } from "../pages/editor/EditorDashboard";
import { BoardApproval } from "../pages/board/BoardApproval";
import { MangakaStudio } from "../pages/mangaka/MangakaStudio";
import { AssistantPortal } from "../pages/assistant/AssistantPortal";
import { VotingRoom } from "../pages/board/VotingRoom";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // ── Public: không cần đăng nhập ───────────────────────────
      { index: true, Component: Login },
      { path: "register", Component: Register },

      // ── Protected: phải có token mới được vào ─────────────────
      // ProtectedRoute không có path riêng → chỉ đóng vai trò guard,
      // URL vẫn giữ nguyên (/admin, /editor, …)
      {
        Component: ProtectedRoute,
        children: [
          { path: "profile",      Component: UserProfile },
          { path: "admin",        Component: AdminDashboard },
          { path: "editor",       Component: EditorDashboard },
          { path: "board",        Component: BoardApproval },
          { path: "mangaka",      Component: MangakaStudio },
          { path: "assistant",    Component: AssistantPortal },
          { path: "board/voting", Component: VotingRoom },
        ],
      },
    ],
  },
]);
