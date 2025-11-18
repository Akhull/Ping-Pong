// This file has been renamed and repurposed to WebSocketProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { PlayerID, GameState, ClientMessage, ServerMessage, ServerMessageType, ClientMessageType } from '../types';

const SERVER_URL = 'ws://34.141.85.123:8080';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  gameId: string | null;
  localPlayerId: PlayerID | null;
  gameState: GameState | null;
  winner: PlayerID | null;
  postGameChoice: 'menu' | 'endless' | null;
  disconnected: boolean;
  error: string | null;
  latency: number;
  createGame: () => void;
  joinGame: (id: string) => void;
  leaveGame: () => void;
  sendMessage: (message: ClientMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const socketRef = useRef<WebSocket | null>(null);
  // FIX: Changed NodeJS.Timeout to ReturnType<typeof setInterval> for browser compatibility.
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [gameId, setGameId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<PlayerID | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<PlayerID | null>(null);
  const [postGameChoice, setPostGameChoice] = useState<'menu' | 'endless' | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState(0);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    setError(null);

    const ws = new WebSocket(SERVER_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connection established');
      setConnectionStatus('connected');
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case ServerMessageType.GAME_CREATED:
          setGameId(message.payload.gameId);
          setLocalPlayerId('player1');
          break;
        case ServerMessageType.JOIN_SUCCESS:
          setGameId(message.payload.gameId);
          setLocalPlayerId(message.payload.localPlayerId);
          setError(null);
          break;
        case ServerMessageType.GAME_START:
          setGameState(prevState => prevState ? { ...prevState, isPaused: false } : null);
          break;
        case ServerMessageType.GAME_STATE_UPDATE:
          setGameState(message.payload);
          break;
        case ServerMessageType.GAME_OVER:
          setWinner(message.payload.winner);
          break;
        case ServerMessageType.PLAYER_DISCONNECTED:
          setDisconnected(true);
          setTimeout(leaveGame, 3000);
          break;
        case ServerMessageType.RESET_TO_MENU:
          leaveGame();
          break;
        case ServerMessageType.ERROR:
          setError(message.payload.message);
          break;
        case ServerMessageType.PING:
          setLatency(performance.now() - message.payload.timestamp);
          // FIX: Used ClientMessageType enum instead of a string literal for type safety.
          sendMessage({ type: ClientMessageType.PONG, payload: { timestamp: message.payload.timestamp } });
          break;
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection to the server failed.');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnectionStatus('disconnected');
      if (!reconnectIntervalRef.current) {
        reconnectIntervalRef.current = setInterval(() => {
            console.log('Attempting to reconnect...');
            connect();
        }, 3000);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);
    };
  }, [connect]);

  const createGame = useCallback(() => {
    // FIX: Used ClientMessageType enum instead of a string literal for type safety.
    sendMessage({ type: ClientMessageType.CREATE_GAME });
  }, [sendMessage]);

  const joinGame = useCallback((id: string) => {
    // FIX: Used ClientMessageType enum instead of a string literal for type safety.
    sendMessage({ type: ClientMessageType.JOIN_GAME, payload: { gameId: id } });
  }, [sendMessage]);

  const leaveGame = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // Optionally send a 'LEAVE_GAME' message if the server supports it
    }
    setGameId(null);
    setLocalPlayerId(null);
    setGameState(null);
    setWinner(null);
    setPostGameChoice(null);
    setDisconnected(false);
    setError(null);
  }, []);
  
  const value = {
    connectionStatus, gameId, localPlayerId, gameState,
    winner, postGameChoice, disconnected, error, latency,
    createGame, joinGame, leaveGame, sendMessage,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};