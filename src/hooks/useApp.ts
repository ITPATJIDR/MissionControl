import { useState, useEffect, useCallback } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { apiService } from "../services/api";
import { useProjects } from "./useProjects";
import { useTodos } from "./useTodos";
import { useTimer } from "./useTimer";
import { useExcalidraw } from "./useExcalidraw";

export const useApp = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  // Use custom hooks
  const {
    projects,
    currentProject,
    setCurrentProject,
    error: projectError,
    setError: setProjectError,
    loadProjects,
    createProject,
    deleteProject
  } = useProjects();

  const {
    todos,
    error: todoError,
    setError: setTodoError,
    loadTodos,
    addTodo,
    deleteTodo,
    toggleTodo,
    updateTodo
  } = useTodos();

  const {
    focusedTodo,
    remainingTime,
    isPaused,
    handleFocus,
    handleSkip,
    handlePause,
    handleDone,
    getFirstIncompleteTodo,
    hasIncompleteTodos,
    resetTimer
  } = useTimer(todos, toggleTodo);

  const {
    excalidrawAPI,
    setExcalidrawAPI,
    saveStatus,
    saveCurrentData,
    triggerReload
  } = useExcalidraw(currentProject);

  // Combined error state
  const error = projectError || todoError;
  const setError = useCallback((err: string | null) => {
    setProjectError(err);
    setTodoError(err);
  }, [setProjectError, setTodoError]);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await apiService.initDatabase();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadProjects();
        setError(null);
      } catch (error) {
        setError(`Failed to initialize app: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
    appWindow.center();
  }, [loadProjects, setError]);

  // Load todos when current project changes
  useEffect(() => {
    if (currentProject) {
      loadTodos(currentProject);
    }
  }, [currentProject, loadTodos]);

  // Handlers
  const handleCollapse = useCallback(async () => {
    const wasCollapsed = isCollapsed;
    
    if (wasCollapsed) {
      await saveCurrentData();
    }
    
    setIsCollapsed(!isCollapsed);
    
    if (wasCollapsed) {
      resetTimer();
      triggerReload();
    }
  }, [isCollapsed, saveCurrentData, resetTimer, triggerReload]);

  const handleClose = useCallback(async () => {
    await appWindow.close();
  }, []);

  const handleFocusMode = useCallback(async () => {
    const firstIncompleteTodo = getFirstIncompleteTodo();
    if (firstIncompleteTodo) {
      await saveCurrentData();
      handleFocus(firstIncompleteTodo);
      setIsCollapsed(true);
    }
  }, [getFirstIncompleteTodo, saveCurrentData, handleFocus]);

  const handleHover = useCallback((state: boolean) => {
    setIsHovered(state);
  }, []);

  const handleDragStart = useCallback(async () => {
    await appWindow.startDragging();
  }, []);

  const handleAddTodo = useCallback((text: string) => {
    addTodo(text, currentProject).then(() => {
      setIsAddingTask(false);
    });
  }, [addTodo, currentProject]);

  const handleUpdateTodo = useCallback((id: number, newText: string, newTime?: number) => {
    updateTodo(id, newText, newTime);
  }, [updateTodo]);

  const handleTimerAction = useCallback((action: 'skip' | 'pause' | 'done') => {
    let result;
    switch (action) {
      case 'skip':
        result = handleSkip();
        break;
      case 'pause':
        handlePause();
        break;
      case 'done':
        result = handleDone();
        break;
    }
    
    // If timer actions return 'exit_focus', exit focus mode
    if (result === 'exit_focus') {
      handleCollapse();
    }
  }, [handleSkip, handlePause, handleDone, handleCollapse]);

  return {
    // State
    isCollapsed,
    isHovered,
    isAddingTask,
    isLoading,
    isProjectSelectorOpen,
    error,
    
    // Projects
    projects,
    currentProject,
    
    // Todos
    todos,
    
    // Timer
    focusedTodo,
    remainingTime,
    isPaused,
    
    // Excalidraw
    excalidrawAPI,
    saveStatus,
    
    // Computed values
    hasIncompleteTodos: hasIncompleteTodos(),
    
    // Handlers
    setCurrentProject,
    createProject,
    deleteProject,
    handleAddTodo,
    deleteTodo,
    toggleTodo,
    handleUpdateTodo,
    setIsAddingTask,
    setIsProjectSelectorOpen: () => setIsProjectSelectorOpen(!isProjectSelectorOpen),
    handleCollapse,
    handleClose,
    handleFocusMode,
    handleHover,
    handleDragStart,
    setExcalidrawAPI,
    handleTimerAction
  };
}; 