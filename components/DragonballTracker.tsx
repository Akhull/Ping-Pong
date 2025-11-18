import React, { useMemo } from 'react';
import { PlayerState } from '../types';
import { DRAGONBALL_PIECES } from '../data/augments';

interface DragonballTrackerProps {
  playerState: PlayerState;
}

const Dragonball: React.FC<{ collected: boolean; starCount: number }> = ({ collected, starCount }) => {
  const baseClasses = "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 transform font-mono";
  const collectedClasses = "bg-orange-500 shadow-[0_0_8px_2px_rgba(251,146,60,0.7)] animate-pulse border-2 border-orange-300";
  const uncollectedClasses = "bg-gray-800 border-2 border-gray-600 scale-90 opacity-60";

  const starBaseClasses = "font-bold text-base leading-none";
  const collectedStarClasses = "text-red-700";
  const uncollectedStarClasses = "text-gray-500";
  
  return (
    <div className={`${baseClasses} ${collected ? collectedClasses : uncollectedClasses}`}>
      <span className={`${starBaseClasses} ${collected ? collectedStarClasses : uncollectedStarClasses}`}>
        {starCount}
      </span>
    </div>
  );
};


const DragonballTracker: React.FC<DragonballTrackerProps> = ({ playerState }) => {
  const collectedDragonballs = useMemo(() => {
    return new Set(
      playerState.activeAugments
        .filter(aug => DRAGONBALL_PIECES.includes(aug.id))
        .map(aug => aug.id)
    );
  }, [playerState.activeAugments]);

  // Don't render the component if the player hasn't collected any dragonballs yet.
  if (collectedDragonballs.size === 0) {
    return <div className="w-full h-14"></div>; // Return an empty div to maintain layout spacing
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-lg p-2 text-white text-center shadow-lg w-full h-14 flex flex-col justify-center">
      <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1" style={{fontSize: '0.6rem'}}>Dragonballs</p>
      <div className="flex justify-center items-center gap-1.5">
        {DRAGONBALL_PIECES.map((dbId, index) => {
          const starCount = index + 1;
          const isCollected = collectedDragonballs.has(dbId);
          return <Dragonball key={dbId} collected={isCollected} starCount={starCount} />;
        })}
      </div>
    </div>
  );
};

export default DragonballTracker;
