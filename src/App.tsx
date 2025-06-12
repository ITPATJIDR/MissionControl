import { useState, useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { X } from "lucide-react";
import "./App.css";
import CollapseState from "./components/ui/collapse_state";
import TodoList from "./components/ui/todo_list";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number; // time in minutes
}

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [focusedTodo, setFocusedTodo] = useState<Todo | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);

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
    setIsCollapsed(!isCollapsed);
    setIsPaused(false); // Reset pause when returning to todo list
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

  const addTodo = (text: string) => {
    if (text.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        time: 25 // default 25 minutes
      };
      setTodos([...todos, newTodo]);
      setIsAddingTask(false);
    }
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const updateTodo = (id: number, newText: string, newTime?: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { 
        ...todo, 
        text: newText,
        ...(newTime !== undefined && { time: newTime })
      } : todo
    ));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="overflow-hidden h-screen w-screen">
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
        <div 
          className="absolute top-0 left-0 w-[320px] h-screen bg-[#171c25] rounded-xl overflow-hidden shadow-2xl"
          onMouseDown={handleDragStart}
        >
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleClose}
              onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close button
              className="p-2 hover:bg-gray-700 rounded-full transition-colors group"
              title="Close App"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </button>
          </div>

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
                  // Focus on the first incomplete todo
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
      )}
    </div>
  );
}

export default App;
