import { apiRequest } from "./api";

export interface ProjectFromApi {
  id: number;
  title: string | null;
  description: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface ProjectUI extends ProjectFromApi {
  title: string;
  description: string;
  status: string;
  chapter: string;
  mangaka: string;
  progress: number;
  budget: number;
  allocated: number;
  nextDeadline: string;
  genre: string;
  color: string;
}

const UI_COLORS = [
  "var(--mf-cyan)",
  "var(--mf-orange)",
  "var(--mf-magenta)",
  "var(--mf-green)",
];

function mapToProjectUI(project: ProjectFromApi, index: number): ProjectUI {
  return {
    ...project,
    title: project.title || `Project #${project.id}`,
    description: project.description || "",
    status: project.status || "UNKNOWN",
    chapter: "No chapter data",
    mangaka: "Unassigned",
    progress: 0,
    budget: 0,
    allocated: 0,
    nextDeadline: "No deadline",
    genre: "Unspecified",
    color: UI_COLORS[index % UI_COLORS.length],
  };
}

export async function getProjects(): Promise<ProjectUI[]> {
  const data = await apiRequest<ProjectFromApi[]>("/projects");
  return data.map(mapToProjectUI);
}

export async function createProject(payload: {
  title: string;
  description: string;
  status?: string;
}): Promise<ProjectFromApi> {
  return apiRequest<ProjectFromApi>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  }, [200, 201]);
}
