import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";

interface AddTaskButtonProps {
  onAddTodo: (text: string) => void;
  isAddingTask: boolean;
  setIsAddingTask: (value: boolean) => void;
}

const AddTaskButton = ({ onAddTodo, isAddingTask, setIsAddingTask }: AddTaskButtonProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAddTodo(inputValue);
      setInputValue("");
    } else {
      setIsAddingTask(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setInputValue("");
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      handleSubmit();
    } else {
      setIsAddingTask(false);
      setInputValue("");
    }
  };

  if (isAddingTask) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        placeholder="Enter task..."
        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
      />
    );
  }

  return (
    <button
      onClick={() => setIsAddingTask(true)}
      className="w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:text-white transition-all duration-200 flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add Task
    </button>
  );
};

export default AddTaskButton;
