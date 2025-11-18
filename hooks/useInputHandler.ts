// hooks/useInputHandler.ts: Manages all user keyboard inputs for paddle movement and ability activation.
import React, { useEffect, useRef } from 'react';
// FIX: Imported ClientMessageType to use enum members directly, fixing discriminated union issues.
import { PlayerID, ClientMessage, ClientMessageType } from '../types';
import * as C from '../constants';

interface UseInputHandlerProps {
  localPlayerId: PlayerID | null;
  sendMessage: (message: ClientMessage) => void;
  devAimbot: boolean;
}

export const useInputHandler = ({
  localPlayerId,
  sendMessage,
  devAimbot,
}: UseInputHandlerProps) => {
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastSentState = useRef({ y: 0, vy: 0 });

  // Keyboard event listeners for key presses and releases.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Handle ability activation (currently only Aimbot on Space bar).
      if (e.code === 'Space' && !e.repeat && localPlayerId) {
        e.preventDefault();

        // Dev Aimbot Toggle
        if (devAimbot) {
          sendMessage({ type: ClientMessageType.ACTIVATE_ABILITY, payload: { abilityId: 'aimbot', isDevToggle: true } });
          return;
        }

        // Production Aimbot Activation
        sendMessage({ type: ClientMessageType.ACTIVATE_ABILITY, payload: { abilityId: 'aimbot' } });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [localPlayerId, sendMessage, devAimbot]);


  return keysPressed;
};