export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number; // time in minutes
  created_at?: string;
  project_id: number;
}

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error'; 