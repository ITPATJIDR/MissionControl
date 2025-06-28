import { useState, useCallback } from "react";
import { Todo, Project } from "../types";
import { apiService } from "../services/api";

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async (currentProject: Project | null) => {
    if (!currentProject) return;
    
    try {
      const dbTodos = await apiService.getTodos(currentProject.id);
      setTodos(dbTodos);
      setError(null);
    } catch (error) {
      setError(`Failed to load todos: ${error}`);
    }
  }, []);

  const addTodo = useCallback(async (text: string, currentProject: Project | null) => {
    if (text.trim() && currentProject) {
      try {
        await apiService.createTodo(text.trim(), 25, currentProject.id);
        await loadTodos(currentProject);
        setError(null);
      } catch (error) {
        setError(`Failed to create todo: ${error}`);
      }
    }
  }, [loadTodos]);

  const deleteTodo = useCallback(async (id: number) => {
    try {
      await apiService.deleteTodo(id);
      setTodos(todos => todos.filter(todo => todo.id !== id));
      setError(null);
    } catch (error) {
      setError(`Failed to delete todo: ${error}`);
    }
  }, []);

  const toggleTodo = useCallback(async (id: number) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        const updatedTodo = await apiService.updateTodo(id, { completed: !todo.completed });
        setTodos(todos => todos.map(todo => todo.id === id ? updatedTodo : todo));
        setError(null);
      }
    } catch (error) {
      setError(`Failed to toggle todo: ${error}`);
    }
  }, [todos]);

  const updateTodo = useCallback(async (id: number, newText: string, newTime?: number) => {
    try {
      const update: any = { text: newText };
      if (newTime !== undefined) {
        update.time = newTime;
      }

      const updatedTodo = await apiService.updateTodo(id, update);
      setTodos(todos => todos.map(todo => todo.id === id ? updatedTodo : todo));
      setError(null);
    } catch (error) {
      setError(`Failed to update todo: ${error}`);
    }
  }, []);

  return {
    todos,
    error,
    setError,
    loadTodos,
    addTodo,
    deleteTodo,
    toggleTodo,
    updateTodo
  };
}; 