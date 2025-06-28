import React from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { SaveStatus } from "../types";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawCanvasProps {
  onExcalidrawAPI: (api: ExcalidrawImperativeAPI) => void;
  saveStatus: SaveStatus;
}

const ExcalidrawCanvas: React.FC<ExcalidrawCanvasProps> = ({
  onExcalidrawAPI,
  saveStatus
}) => {
  return (
    <div className="w-[1100px] h-screen bg-[#171c25] p-12 relative">
      <Excalidraw
        excalidrawAPI={onExcalidrawAPI}
      />
      
      {/* Save Status Indicator - Subtle text only in bottom right */}
      {saveStatus !== 'idle' && (
        <div 
          className={`fixed bottom-2 right-2 px-3 py-1 rounded text-sm font-medium transition-all duration-300 z-50 ${
            saveStatus === 'saving' 
              ? 'text-blue-400' 
              : saveStatus === 'success' 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}
          style={{ 
            opacity: 0.7,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'success' && 'Saved'}
          {saveStatus === 'error' && 'Save Failed'}
        </div>
      )}
    </div>
  );
};

export default ExcalidrawCanvas; 