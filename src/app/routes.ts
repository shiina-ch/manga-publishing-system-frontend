import { createBrowserRouter } from "react-router";
import { Root } from "../components/layout/Root";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { EditorDashboard } from "../pages/editor/EditorDashboard";
import { BoardApproval } from "../pages/board/BoardApproval";
import { MangakaStudio } from "../pages/mangaka/MangakaStudio";
import { AssistantPortal } from "../pages/assistant/AssistantPortal";
import { VotingRoom } from "../pages/board/VotingRoom";
import { UserProfile } from "../pages/profile/UserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "register", Component: Register },
      { path: "editor", Component: EditorDashboard },
      { path: "board", Component: BoardApproval },
      { path: "mangaka", Component: MangakaStudio },
      { path: "assistant", Component: AssistantPortal },
      { path: "board/voting", Component: VotingRoom },
      { path: "profile", Component: UserProfile },
    ],
  },
]);
