// hooks/useGameRenderLoop.ts: The main driver for the game's client-side animation and logic loop.
import React, { useEffect, useRef, useCallback } from 'react';
// FIX: Imported ClientMessageType to use its enum members for type safety.
import { GameState, PlayerID, PlayerState, ClientMessageType } from '../types';
import * as C from '../constants';
import { Sounds } from '../App';
import { deepCopy } from '../utils/helpers';
import { draw } from '../game/rendering';
import { handleAudioVisualEvents, updateParticles, updateFloatingTexts, updateVisualEffects } from '../game/effects';
import { Particle, ExplosionCore } from '../game/effects/utils';
import { updateClientState, interpolatePaddles } from '../game/client';
import { triggerGoalEffects } from '../game/effects/score';
import { useWebSocket } from '../context/AblyProvider';

interface UseGameRenderLoopProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  visualStateRef: React.RefObject<GameState>; // The mutable ref for the render loop (visual/predicted state)
  localPlayerId: PlayerID | null;
  onBallSpeedChange: (speed: number) => void;
  sounds: Sounds;
  audioRef: React.RefObject<HTMLAudioElement>;
  keysPressed: React.RefObject<{ [key: string]: boolean }>;
  authoritativeGameState: GameState;
  latency: number;
}

export const useGameRenderLoop = ({
  canvasRef,
  visualStateRef,
  localPlayerId,
  onBallSpeedChange,
  sounds,
  audioRef,
  keysPressed,
  authoritativeGameState,
  latency,
}: UseGameRenderLoopProps) => {
  const lastTimestampRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const explosionCoresRef = useRef<ExplosionCore[]>([]);
  const prevStateRef = useRef<GameState | null>(null);
  const pendingGoalRef = useRef<{ scorerId: PlayerID; goalY: number; speedOnScore: number; timestamp: number; score: number } | null>(null);
  const { sendMessage } = useWebSocket();
  const lastSentState = useRef({ y: 0, vy: 0 });


  // Handles time-warp effects and adjusts audio playback speed accordingly.
  const updateTimeScaleAndAudio = useCallback((timestamp: number): number => {
    if (!visualStateRef.current) return 1.0;
    const { timeWarp } = visualStateRef.current;
    const audioEl = audioRef.current;
    
    // Convert server timestamp to local time for animation
    const serverToLocalOffset = latency; 
    const localStartTime = timeWarp.startTime - serverToLocalOffset;

    if (!timeWarp.isActive) {
        if (audioEl && audioEl.playbackRate !== 1.0) audioEl.playbackRate = 1.0;
        return 1.0;
    }
    
    const elapsed = timestamp - localStartTime;
    let timeScale = 1.0;

    if (elapsed < timeWarp.rampDownDuration) {
        timeScale = 1.0 - (1.0 - timeWarp.minTimeScale) * (elapsed / timeWarp.rampDownDuration);
    } else if (elapsed < timeWarp.rampDownDuration + timeWarp.holdDuration) {
        timeScale = timeWarp.minTimeScale;
    } else if (elapsed < timeWarp.duration) {
        const rampUpElapsed = elapsed - (timeWarp.rampDownDuration + timeWarp.holdDuration);
        timeScale = timeWarp.minTimeScale + (1.0 - timeWarp.minTimeScale) * (rampUpElapsed / timeWarp.rampUpDuration);
    } else {
        timeWarp.isActive = false;
        timeScale = 1.0;
    }

    if (audioEl) audioEl.playbackRate = Math.max(0.5, timeScale);
    return timeScale;
  }, [visualStateRef, audioRef, latency]);

  // Updates the local player's paddle position based on keyboard input.
  const updateLocalPlayerPaddle = useCallback((deltaTime: number) => {
    if (!localPlayerId || !keysPressed.current || !visualStateRef.current) return;
    const player = visualStateRef.current.players[localPlayerId];

    if (player.isAimbotActive) {
        const newY = visualStateRef.current.ball.y - player.paddle.height / 2;
        player.paddle.y = Math.max(0, Math.min(newY, C.CANVAS_HEIGHT - player.paddle.height));
        player.paddle.vy = 0; // Aimbot overrides velocity
        return;
    }
    
    if (player.isStunned) {
        player.paddle.vy = 0;
        return;
    }
    
    let moveDirection = 0;
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveDirection = -1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveDirection = 1;
    if (player.areControlsInverted) moveDirection *= -1;

    const currentVy = moveDirection * player.stats.moveSpeed;
    player.paddle.vy = currentVy;

    if (moveDirection !== 0) {
        const newY = player.paddle.y + currentVy * deltaTime;
        const h = player.paddle.height;
        if (player.isMultiCloneActive) {
            const g = C.MULTI_CLONE_GAP, topBound = h + g, bottomBound = C.CANVAS_HEIGHT - (h * 2 + g);
            player.paddle.y = Math.max(topBound, Math.min(newY, bottomBound));
        } else {
            player.paddle.y = Math.max(0, Math.min(newY, C.CANVAS_HEIGHT - h));
        }
    }
  }, [localPlayerId, keysPressed, visualStateRef]);


  // Main game loop, powered by requestAnimationFrame.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext('2d');
    if (!context) return;
    let animationFrameId: number;

    const networkUpdateInterval = setInterval(() => {
        if (localPlayerId && visualStateRef.current) {
            const player = visualStateRef.current.players[localPlayerId];
            const hasMoved = Math.abs(player.paddle.y - lastSentState.current.y) > 0.1;
            const hasChangedVelocity = player.paddle.vy !== lastSentState.current.vy;

            if (hasMoved || hasChangedVelocity) {
                 // FIX: Used ClientMessageType enum instead of a string literal for type safety.
                 sendMessage({
                    type: ClientMessageType.PADDLE_MOVE,
                    payload: {
                    y: player.paddle.y,
                    vy: player.paddle.vy,
                    clientTimestamp: performance.now(),
                    },
                });
                lastSentState.current = { y: player.paddle.y, vy: player.paddle.vy };
            }
        }
    }, C.NETWORK_UPDATE_INTERVAL);

    const gameLoop = (timestamp: number) => {
      if (!visualStateRef.current) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      const gs = visualStateRef.current;
      const timeScale = updateTimeScaleAndAudio(timestamp);
      
      onBallSpeedChange(Math.sqrt(gs.ball.vx ** 2 + gs.ball.vy ** 2) * 10);

      if (lastTimestampRef.current === 0) lastTimestampRef.current = timestamp;
      const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
      const effectiveDeltaTime = deltaTime * timeScale;
      lastTimestampRef.current = timestamp;

      // 1. Handle local input and smooth remote entities (always, even when paused).
      if (localPlayerId) {
          updateLocalPlayerPaddle(effectiveDeltaTime);
          interpolatePaddles(visualStateRef, localPlayerId, effectiveDeltaTime);
      }

      // 2. Client runs predictive physics.
      if (!gs.isPaused) {
        // FIX: Pass the authoritative state directly, as expected by the updated function signature.
        updateClientState(visualStateRef, localPlayerId, effectiveDeltaTime, authoritativeGameState);
      }

      // 3. Update visual effects (particles, etc.).
      updateParticles(particlesRef, effectiveDeltaTime);
      updateFloatingTexts(gs, effectiveDeltaTime);
      updateVisualEffects(gs, effectiveDeltaTime);
      
      // 4. Check for confirmed goals from the server to animate them.
      if (pendingGoalRef.current) {
          const PENDING_GOAL_CONFIRM_MS = 200;
          if (timestamp - pendingGoalRef.current.timestamp > PENDING_GOAL_CONFIRM_MS) {
              const scorer = pendingGoalRef.current.scorerId;
              const expectedScore = pendingGoalRef.current.score;
              if (gs.players[scorer].score === expectedScore) {
                  triggerGoalEffects(
                      pendingGoalRef.current.scorerId, pendingGoalRef.current.goalY,
                      pendingGoalRef.current.speedOnScore, sounds, particlesRef, explosionCoresRef
                  );
              }
              pendingGoalRef.current = null;
          }
      }

      // 5. Detect state changes to trigger one-off audio/visual events.
      handleAudioVisualEvents(gs, prevStateRef, sounds, particlesRef, explosionCoresRef, false, pendingGoalRef);
      
      // 6. Render the final state to the canvas.
      draw(context, gs, particlesRef.current, explosionCoresRef.current, timestamp, latency, localPlayerId);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(networkUpdateInterval);
    }
  }, [
    onBallSpeedChange, localPlayerId, latency, sounds, keysPressed, 
    updateLocalPlayerPaddle, updateTimeScaleAndAudio, audioRef, 
    canvasRef, visualStateRef, authoritativeGameState, sendMessage
  ]);
};