import { AnimatePresence } from "framer-motion";
import HoverState from "./hover_state";
import FocusState from "./focus_state";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  time: number;
}

interface CollapseStateProps {
  handleDragStart: () => void;
  handleCollapse: () => void;
  isHovered: boolean;
  handleHover: (state: boolean) => void;
  focusedTodo?: Todo | null;
  remainingTime?: string;
  onSkip: () => void;
  onPause: () => void;
  onDone: () => void;
  isPaused: boolean;
}

const CollapseState = ({
  handleDragStart, 
  handleCollapse, 
  isHovered, 
  handleHover,
  focusedTodo,
  remainingTime,
  onSkip,
  onPause,
  onDone,
  isPaused
}: CollapseStateProps) => {
  return (
        <div
          className="flex items-center bg-[#171c25] justify-between p-4 rounded-xl transition-all duration-300 h-14 w-[380px]"
          onMouseDown={handleDragStart}
          onMouseEnter={() => handleHover(true)}
          onMouseLeave={() => handleHover(false)}
        >
          <AnimatePresence mode="wait">
              <div>
                {isHovered
            ? <HoverState 
                handleCollapse={handleCollapse} 
                onSkip={onSkip}
                onPause={onPause}
                onDone={onDone}
                isPaused={isPaused}
              />
            : <FocusState focusedTodo={focusedTodo} remainingTime={remainingTime} isPaused={isPaused} />
                }
              </div>
          </AnimatePresence>
        </div>
  );
};

export default CollapseState;