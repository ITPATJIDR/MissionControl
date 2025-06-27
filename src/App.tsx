import { useState, useEffect, useRef } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";
import { X } from "lucide-react";
import "./App.css";
import CollapseState from "./components/ui/collapse_state";
import TodoList from "./components/ui/todo_list";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import ProjectSelector from "./components/ui/project_selector";

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number; // time in minutes
  created_at?: string;
  project_id: number;
}

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [focusedTodo, setFocusedTodo] = useState<Todo | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [excalidrawInitialized, setExcalidrawInitialized] = useState(false);
  const [shouldReloadExcalidraw, setShouldReloadExcalidraw] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Add a ref to track the project during saves
  const currentProjectRef = useRef<Project | null>(null);

  // Add a ref to track the last saved state
  const lastSavedElements = useRef<string>('');

  // Add a flag to prevent concurrent saves
  const isSaving = useRef<boolean>(false);

  // Update the ref whenever currentProject changes
  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  // Initialize database and load todos on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        const initResult = await invoke<string>('init_database');

        // Small delay to ensure database is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Load projects first
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
  }, []);

  // Debug effect to track state changes
  useEffect(() => {
    // Effect for tracking state changes
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw, currentProject, isCollapsed]);

  // Simplified auto-save effect - only save when there are actual changes
  useEffect(() => {
    if (!excalidrawAPI || !excalidrawInitialized || shouldReloadExcalidraw || !currentProject) {
      return;
    }

    const saveExcalidrawData = async (force = false) => {
      // Prevent concurrent saves
      if (isSaving.current) {
        return;
      }

      try {
        isSaving.current = true;
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        
        const currentElementsString = JSON.stringify(elements);
        
        // Only save if there are actual changes (or forced)
        if (!force && currentElementsString === lastSavedElements.current) {
          return; // No changes, skip save
        }

        // For non-forced saves, only save if there are elements
        // For forced saves (like on app close), save regardless
        const hasElements = elements && elements.length > 0;
        if (!force && !hasElements) {
          return; // Don't save empty canvas unless forced
        }

        setSaveStatus('saving');

        await invoke('save_excalidraw_data', {
          elements: currentElementsString,
          appState: JSON.stringify({
            zenModeEnabled: appState.zenModeEnabled,
            viewBackgroundColor: appState.viewBackgroundColor,
          }),
          projectId: currentProject.id
        });
        
        // Update the last saved state
        lastSavedElements.current = currentElementsString;
        
        setSaveStatus('success');
        
        // Clear success status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        isSaving.current = false;
      }
    };

    // Check for changes every 2 seconds and save if needed
    const interval = setInterval(() => {
      if (!isSaving.current) {
        const elements = excalidrawAPI.getSceneElements();
        const currentElementsString = JSON.stringify(elements);
        
        if (currentElementsString !== lastSavedElements.current) {
          saveExcalidrawData();
        }
      }
    }, 2000);

    // Save on app close/unload
    const handleBeforeUnload = () => {
      if (!shouldReloadExcalidraw && !isSaving.current) {
        saveExcalidrawData(true); // Force save on close
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw, currentProject]);

  // Handle project switching - save current data and load new project data
  useEffect(() => {
    if (currentProject) {
      // Save current Excalidraw data before switching if API is ready
      const saveBeforeSwitch = async () => {
        if (excalidrawAPI && excalidrawInitialized && !shouldReloadExcalidraw) {
          try {
            const elements = excalidrawAPI.getSceneElements();
            const appState = excalidrawAPI.getAppState();
            const currentElementsString = JSON.stringify(elements);

            // Save to the previous project if there was one and there are changes
            const previousProjectId = currentProjectRef.current?.id;
            if (previousProjectId && previousProjectId !== currentProject.id && currentElementsString !== lastSavedElements.current) {
              setSaveStatus('saving');
              
              await invoke('save_excalidraw_data', {
                elements: currentElementsString,
                appState: JSON.stringify({
                  zenModeEnabled: appState.zenModeEnabled,
                  viewBackgroundColor: appState.viewBackgroundColor,
                }),
                projectId: previousProjectId
              });
              
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 1000);
            }
          } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        }
        
        // Load todos for new project
        loadTodos();
        
        // Reset excalidraw state to force reload of new project data
        setExcalidrawInitialized(false);
        setShouldReloadExcalidraw(true);
      };

      saveBeforeSwitch();
    }
  }, [currentProject]);

  // Update lastSavedElements when loading data
  useEffect(() => {
    const loadExcalidrawData = async () => {
      if (excalidrawAPI && currentProject && (!excalidrawInitialized || shouldReloadExcalidraw)) {
        console.log('loading excalidraw data');
        console.log('excalidrawAPI', currentProject.id);
        try {
          setSaveStatus('idle'); // Clear any previous save status
          
          const savedData = await invoke<any>('get_excalidraw_data', { projectId: currentProject.id });

          if (savedData) {
            console.log("HI");
            const elements = JSON.parse(savedData.elements);
            const appState = JSON.parse(savedData.app_state);

            await new Promise(resolve => setTimeout(resolve, 100));

            console.log('elements', elements);
            console.log('appState', appState);
            excalidrawAPI.updateScene({
              elements,
              appState: {
                ...appState,
                zenModeEnabled: appState.zenModeEnabled || false,
              }
            });

            // Update the last saved state
            lastSavedElements.current = savedData.elements;
          } else {
            console.log("NO DATA");
            // Clear the canvas if no data for this project
            excalidrawAPI.updateScene({
              elements: [],
              appState: { zenModeEnabled: false }
            });
            
            // Reset last saved state
            lastSavedElements.current = '[]';
          }

          setExcalidrawInitialized(true);
          setShouldReloadExcalidraw(false);
        } catch (error) {
          setExcalidrawInitialized(true);
          setShouldReloadExcalidraw(false);
        }
      }
    };

    loadExcalidrawData();
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw, currentProject]);

  const loadTodos = async () => {
    if (!currentProject) return;
    
    try {
      const dbTodos = await invoke<Todo[]>('get_todos', { projectId: currentProject.id });
      setTodos(dbTodos);
    } catch (error) {
      setError(`Failed to load todos: ${error}`);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCollapsed && focusedTodo && remainingTime > 0 && !isPaused) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Timer finished - automatically move to next task
            handleSkip();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCollapsed, focusedTodo, remainingTime, isPaused]);

  const handleCollapse = () => {
    const wasCollapsed = isCollapsed;
    
    // Save current Excalidraw data before triggering reload when returning from collapsed state
    const saveAndToggle = async () => {
      if (wasCollapsed && excalidrawAPI && excalidrawInitialized && currentProject) {
        try {
          // Wait for any ongoing save to complete
          while (isSaving.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          isSaving.current = true;
          const elements = excalidrawAPI.getSceneElements();
          const appState = excalidrawAPI.getAppState();
          const currentElementsString = JSON.stringify(elements);
          
          // Only save if there are changes AND there are actual elements to save
          const hasElements = elements && elements.length > 0;
          const hasChanges = currentElementsString !== lastSavedElements.current;
          
          if (hasChanges && hasElements) {
            setSaveStatus('saving');
            
            await invoke('save_excalidraw_data', {
              elements: currentElementsString,
              appState: JSON.stringify({
                zenModeEnabled: appState.zenModeEnabled,
                viewBackgroundColor: appState.viewBackgroundColor,
              }),
              projectId: currentProject.id
            });
            
            // Update the last saved state
            lastSavedElements.current = currentElementsString;
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 1000);
          }
        } catch (error) {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } finally {
          isSaving.current = false;
        }
      }
      
      setIsCollapsed(!isCollapsed);
      setIsPaused(false); // Reset pause when returning to todo list
      
      // Trigger reload when returning from collapsed state
      if (wasCollapsed) {
        // Reset both flags to ensure proper reload
        setExcalidrawInitialized(false);
        setShouldReloadExcalidraw(true);
      }
    };
    
    saveAndToggle();
  };

  const handleClose = async () => {
    await appWindow.close();
  };

  const handleFocus = async (todo: Todo) => {
    // Save current Excalidraw data before going to focus mode
    if (excalidrawAPI && excalidrawInitialized && currentProject && !shouldReloadExcalidraw) {
      try {
        // Wait for any ongoing save to complete
        while (isSaving.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        isSaving.current = true;
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const currentElementsString = JSON.stringify(elements);
        
        // Only save if there are changes AND there are actual elements to save
        // This prevents saving empty canvas over existing content
        const hasElements = elements && elements.length > 0;
        const hasChanges = currentElementsString !== lastSavedElements.current;
        
        if (hasChanges && hasElements) {
          setSaveStatus('saving');
          
          await invoke('save_excalidraw_data', {
            elements: currentElementsString,
            appState: JSON.stringify({
              zenModeEnabled: appState.zenModeEnabled,
              viewBackgroundColor: appState.viewBackgroundColor,
            }),
            projectId: currentProject.id
          });
          
          // Update the last saved state
          lastSavedElements.current = currentElementsString;
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 1000);
        }
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } finally {
        isSaving.current = false;
      }
    }

    setFocusedTodo(todo);
    setRemainingTime(todo.time * 60); // convert minutes to seconds
    setIsPaused(false);
    setIsCollapsed(true);
  };

  const handleSkip = () => {
    // Find the next incomplete task after the current focused task
    const incompleteTodos = todos.filter(todo => !todo.completed);
    const currentIndex = incompleteTodos.findIndex(todo => todo.id === focusedTodo?.id);

    if (currentIndex < incompleteTodos.length - 1) {
      // Move to next task
      const nextTodo = incompleteTodos[currentIndex + 1];
      setFocusedTodo(nextTodo);
      setRemainingTime(nextTodo.time * 60);
      setIsPaused(false);
    } else if (incompleteTodos.length > 1) {
      // If at the end, go back to first task
      const firstTodo = incompleteTodos[0];
      setFocusedTodo(firstTodo);
      setRemainingTime(firstTodo.time * 60);
      setIsPaused(false);
    } else {
      // No more tasks, return to todo list
      handleCollapse();
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleDone = () => {
    if (focusedTodo) {
      // Mark current task as completed
      toggleTodo(focusedTodo.id);

      // Move to next incomplete task
      const incompleteTodos = todos.filter(todo => !todo.completed && todo.id !== focusedTodo.id);

      if (incompleteTodos.length > 0) {
        const nextTodo = incompleteTodos[0];
        setFocusedTodo(nextTodo);
        setRemainingTime(nextTodo.time * 60);
        setIsPaused(false);
      } else {
        // No more incomplete tasks, return to todo list
        handleCollapse();
      }
    }
  };

  const handleHover = (state: boolean) => {
    setIsHovered(state);
  };

  const handleDragStart = async () => {
    await appWindow.startDragging();
  };

  const addTodo = async (text: string) => {
    if (text.trim() && currentProject) {
      try {
        const newTodo = await invoke<Todo>('create_todo', {
          text: text.trim(),
          time: 25,
          projectId: currentProject.id
        });

        await loadTodos();
        setIsAddingTask(false);
        setError(null);
      } catch (error) {
        setError(`Failed to create todo: ${error}`);
      }
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await invoke('delete_todo', { id });
      setTodos(todos.filter(todo => todo.id !== id));
      setError(null);
    } catch (error) {
      setError(`Failed to delete todo: ${error}`);
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        const updatedTodo = await invoke<Todo>('update_todo', {
          id,
          update: { completed: !todo.completed }
        });
        setTodos(todos.map(todo =>
          todo.id === id ? updatedTodo : todo
        ));
        setError(null);
      }
    } catch (error) {
      setError(`Failed to toggle todo: ${error}`);
    }
  };

  const updateTodo = async (id: number, newText: string, newTime?: number) => {
    try {
      const update: any = { text: newText };
      if (newTime !== undefined) {
        update.time = newTime;
      }

      const updatedTodo = await invoke<Todo>('update_todo', {
        id,
        update
      });

      setTodos(todos.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));
      setError(null);
    } catch (error) {
      setError(`Failed to update todo: ${error}`);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load projects and set current project
  const loadProjects = async () => {
    try {
      const dbProjects = await invoke<Project[]>('get_projects');
      setProjects(dbProjects);
      
      // Set the first project as current if none is selected
      if (dbProjects.length > 0 && !currentProject) {
        setCurrentProject(dbProjects[0]);
      }
    } catch (error) {
      setError(`Failed to load projects: ${error}`);
    }
  };

  // Add project management functions
  const createProject = async (name: string, description?: string) => {
    try {
      const newProject = await invoke<Project>('create_project', {
        project: { name, description }
      });
      await loadProjects();
      setCurrentProject(newProject);
      setError(null);
      return newProject;
    } catch (error) {
      setError(`Failed to create project: ${error}`);
      throw error;
    }
  };

  const deleteProject = async (projectId: number) => {
    try {
      await invoke('delete_project', { id: projectId });
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
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="text-red-400 text-center">
          <div>Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden h-screen w-full flex">
      {isCollapsed ? (
        <CollapseState
          handleDragStart={handleDragStart}
          handleCollapse={handleCollapse}
          isHovered={isHovered}
          handleHover={handleHover}
          focusedTodo={focusedTodo}
          remainingTime={formatTime(remainingTime)}
          onSkip={handleSkip}
          onPause={handlePause}
          onDone={handleDone}
          isPaused={isPaused}
        />
      ) : (
        <div className="flex-col w-full h-screen">
          {/* RESTORE THE CLOSE BUTTON */}
          <div className="absolute top-0 right-0 bg-[#171c25] flex rounded-t-2xl justify-end z-50">
            <button
              onClick={handleClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors group"
              title="Close App"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </button>
          </div>
          
          <div className="flex w-full h-screen">
            <div
              className="w-[300px] h-screen bg-[#171c25] overflow-hidden shadow-2xl flex flex-col"
              onMouseDown={handleDragStart}
            >
              <div className="p-6 h-full overflow-y-auto flex flex-col">
                {/* Project Selector */}
                <div className="mb-4">
                  <ProjectSelector
                    projects={projects}
                    currentProject={currentProject}
                    onProjectSelect={setCurrentProject}
                    onProjectCreate={createProject}
                    onProjectDelete={deleteProject}
                    isOpen={isProjectSelectorOpen}
                    onToggle={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)}
                  />
                </div>

                <div className="flex-1">
                  <TodoList
                    todos={todos}
                    onAddTodo={addTodo}
                    onDeleteTodo={deleteTodo}
                    onToggleTodo={toggleTodo}
                    onUpdateTodo={updateTodo}
                    isAddingTask={isAddingTask}
                    setIsAddingTask={setIsAddingTask}
                  />
                </div>

                {/* Focus Button */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const firstIncompleteTodo = todos.find(todo => !todo.completed);
                      if (firstIncompleteTodo) {
                        handleFocus(firstIncompleteTodo);
                      }
                    }}
                    disabled={!todos.some(todo => !todo.completed)}
                    className="w-full p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </div>
            
            {/* Excalidraw area with save status */}
            <div className="w-[1100px] h-screen bg-[#171c25] p-12 relative">
              <Excalidraw
                excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
                  setExcalidrawAPI(api);
                }}
              />
              
              {/* Save Status Indicator - Subtle text only in bottom right */}
              {saveStatus !== 'idle' && (
                <div 
                  className={`fixed bottom-2 right-2 px-3 py-1 rounded text-sm font-medium transition-all duration-300 z-50 ${
                    saveStatus === 'saving' 
                      ? 'text-blue-400' 
                      : saveStatus === 'success' 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}
                  style={{ 
                    opacity: 0.7,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'success' && 'Saved'}
                  {saveStatus === 'error' && 'Save Failed'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
