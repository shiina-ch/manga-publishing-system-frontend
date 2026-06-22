import { createBrowserRouter } from "react-router";
import { Root } from "../components/layout/Root";
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
      { index: true, Component: Login },
      { path: "register", Component: Register },
      { path: "profile", Component: UserProfile },
      { path: "admin", Component: AdminDashboard },
      { path: "editor", Component: EditorDashboard },
      { path: "board", Component: BoardApproval },
      { path: "mangaka", Component: MangakaStudio },
      { path: "assistant", Component: AssistantPortal },
      { path: "board/voting", Component: VotingRoom },
    ],
  },
]);
