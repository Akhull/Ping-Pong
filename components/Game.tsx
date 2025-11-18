import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { PlayerID, AugmentID, GameState } from '../types';
import * as C from '../constants';
import { useWebSocket } from '../context/AblyProvider';
import { useDebug } from '../context/DebugProvider';
import { Sounds } from '../App';
import { useInputHandler } from '../hooks/useInputHandler';
import { useGameRenderLoop } from '../hooks/useGameRenderLoop';

export interface GameApi {
  // The Game component is now a "dumb" client. Server is the source of truth.
  // Direct manipulation from the client is no longer possible.
  // Debug functionality would require specific server-side messages.
}

interface GameProps {
  gameState: GameState;
  onBallSpeedChange: (speed: number) => void;
  sounds: Sounds;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const Game = forwardRef<GameApi, GameProps>(({ gameState, onBallSpeedChange, sounds, audioRef }, ref) => {
  const { localPlayerId, latency, sendMessage } = useWebSocket();
  const { devAimbot } = useDebug();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // This ref holds the VISUAL state, which includes client-side prediction and interpolation.
  // It's constantly updated by the render loop.
  const visualStateRef = useRef<GameState>(gameState);

  // When a new authoritative state comes from the server, update our visual state.
  useEffect(() => {
    visualStateRef.current = gameState;
  }, [gameState]);


  const keysPressed = useInputHandler({
    localPlayerId,
    sendMessage,
    devAimbot
  });

  useGameRenderLoop({
    canvasRef,
    visualStateRef, // The mutable ref for the render loop
    localPlayerId,
    onBallSpeedChange,
    sounds,
    audioRef,
    keysPressed,
    authoritativeGameState: gameState, // The latest state from the server for reconciliation
    latency,
  });

  useImperativeHandle(ref, () => ({
      // Client-side manipulations are no longer part of the architecture.
  }));

  return (
    <canvas
      ref={canvasRef}
      width={C.CANVAS_WIDTH}
      height={C.CANVAS_HEIGHT}
      className="bg-slate-900"
    />
  );
});

export default Game;