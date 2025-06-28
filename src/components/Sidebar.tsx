import React from "react";
import { Project, Todo } from "../types";
import ProjectSelector from "./ui/project_selector";
import TodoList from "./ui/todo_list";

interface SidebarProps {
  projects: Project[];
  currentProject: Project | null;
  todos: Todo[];
  isProjectSelectorOpen: boolean;
  isAddingTask: boolean;
  hasIncompleteTodos: boolean;
  onProjectSelect: (project: Project) => void;
  onProjectCreate: (name: string, description?: string) => Promise<Project>;
  onProjectDelete: (projectId: number) => Promise<void>;
  onProjectSelectorToggle: () => void;
  onAddTodo: (text: string) => void;
  onDeleteTodo: (id: number) => void;
  onToggleTodo: (id: number) => void;
  onUpdateTodo: (id: number, newText: string, newTime?: number) => void;
  onSetIsAddingTask: (isAdding: boolean) => void;
  onFocus: () => void;
  onDragStart: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  currentProject,
  todos,
  isProjectSelectorOpen,
  isAddingTask,
  hasIncompleteTodos,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
  onProjectSelectorToggle,
  onAddTodo,
  onDeleteTodo,
  onToggleTodo,
  onUpdateTodo,
  onSetIsAddingTask,
  onFocus,
  onDragStart
}) => {
  return (
    <div
      className="w-[300px] h-screen bg-[#171c25] overflow-hidden shadow-2xl flex flex-col"
      onMouseDown={onDragStart}
    >
      <div className="p-6 h-full overflow-y-auto flex flex-col">
        {/* Project Selector */}
        <div className="mb-4">
          <ProjectSelector
            projects={projects}
            currentProject={currentProject}
            onProjectSelect={onProjectSelect}
            onProjectCreate={onProjectCreate}
            onProjectDelete={onProjectDelete}
            isOpen={isProjectSelectorOpen}
            onToggle={onProjectSelectorToggle}
          />
        </div>

        <div className="flex-1">
          <TodoList
            todos={todos}
            onAddTodo={onAddTodo}
            onDeleteTodo={onDeleteTodo}
            onToggleTodo={onToggleTodo}
            onUpdateTodo={onUpdateTodo}
            isAddingTask={isAddingTask}
            setIsAddingTask={onSetIsAddingTask}
          />
        </div>

        {/* Focus Button */}
        <div className="mt-4">
          <button
            onClick={onFocus}
            disabled={!hasIncompleteTodos}
            className="w-full p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
          >
            Focus
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 