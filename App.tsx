import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Game, { GameApi } from './components/Game';
import GameOver from './components/GameOver';
import Matchmaking from './components/Matchmaking';
import AugmentSelection from './components/AugmentSelection';
import StatsDisplay from './components/StatsDisplay';
import DebugPanel from './components/DebugPanel';
import AugmentProgressBar from './components/AugmentProgressBar';
import DragonballTracker from './components/DragonballTracker';
// FIX: Imported ClientMessageType to use its enum members for type safety.
import { AugmentID, ClientMessageType } from './types';
import { useDebug } from './context/DebugProvider';
import { sounds } from './utils/audio';
import { useAudio } from './hooks/useAudio';
import { useWebSocket } from './context/AblyProvider';

export type Sounds = typeof sounds;

function App() {
  const gameApiRef = useRef<GameApi>(null);

  const {
    gameState,
    localPlayerId,
    winner,
    postGameChoice,
    disconnected,
    latency,
    sendMessage
  } = useWebSocket();
  
  const [ballSpeed, setBallSpeed] = useState(0);

  const { isDebugPanelVisible, setIsDebugPanelVisible } = useDebug();
  const { audioRef, handleInitAudio, handleSongEnd, VolumeControl } = useAudio();

  // Debug Panel Toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            setIsDebugPanelVisible(!isDebugPanelVisible);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDebugPanelVisible, setIsDebugPanelVisible]);

  // Listener for debug score manipulation (now sends a message to the server)
  useEffect(() => {
    const handleScoreManipulation = (e: Event) => {
      // This is a debug feature and would need a corresponding server-side message handler
      // if it were to be fully implemented in the new architecture.
      console.warn("Score manipulation event sent, but requires server-side implementation.");
    };
    window.addEventListener('manipulate-score', handleScoreManipulation as EventListener);
    return () => {
      window.removeEventListener('manipulate-score', handleScoreManipulation as EventListener);
    };
  }, [sendMessage]);

  const handleLocalAugmentSelect = (augmentId: AugmentID) => {
    // FIX: Used ClientMessageType enum instead of a string literal for type safety.
    sendMessage({ type: ClientMessageType.AUGMENT_CHOSEN, payload: { augmentId } });
  };
  
  const handleLocalReroll = (slotIndex: number) => {
    // FIX: Used ClientMessageType enum instead of a string literal for type safety.
    sendMessage({ type: ClientMessageType.REROLL_AUGMENT, payload: { slotIndex } });
  };

  const handleRequestMenu = () => {
    // FIX: Used ClientMessageType enum instead of a string literal for type safety.
    sendMessage({ type: ClientMessageType.POST_GAME_CHOICE, payload: { choice: 'menu' } });
  };
  
  const handleRequestEndless = () => {
    // FIX: Used ClientMessageType enum instead of a string literal for type safety.
    sendMessage({ type: ClientMessageType.POST_GAME_CHOICE, payload: { choice: 'endless' } });
  };

  let currentStage: 'matchmaking' | 'in-game' | 'augment-selection' | 'game-over' = 'matchmaking';
  if (winner) {
      currentStage = 'game-over';
  } else if (gameState?.isAugmentSelectionActive) {
      currentStage = 'augment-selection';
  } else if (gameState) {
      currentStage = 'in-game';
  }

  return (
    <div className="bg-gray-900 h-screen flex items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono">v4.0.0 (WebSocket Server)</div>
      <div className="absolute top-2 right-2 text-xs text-gray-500 font-mono">Latency: {latency}ms</div>
      <audio ref={audioRef} onEnded={handleSongEnd} />
      
      {isDebugPanelVisible && <DebugPanel />}
      {VolumeControl}

      <div className="flex flex-row items-stretch justify-center gap-8 w-full">
        <div className="w-64 flex">
           {gameState && <StatsDisplay playerState={gameState.players.player1} isAugmentSelectionActive={gameState.isAugmentSelectionActive} />}
        </div>
       
        <div className="flex flex-col shadow-2xl shadow-cyan-500/20">
          {gameState && (
            <div className="w-full flex justify-between items-center p-4 bg-gray-800/50 border-2 border-b-0 border-gray-700 rounded-t-lg">
                <span className="text-5xl font-bold font-mono text-cyan-400 w-24 text-center">{gameState.players.player1.score}</span>
                <div className="text-xl font-mono text-white">
                    Ball Speed: <span className="font-bold">{ballSpeed.toFixed(0)}</span>
                </div>
                <span className="text-5xl font-bold font-mono text-orange-400 w-24 text-center">{gameState.players.player2.score}</span>
            </div>
          )}

          <div className={`relative ${gameState ? 'border-x-2 border-gray-700' : 'border-2 border-gray-700 rounded-lg'} overflow-hidden`}>
            {currentStage === 'matchmaking' && <Matchmaking onInteraction={handleInitAudio} />}

            {gameState && (
              <>
                <Game
                  ref={gameApiRef}
                  gameState={gameState}
                  onBallSpeedChange={setBallSpeed}
                  sounds={sounds}
                  audioRef={audioRef}
                />
                
                {disconnected && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                        <h2 className="text-3xl font-bold text-red-500">Opponent Disconnected</h2>
                        <p className="text-xl mt-4 text-gray-300 animate-pulse">Returning to main menu...</p>
                    </div>
                )}

                {currentStage === 'augment-selection' && gameState.augmentSelectionData && localPlayerId && (
                  <div className="absolute inset-0 z-10">
                    <AugmentSelection
                      gameState={gameState}
                      augments={localPlayerId === 'player1' ? gameState.augmentSelectionData.player1Augments : gameState.augmentSelectionData.player2Augments}
                      onSelect={handleLocalAugmentSelect}
                      onReroll={handleLocalReroll}
                      sounds={sounds}
                    />
                  </div>
                )}

                {currentStage === 'game-over' && winner && (
                  <div className="absolute inset-0 z-10">
                    <GameOver 
                      winner={winner} 
                      onRequestMenu={handleRequestMenu}
                      onRequestEndless={handleRequestEndless}
                      localChoice={postGameChoice}
                      onInteraction={handleInitAudio} 
                    />
                  </div>
                )}
              </>
            )}
          </div>
          
          {gameState && (
            <div className="w-full flex flex-row items-center justify-between p-4 bg-gray-800/50 border-2 border-t-0 border-gray-700 rounded-b-lg gap-4">
                <div className="w-64 flex-shrink-0">
                    <DragonballTracker playerState={gameState.players.player1} />
                </div>
                <div className="flex-shrink-0">
                    <AugmentProgressBar 
                        currentPoints={gameState.pointsSinceLastAugment}
                        neededPoints={gameState.pointsNeededForNextAugment}
                    />
                </div>
                <div className="w-64 flex-shrink-0">
                    <DragonballTracker playerState={gameState.players.player2} />
                </div>
            </div>
          )}
        </div>

         <div className="w-64 flex">
           {gameState && <StatsDisplay playerState={gameState.players.player2} isAugmentSelectionActive={gameState.isAugmentSelectionActive} />}
        </div>
      </div>
    </div>
  );
}

export default App;