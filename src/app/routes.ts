import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { EditorDashboard } from "./components/editor/EditorDashboard";
import { BoardApproval } from "./components/board/BoardApproval";
import { MangakaStudio } from "./components/mangaka/MangakaStudio";
import { AssistantPortal } from "./components/assistant/AssistantPortal";
import { VotingRoom } from "./components/board/VotingRoom";

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
    ],
  },
]);
