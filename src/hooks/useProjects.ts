import { useState, useCallback } from "react";
import { Project } from "../types";
import { apiService } from "../services/api";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const dbProjects = await apiService.getProjects();
      setProjects(dbProjects);
      
      // Set the first project as current if none is selected
      if (dbProjects.length > 0 && !currentProject) {
        setCurrentProject(dbProjects[0]);
      }
      
      setError(null);
    } catch (error) {
      setError(`Failed to load projects: ${error}`);
    }
  }, [currentProject]);

  const createProject = useCallback(async (name: string, description?: string) => {
    try {
      const newProject = await apiService.createProject({ name, description });
      await loadProjects();
      setCurrentProject(newProject);
      setError(null);
      return newProject;
    } catch (error) {
      setError(`Failed to create project: ${error}`);
      throw error;
    }
  }, [loadProjects]);

  const deleteProject = useCallback(async (projectId: number) => {
    try {
      await apiService.deleteProject(projectId);
      await loadProjects();
      
      // Switch to first available project
      if (projects.length > 1) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        if (remainingProjects.length > 0) {
          setCurrentProject(remainingProjects[0]);
        }
      }
      
      setError(null);
    } catch (error) {
      setError(`Failed to delete project: ${error}`);
      throw error;
    }
  }, [loadProjects, projects]);

  return {
    projects,
    currentProject,
    setCurrentProject,
    error,
    setError,
    loadProjects,
    createProject,
    deleteProject
  };
}; 