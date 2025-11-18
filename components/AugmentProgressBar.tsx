import React from 'react';

interface AugmentProgressBarProps {
  currentPoints: number;
  neededPoints: number;
}

const AugmentProgressBar: React.FC<AugmentProgressBarProps> = ({ currentPoints, neededPoints }) => {
  // Prevent division by zero if neededPoints isn't loaded yet.
  const progressPercentage = neededPoints > 0 ? (currentPoints / neededPoints) * 100 : 0;

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-lg px-6 py-3 text-white text-center shadow-lg w-72">
      <p className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-2">Next Augment Selection</p>
      <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden border-2 border-gray-600 relative">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-shadow">
          {currentPoints} / {neededPoints} Points
        </span>
      </div>
    </div>
  );
};

export default AugmentProgressBar;