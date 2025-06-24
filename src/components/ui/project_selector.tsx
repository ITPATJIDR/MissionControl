import { useState } from "react";
import { ChevronDown, Plus, Trash2, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onProjectCreate: (name: string, description?: string) => Promise<Project>;
  onProjectDelete: (projectId: number) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
}

const ProjectSelector = ({
  projects,
  currentProject,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
  isOpen,
  onToggle
}: ProjectSelectorProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await onProjectCreate(newProjectName.trim(), newProjectDescription.trim() || undefined);
        setNewProjectName("");
        setNewProjectDescription("");
        setIsCreating(false);
      } catch (error) {
        // Error handled by parent component
      }
    }
  };

  const handleDeleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      return; // Don't delete the last project
    }
    
    if (confirm("Are you sure you want to delete this project? All tasks and canvas data will be lost.")) {
      try {
        await onProjectDelete(projectId);
      } catch (error) {
        // Error handled by parent component
      }
    }
  };

  return (
    <div className="relative">
      {/* Project Selector Button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm font-medium">
            {currentProject?.name || "Select Project"}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
          >
            {/* Project List */}
            <div className="p-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    currentProject?.id === project.id 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                  onClick={() => {
                    onProjectSelect(project);
                    onToggle();
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-xs opacity-75">{project.description}</div>
                    )}
                  </div>
                  {projects.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create New Project */}
            <div className="border-t border-gray-600 p-2">
              {isCreating ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateProject}
                      className="flex-1 p-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors"
                      disabled={!newProjectName.trim()}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewProjectName("");
                        setNewProjectDescription("");
                      }}
                      className="flex-1 p-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 w-full p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Project</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectSelector; 