import { useState } from "react";
import { Check, Edit, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number;
}

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onUpdate: (id: number, newText: string, newTime?: number) => void;
}

const TodoItem = ({ todo, onDelete, onToggle, onUpdate }: TodoItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editTime, setEditTime] = useState(todo.time.toString());

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(todo.text);
  };

  const handleEditTime = () => {
    setIsEditingTime(true);
    setEditTime(todo.time.toString());
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdate(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleSaveTimeEdit = () => {
    const newTime = parseInt(editTime);
    if (!isNaN(newTime) && newTime > 0) {
      onUpdate(todo.id, todo.text, newTime);
    }
    setIsEditingTime(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(todo.text);
    }
  };

  const handleTimeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTimeEdit();
    } else if (e.key === 'Escape') {
      setIsEditingTime(false);
      setEditTime(todo.time.toString());
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSaveEdit}
          className="w-full bg-transparent text-white focus:outline-none"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className="relative p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggle(todo.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              todo.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-400 hover:border-green-400'
            }`}
          >
            {todo.completed && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className={`text-white flex-1 ${todo.completed ? 'line-through opacity-60' : ''}`}>
            {todo.text}
          </span>
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="flex gap-1"
            >
              <button
                onClick={handleEdit}
                className="p-1 hover:bg-blue-500 rounded transition-colors"
                title="Edit"
              >
                <Edit className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="p-1 hover:bg-red-500 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div></div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-gray-400" />
          {isEditingTime ? (
            <input
              type="number"
              min="1"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              onKeyDown={handleTimeKeyPress}
              onBlur={handleSaveTimeEdit}
              className="w-12 bg-transparent text-white text-sm focus:outline-none border-b border-gray-400"
              autoFocus
            />
          ) : (
            <button
              onClick={handleEditTime}
              className="text-white text-sm hover:text-blue-400 transition-colors"
            >
              {todo.time}min
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
