
import React from 'react';
import { PlayerID } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';

interface GameOverProps {
  winner: PlayerID;
  onRequestMenu: () => void;
  onRequestEndless: () => void;
  localChoice: 'menu' | 'endless' | null;
  onInteraction: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ winner, onRequestMenu, onRequestEndless, localChoice, onInteraction }) => {
  const winnerName = winner === 'player1' ? 'Player 1' : 'Player 2';
  const hasMadeChoice = localChoice !== null;

  const handleRequestMenu = () => {
    if (hasMadeChoice) return;
    onInteraction();
    onRequestMenu();
  };
  
  const handleRequestEndless = () => {
    if (hasMadeChoice) return;
    onInteraction();
    onRequestEndless();
  };

  const buttonBaseClasses = "px-8 py-3 font-bold rounded-lg shadow-lg transition-all transform focus:outline-none disabled:cursor-not-allowed";
  const menuButtonClasses = `bg-gray-600 hover:bg-gray-500 text-white focus:ring-2 focus:ring-gray-400 disabled:bg-gray-700/50 disabled:text-gray-400 ${localChoice === 'menu' ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-yellow-400' : ''}`;
  const endlessButtonClasses = `bg-cyan-500 hover:bg-cyan-400 text-gray-900 focus:ring-2 focus:ring-cyan-300 disabled:bg-cyan-800/50 disabled:text-cyan-300/60 ${localChoice === 'endless' ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-yellow-400' : ''}`;


  return (
    <div
      className="flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 text-white p-8 backdrop-blur-sm"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
      <h2 className="text-5xl font-extrabold mb-2 text-yellow-300">Game Over</h2>
      <p className="text-3xl mb-6">
        <span className={`font-bold ${winner === 'player1' ? 'text-cyan-400' : 'text-orange-400'}`}>{winnerName}</span> Wins!
      </p>
      
       {hasMadeChoice ? (
            <p className="text-xl text-yellow-400 animate-pulse mt-4">Waiting for opponent...</p>
        ) : (
            <p className="text-xl mt-4">What's next?</p>
        )}

      <div className="flex gap-6 mt-6">
         <button
            onClick={handleRequestMenu}
            disabled={hasMadeChoice}
            className={`${buttonBaseClasses} ${menuButtonClasses}`}
          >
            Back to Main Menu
          </button>
          <button
            onClick={handleRequestEndless}
            disabled={hasMadeChoice}
            className={`${buttonBaseClasses} ${endlessButtonClasses}`}
          >
            Endless Mode
          </button>
      </div>
    </div>
  );
};

export default GameOver;