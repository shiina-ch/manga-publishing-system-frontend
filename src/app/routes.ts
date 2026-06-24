import { createElement } from "react";
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
import { AccountRequestsPage } from "../pages/accounts/AccountRequestsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "register", Component: Register },
      {
        Component: ProtectedRoute,
        children: [{ path: "profile", Component: UserProfile }],
      },
      {
        element: createElement(ProtectedRoute, { allowedRoles: ["ADMIN"] }),
        children: [{ path: "admin", Component: AdminDashboard }],
      },
      {
        element: createElement(ProtectedRoute, { allowedRoles: ["ADMIN", "MANAGER"] }),
        children: [{ path: "account-requests", Component: AccountRequestsPage }],
      },
      {
        element: createElement(ProtectedRoute, { allowedRoles: ["TANTOU_EDITOR"] }),
        children: [{ path: "editor", Component: EditorDashboard }],
      },
      {
        element: createElement(ProtectedRoute, { allowedRoles: ["EDITORIAL_BOARD_MEMBER"] }),
        children: [
          { path: "board", Component: BoardApproval },
          { path: "board/voting", Component: VotingRoom },
        ],
      },
      {
        element: createElement(ProtectedRoute, { allowedRoles: ["MANGAKA"] }),
        children: [{ path: "mangaka", Component: MangakaStudio }],
      },
      {
        element: createElement(ProtectedRoute, { allowedRoles: ["ASSISTANT"] }),
        children: [{ path: "assistant", Component: AssistantPortal }],
      },
    ],
  },
]);
