import { invoke } from "@tauri-apps/api/tauri";
import { Todo, Project } from "../types";

export const apiService = {
  // Database initialization
  initDatabase: async (): Promise<string> => {
    return await invoke<string>('init_database');
  },

  // Project operations
  getProjects: async (): Promise<Project[]> => {
    return await invoke<Project[]>('get_projects');
  },

  createProject: async (project: { name: string; description?: string }): Promise<Project> => {
    return await invoke<Project>('create_project', { project });
  },

  deleteProject: async (id: number): Promise<void> => {
    return await invoke('delete_project', { id });
  },

  // Todo operations
  getTodos: async (projectId: number): Promise<Todo[]> => {
    return await invoke<Todo[]>('get_todos', { projectId });
  },

  createTodo: async (text: string, time: number, projectId: number): Promise<Todo> => {
    return await invoke<Todo>('create_todo', {
      text: text.trim(),
      time,
      projectId
    });
  },

  updateTodo: async (id: number, update: Partial<Todo>): Promise<Todo> => {
    return await invoke<Todo>('update_todo', { id, update });
  },

  deleteTodo: async (id: number): Promise<void> => {
    return await invoke('delete_todo', { id });
  },

  // Excalidraw operations
  saveExcalidrawData: async (elements: string, appState: string, projectId: number): Promise<void> => {
    return await invoke('save_excalidraw_data', {
      elements,
      appState,
      projectId
    });
  },

  getExcalidrawData: async (projectId: number): Promise<any> => {
    return await invoke<any>('get_excalidraw_data', { projectId });
  }
}; 