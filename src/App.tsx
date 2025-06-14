import { useState, useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/tauri";
import { X } from "lucide-react";
import "./App.css";
import CollapseState from "./components/ui/collapse_state";
import TodoList from "./components/ui/todo_list";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number; // time in minutes
  created_at?: string;
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

  // Initialize database and load todos on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        // Initialize database
        const initResult = await invoke<string>('init_database');
        console.log('Database init result:', initResult);

        // Small delay to ensure database is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Load existing todos
        await loadTodos();
        setError(null);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError(`Failed to initialize app: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
    appWindow.center();
  }, []);

  // Load Excalidraw data when API is ready OR when we need to reload
  useEffect(() => {
    const loadExcalidrawData = async () => {
      if (excalidrawAPI && (!excalidrawInitialized || shouldReloadExcalidraw)) {
        try {
          console.log('Loading Excalidraw data...');
          const savedData = await invoke<any>('get_excalidraw_data');

          if (savedData) {
            const elements = JSON.parse(savedData.elements);
            const appState = JSON.parse(savedData.app_state);

            // Add a small delay to ensure Excalidraw is fully ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update the scene with saved data
            excalidrawAPI.updateScene({
              elements,
              appState: {
                ...appState,
                zenModeEnabled: appState.zenModeEnabled || false,
              }
            });

            console.log('Excalidraw data restored successfully');
          } else {
            console.log('No saved Excalidraw data found');
          }

          setExcalidrawInitialized(true);
          setShouldReloadExcalidraw(false);
        } catch (error) {
          console.error('Failed to load Excalidraw data:', error);
          setExcalidrawInitialized(true);
          setShouldReloadExcalidraw(false);
        }
      }
    };

    loadExcalidrawData();
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw]);

  // Modify auto-save to be more careful about when it saves
  useEffect(() => {
    if (!excalidrawAPI || !excalidrawInitialized || shouldReloadExcalidraw) return;

    const saveExcalidrawData = async () => {
      try {
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();

        // Only save if there are elements to avoid unnecessary saves
        if (elements.length > 0) {
          await invoke('save_excalidraw_data', {
            data: {
              elements: JSON.stringify(elements),
              app_state: JSON.stringify({
                zenModeEnabled: appState.zenModeEnabled,
                viewBackgroundColor: appState.viewBackgroundColor,
                // Add other app state properties you want to persist
              })
            }
          });
          console.log('Excalidraw data auto-saved');
        }
      } catch (error) {
        console.error('Failed to auto-save Excalidraw data:', error);
      }
    };

    // Auto-save every 30 seconds
    const interval = setInterval(saveExcalidrawData, 30000);

    // Save on app close/unload
    const handleBeforeUnload = () => {
      // Only save if we're not in the middle of reloading
      if (!shouldReloadExcalidraw) {
        saveExcalidrawData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Don't save on cleanup if we're reloading to avoid race conditions
      if (!shouldReloadExcalidraw) {
        saveExcalidrawData();
      }
    };
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw]);

  const loadTodos = async () => {
    try {
      console.log('Loading todos...');
      const dbTodos = await invoke<Todo[]>('get_todos');
      console.log('Loaded todos:', dbTodos);
      setTodos(dbTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
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
    console.log("handleCollapse");
    const wasCollapsed = isCollapsed;
    setIsCollapsed(!isCollapsed);
    setIsPaused(false); // Reset pause when returning to todo list
    
    // Trigger reload when returning from collapsed state
    if (wasCollapsed) {
      setShouldReloadExcalidraw(true);
    }
  };

  const handleClose = async () => {
    await appWindow.close();
  };

  const handleFocus = (todo: Todo) => {
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
    if (text.trim()) {
      try {
        console.log('Creating todo:', text);
        const newTodo = await invoke<Todo>('create_todo', {
          todo: {
            text: text.trim(),
            time: 25 // default 25 minutes
          }
        });
        console.log('Todo created:', newTodo);

        // Reload todos from database to ensure correct order
        await loadTodos();
        setIsAddingTask(false);
        setError(null);
      } catch (error) {
        console.error('Failed to create todo:', error);
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
      console.error('Failed to delete todo:', error);
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
      console.error('Failed to toggle todo:', error);
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
      console.error('Failed to update todo:', error);
      setError(`Failed to update todo: ${error}`);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add manual save function (optional)
  // const saveExcalidrawManually = async () => {
  //   if (excalidrawAPI) {
  //     try {
  //       const elements = excalidrawAPI.getSceneElements();
  //       const appState = excalidrawAPI.getAppState();

  //       await invoke('save_excalidraw_data', {
  //         data: {
  //           elements: JSON.stringify(elements),
  //           app_state: JSON.stringify({
  //             zenModeEnabled: appState.zenModeEnabled,
  //             viewBackgroundColor: appState.viewBackgroundColor,
  //           })
  //         }
  //       });
  //       console.log('Excalidraw data saved manually');
  //     } catch (error) {
  //       console.error('Failed to save Excalidraw data:', error);
  //     }
  //   }
  // };

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
        <div className="flex-col w-full h-screen"
        >
          <div className="absolute top-0 right-0 bg-[#171c25] flex rounded-t-2xl justify-end"
          >
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
            <div className="w-[1100px] h-screen bg-[#171c25] p-12">
              <Excalidraw
                excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
                  setExcalidrawAPI(api);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
