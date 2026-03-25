import { createContext, useContext, type ReactNode } from "react";
import { useProjectsState } from "../hooks/useProjects";

type ProjectsContextValue = ReturnType<typeof useProjectsState>;

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

/**
 * Mount exactly once at the app root so `useProjects()` shares one Supabase subscription
 * (single `projects` full fetch on load instead of one per consumer).
 */
export function ProjectsProvider({ children }: { children: ReactNode }) {
  const value = useProjectsState();
  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return ctx;
}
