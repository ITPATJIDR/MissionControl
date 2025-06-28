import React from "react";
import { X } from "lucide-react";
import { Project, Todo } from "../types";
import Sidebar from "./Sidebar";
import ExcalidrawCanvas from "./ExcalidrawCanvas";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { SaveStatus } from "../types";

interface MainLayoutProps {
  // Project props
  projects: Project[];
  currentProject: Project | null;
  isProjectSelectorOpen: boolean;
  onProjectSelect: (project: Project) => void;
  onProjectCreate: (name: string, description?: string) => Promise<Project>;
  onProjectDelete: (projectId: number) => Promise<void>;
  onProjectSelectorToggle: () => void;
  
  // Todo props
  todos: Todo[];
  isAddingTask: boolean;
  hasIncompleteTodos: boolean;
  onAddTodo: (text: string) => void;
  onDeleteTodo: (id: number) => void;
  onToggleTodo: (id: number) => void;
  onUpdateTodo: (id: number, newText: string, newTime?: number) => void;
  onSetIsAddingTask: (isAdding: boolean) => void;
  onFocus: () => void;
  
  // Excalidraw props
  onExcalidrawAPI: (api: ExcalidrawImperativeAPI) => void;
  saveStatus: SaveStatus;
  
  // Window controls
  onClose: () => void;
  onDragStart: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  projects,
  currentProject,
  isProjectSelectorOpen,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
  onProjectSelectorToggle,
  todos,
  isAddingTask,
  hasIncompleteTodos,
  onAddTodo,
  onDeleteTodo,
  onToggleTodo,
  onUpdateTodo,
  onSetIsAddingTask,
  onFocus,
  onExcalidrawAPI,
  saveStatus,
  onClose,
  onDragStart
}) => {
  return (
    <div className="flex-col w-full h-screen">
      {/* Close Button */}
      <div className="absolute top-0 right-0 bg-[#171c25] flex rounded-t-2xl justify-end z-50">
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors group"
          title="Close App"
        >
          <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
        </button>
      </div>
      
      <div className="flex w-full h-screen">
        <Sidebar
          projects={projects}
          currentProject={currentProject}
          todos={todos}
          isProjectSelectorOpen={isProjectSelectorOpen}
          isAddingTask={isAddingTask}
          hasIncompleteTodos={hasIncompleteTodos}
          onProjectSelect={onProjectSelect}
          onProjectCreate={onProjectCreate}
          onProjectDelete={onProjectDelete}
          onProjectSelectorToggle={onProjectSelectorToggle}
          onAddTodo={onAddTodo}
          onDeleteTodo={onDeleteTodo}
          onToggleTodo={onToggleTodo}
          onUpdateTodo={onUpdateTodo}
          onSetIsAddingTask={onSetIsAddingTask}
          onFocus={onFocus}
          onDragStart={onDragStart}
        />
        
        <ExcalidrawCanvas
          onExcalidrawAPI={onExcalidrawAPI}
          saveStatus={saveStatus}
        />
      </div>
    </div>
  );
};

export default MainLayout; 