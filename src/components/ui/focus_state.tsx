import { motion } from "framer-motion";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number;
}

interface FocusStateProps {
  focusedTodo?: Todo | null;
  remainingTime?: string;
  isPaused?: boolean;
}

const FocusState = ({ focusedTodo, remainingTime, isPaused }: FocusStateProps) => {
  return (
    <motion.div
      key="default"
      className="flex w-[350px] items-center justify-between"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.1 }}
    >
      <div className="text-white truncate flex-1 mr-4">
        {focusedTodo ? focusedTodo.text : "No task selected"}
      </div>
      <div className="flex items-center gap-2">
        {isPaused && (
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        )}
        <div className="text-white font-bold">
          {remainingTime || "00:00"}
        </div>
      </div>
    </motion.div>
  );
};

export default FocusState;