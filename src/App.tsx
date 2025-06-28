import "./App.css";
import CollapseState from "./components/ui/collapse_state";
import MainLayout from "./components/MainLayout";
import { useApp } from "./hooks/useApp";
import { formatTime } from "./utils/timeUtils";

function App() {
  const {
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
    saveStatus,
    
    // Computed values
    hasIncompleteTodos,
    
    // Handlers
    setCurrentProject,
    createProject,
    deleteProject,
    handleAddTodo,
    deleteTodo,
    toggleTodo,
    handleUpdateTodo,
    setIsAddingTask,
    setIsProjectSelectorOpen,
    handleCollapse,
    handleClose,
    handleFocusMode,
    handleHover,
    handleDragStart,
    setExcalidrawAPI,
    handleTimerAction
  } = useApp();

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
          onSkip={() => handleTimerAction('skip')}
          onPause={() => handleTimerAction('pause')}
          onDone={() => handleTimerAction('done')}
          isPaused={isPaused}
        />
      ) : (
        <MainLayout
          // Project props
          projects={projects}
          currentProject={currentProject}
          isProjectSelectorOpen={isProjectSelectorOpen}
          onProjectSelect={setCurrentProject}
          onProjectCreate={createProject}
          onProjectDelete={deleteProject}
          onProjectSelectorToggle={setIsProjectSelectorOpen}
          
          // Todo props
          todos={todos}
          isAddingTask={isAddingTask}
          hasIncompleteTodos={hasIncompleteTodos}
          onAddTodo={handleAddTodo}
          onDeleteTodo={deleteTodo}
          onToggleTodo={toggleTodo}
          onUpdateTodo={handleUpdateTodo}
          onSetIsAddingTask={setIsAddingTask}
          onFocus={handleFocusMode}
          
          // Excalidraw props
          onExcalidrawAPI={setExcalidrawAPI}
          saveStatus={saveStatus}
          
          // Window controls
          onClose={handleClose}
          onDragStart={handleDragStart}
        />
      )}
    </div>
  );
}

export default App;
