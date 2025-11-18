import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
// FIX: The namespace import `* as firebase` is incorrect for Firebase v9+.
// Changed to import `initializeApp` and `FirebaseApp` directly from 'firebase/app' to resolve the errors.
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, onDisconnect, goOffline, goOnline, get, child, DatabaseReference, DataSnapshot, remove, off } from 'firebase/database';
// FIX: Replaced non-existent GameMessage with ClientMessage.
import { PlayerID, GameState, ClientMessage } from '../types';

interface FirebaseContextType {
  gameId: string | null;
  localPlayerId: PlayerID | null;
  presence: PlayerID[];
  createGame: () => void;
  joinGame: (id: string) => Promise<void>;
  leaveGame: () => void;
  isHost: boolean;
  publishMessage: (message: ClientMessage) => void;
  publishEvent: (message: ClientMessage) => void;
  setHostGameState: (gameState: GameState, timestamp?: number) => void;
  messagesRef: DatabaseReference | null;
  gameStateRef: DatabaseReference | null;
  eventsRef: DatabaseReference | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

const generateGameId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const firebaseConfig = {
  apiKey: "AIzaSyCVnc0KkzUCWiRhHTEHtQ9P7heh0907m2k",
  authDomain: "gen-lang-client-0332644847.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0332644847-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "gen-lang-client-0332644847",
  storageBucket: "gen-lang-client-0332644847.firebasestorage.app",
  messagingSenderId: "573803494162",
  appId: "1:573803494162:web:ebce121e614968e7ef11cb",
  measurementId: "G-PT34TDQTEX"
};

let firebaseApp: FirebaseApp;
try {
    firebaseApp = initializeApp(firebaseConfig);
} catch (e) {
    console.error("Error initializing Firebase:", e);
}


interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const db = useRef(firebaseApp ? getDatabase(firebaseApp) : null).current;
  const clientId = useRef(sessionStorage.getItem('clientId') || `client-${Math.random().toString(36).substring(2, 10)}`).current;
  sessionStorage.setItem('clientId', clientId);

  const [gameId, setGameId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<PlayerID | null>(null);
  const [presence, setPresence] = useState<PlayerID[]>([]);
  
  const presenceRef = useRef<DatabaseReference | null>(null);
  const gameRef = useRef<DatabaseReference | null>(null);

  useEffect(() => {
    if (!db) return;
    const connectedRef = ref(db, '.info/connected');
    const myConnectionsRef = ref(db, `connections/${clientId}`);

    const listener = onValue(connectedRef, (snap: DataSnapshot) => {
        if (snap.val() === true) {
            set(myConnectionsRef, true);
            onDisconnect(myConnectionsRef).remove();
        }
    });

    return () => {
        off(connectedRef, 'value', listener);
    };
  }, [db, clientId]);

  const setupGame = useCallback(async (newGameId: string, newPlayerId: PlayerID) => {
    if (!db) return;
    
    setGameId(newGameId);
    setLocalPlayerId(newPlayerId);

    gameRef.current = ref(db, `games/${newGameId}`);
    presenceRef.current = ref(db, `games/${newGameId}/presence/${clientId}`);

    await set(presenceRef.current, newPlayerId);
    onDisconnect(presenceRef.current).remove();

  }, [db, clientId]);

  useEffect(() => {
    if (!gameId || !db) {
        setPresence([]);
        return;
    };
    
    const allPresenceRef = ref(db, `games/${gameId}/presence`);
    const listener = onValue(allPresenceRef, (snapshot) => {
        const presenceData = snapshot.val() as { [clientId: string]: PlayerID } | null;
        const playerIds = presenceData ? Object.values(presenceData) : [];
        setPresence(playerIds);
    });

    return () => {
        off(allPresenceRef, 'value', listener);
    }

  }, [gameId, db]);


  const createGame = useCallback(() => {
    const newGameId = generateGameId();
    setupGame(newGameId, 'player1');
  }, [setupGame]);

  const joinGame = useCallback(async (id: string) => {
    if(!db) throw new Error("Database not connected");
    const gamePresenceRef = ref(db, `games/${id}/presence`);
    const snapshot = await get(gamePresenceRef);
    const players = snapshot.val();
    if (!players) {
        throw new Error("Game not found.");
    }
    if (Object.keys(players).length >= 2) {
        throw new Error("Game is full.");
    }
    await setupGame(id, 'player2');
  }, [db, setupGame]);

  const leaveGame = useCallback(async () => {
    if (presenceRef.current) {
        await remove(presenceRef.current);
        onDisconnect(presenceRef.current).cancel();
        presenceRef.current = null;
    }
    gameRef.current = null;
    setGameId(null);
    setLocalPlayerId(null);
    setPresence([]);
  }, []);

  const publishMessage = useCallback((message: ClientMessage) => {
      if (!gameId || !db) return;
      const messagesRef = ref(db, `games/${gameId}/messages`);
      push(messagesRef, message);
  }, [gameId, db]);
  
  const publishEvent = useCallback((message: ClientMessage) => {
    if (!gameId || !db) return;
    const eventsRef = ref(db, `games/${gameId}/events`);
    set(eventsRef, message); // Use set for single-value events
  }, [gameId, db]);

  const setHostGameState = useCallback((gameState: GameState, timestamp?: number) => {
      if (!gameId || !db || localPlayerId !== 'player1') return;
      const stateRef = ref(db, `games/${gameId}/state`);
      const stateWithTimestamp = { ...gameState, hostTimestamp: timestamp || performance.now() };
      // Sanitize the state to remove any non-JSON values like Infinity, which Firebase cannot store.
      const sanitizedState = JSON.parse(JSON.stringify(stateWithTimestamp));
      set(stateRef, sanitizedState);
  }, [gameId, db, localPlayerId]);

  const isHost = localPlayerId === 'player1';
  const messagesRef = gameId && db ? ref(db, `games/${gameId}/messages`) : null;
  const gameStateRef = gameId && db ? ref(db, `games/${gameId}/state`) : null;
  const eventsRef = gameId && db ? ref(db, `games/${gameId}/events`) : null;


  const value = {
    gameId,
    localPlayerId,
    presence,
    createGame,
    joinGame,
    leaveGame,
    isHost,
    publishMessage,
    publishEvent,
    setHostGameState,
    messagesRef,
    gameStateRef,
    eventsRef,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};