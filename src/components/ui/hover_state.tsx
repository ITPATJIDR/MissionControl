import HoverButtons from "./hover_button";
import { motion} from 'framer-motion';

interface HoverStateProps {
  handleCollapse: () => void;
  onSkip: () => void;
  onPause: () => void;
  onDone: () => void;
  isPaused: boolean;
}

const HoverState = ({ handleCollapse, onSkip, onPause, onDone, isPaused }: HoverStateProps) => {
  return (
          <motion.div
            key="hovered"
            className="flex w-screen justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
          >
      <HoverButtons 
        handleCollapse={handleCollapse}
        onSkip={onSkip}
        onPause={onPause}
        onDone={onDone}
        isPaused={isPaused}
      />
          </motion.div>
  );
};

export default HoverState;