import { SkipForward, Check, ListTodo, Pause, Play } from "lucide-react";

interface HoverButtonsProps {
  handleCollapse: () => void;
  onSkip: () => void;
  onPause: () => void;
  onDone: () => void;
  isPaused: boolean;
}

const HoverButtons = ({ handleCollapse, onSkip, onPause, onDone, isPaused }: HoverButtonsProps) => {
  const buttons = [
    { icon: <ListTodo className="w-4 h-4" />, label: "Todo" },
    { icon: <SkipForward className="w-4 h-4" />, label: "Skip" },
    { icon: isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />, label: isPaused ? "Resume" : "Pause" },
    { icon: <Check className="w-4 h-4" />, label: "Done" },
  ];

  const handleClick = (index: number) => {
    switch (index) {
      case 0:
        handleCollapse();
        break;
      case 1:
        onSkip();
        break;
      case 2:
        onPause();
        break;
      case 3:
        onDone();
        break;
      default:
        break;
    }
  }

  return (
    <div className="flex gap-2">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={() => handleClick(idx)}
          className="h-8 group flex items-center gap-2 px-3 py-2 border-[#171c25] border rounded-full text-white transition-all duration-300 hover:bg-green-400"
        >
          {btn.icon}
          <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 font-bold">
            {btn.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default HoverButtons;
