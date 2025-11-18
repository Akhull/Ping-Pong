// ====================================================================================
// WICHTIGER HINWEIS: DIES IST DER NODE.JS SERVER-CODE
// ====================================================================================
// Dieser Code ist für Ihren dedizierten Server bestimmt und NICHT Teil des React-Frontends.
// Speichern Sie diesen Inhalt als `server.mjs` (oder .js, passen Sie die Imports an) und führen Sie ihn auf Ihrem Server aus.
//
// So führen Sie den Server aus:
// 1. Stellen Sie sicher, dass Node.js auf Ihrem Server installiert ist.
// 2. Erstellen Sie ein neues Verzeichnis für den Server.
// 3. Kopieren Sie die Verzeichnisse `game/`, `data/` und `types.ts` aus Ihrem Frontend-Projekt in dieses neue Server-Verzeichnis.
// 4. Speichern Sie diesen Code als `server.mjs` im Stammverzeichnis des Server-Verzeichnisses.
// 5. Führen Sie im Terminal `npm install ws` oder `yarn add ws` aus, um die WebSocket-Bibliothek zu installieren.
// 6. Starten Sie den Server mit `node server.mjs`.
// ====================================================================================

import { WebSocketServer } from 'ws';
import { createInitialGameState, runHostGameStep } from '../game/engine.js';
import * as C from '../constants.js';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

const games = {}; // Speichert den Zustand aller laufenden Spiele
const clients = new Map(); // Speichert die WebSocket-Verbindung für jeden Client

console.log(`🚀 WebSocket Game Server started on port ${PORT}`);

// Startet die Game-Loop für ein bestimmtes Spiel
const startGameLoop = (gameId) => {
    const game = games[gameId];
    if (!game) return;

    game.loopInterval = setInterval(() => {
        const timestamp = performance.now();
        const deltaTime = (timestamp - game.lastUpdateTime) / 1000;
        game.lastUpdateTime = timestamp;
        
        // Führt einen Simulationsschritt auf dem Server aus
        runHostGameStep(game.state, 'update', {
            timestamp,
            deltaTime,
            localPlayerChoice: game.playerChoices.player1,
            opponentPlayerChoice: game.playerChoices.player2,
            allowedAugments: null, // Auf dem Server sind alle Augments erlaubt
            callbacks: {
                onAugmentSelection: () => broadcast(gameId, { type: 'GAME_STATE_UPDATE', payload: game.state.current }),
                onAugmentApplied: () => {
                    game.playerChoices.player1 = null;
                    game.playerChoices.player2 = null;
                    broadcast(gameId, { type: 'GAME_STATE_UPDATE', payload: game.state.current });
                },
                onGameOver: (winner) => {
                    broadcast(gameId, { type: 'GAME_OVER', payload: { winner } });
                    clearInterval(game.loopInterval);
                },
                onBallSpawned: () => broadcast(gameId, { type: 'GAME_STATE_UPDATE', payload: game.state.current }),
            },
        });

        // Sendet den neuen Zustand an alle Spieler in diesem Spiel
        broadcast(gameId, { type: 'GAME_STATE_UPDATE', payload: game.state.current });

    }, C.NETWORK_UPDATE_INTERVAL);
};

// Sendet eine Nachricht an alle Spieler in einem Spiel
const broadcast = (gameId, message) => {
    const game = games[gameId];
    if (!game) return;
    
    const messageString = JSON.stringify(message);
    
    for (const playerId in game.players) {
        const clientWs = game.players[playerId];
        if (clientWs && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(messageString);
        }
    }
};

const generateGameId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

wss.on('connection', (ws) => {
    const clientId = generateGameId(); // Eindeutige ID für diese Verbindung
    clients.set(ws, { clientId });
    console.log(`Client ${clientId} connected.`);

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('Invalid JSON received:', message);
            return;
        }

        const clientInfo = clients.get(ws);
        const { gameId, playerId } = clientInfo;
        const game = games[gameId];

        switch (data.type) {
            case 'CREATE_GAME': {
                const newGameId = generateGameId();
                clientInfo.gameId = newGameId;
                clientInfo.playerId = 'player1';

                const stateRef = { current: createInitialGameState() };
                
                games[newGameId] = {
                    players: { player1: ws },
                    state: stateRef,
                    playerChoices: { player1: null, player2: null },
                    lastUpdateTime: performance.now(),
                    loopInterval: null,
                };
                
                ws.send(JSON.stringify({ type: 'GAME_CREATED', payload: { gameId: newGameId } }));
                console.log(`Game ${newGameId} created by ${clientId}.`);
                break;
            }

            case 'JOIN_GAME': {
                const targetGameId = data.payload.gameId;
                const targetGame = games[targetGameId];
                if (targetGame && Object.keys(targetGame.players).length < 2) {
                    clientInfo.gameId = targetGameId;
                    clientInfo.playerId = 'player2';
                    targetGame.players.player2 = ws;

                    ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', payload: { gameId: targetGameId, localPlayerId: 'player2' } }));
                    
                    // Informiert beide Spieler, dass das Spiel beginnt
                    broadcast(targetGameId, { type: 'GAME_START' });
                    console.log(`Client ${clientId} joined game ${targetGameId}. Starting game.`);
                    
                    // Startet die Server-seitige Game-Loop
                    startGameLoop(targetGameId);

                } else {
                    ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Game not found or is full.' } }));
                }
                break;
            }
            
            case 'PADDLE_MOVE': {
                if (game && playerId) {
                     runHostGameStep(game.state, 'processClientInput', {
                        payload: { ...data.payload, playerId },
                     });
                }
                break;
            }

            case 'AUGMENT_CHOSEN': {
                if (game && playerId) {
                    game.playerChoices[playerId] = data.payload.augmentId;
                }
                break;
            }
            
            case 'REROLL_AUGMENT': {
                if (game && playerId) {
                    runHostGameStep(game.state, 'rerollAugment', {
                        payload: { ...data.payload, playerId },
                        callbacks: { onStateChanged: () => broadcast(gameId, { type: 'GAME_STATE_UPDATE', payload: game.state.current }) }
                    });
                }
                break;
            }

            // Weitere Event-Handler hier...
        }
    });

    ws.on('close', () => {
        const { gameId, clientId } = clients.get(ws) || {};
        console.log(`Client ${clientId} disconnected.`);
        if (gameId) {
            const game = games[gameId];
            if (game) {
                // Stoppt die Game-Loop und informiert den anderen Spieler
                clearInterval(game.loopInterval);
                broadcast(gameId, { type: 'PLAYER_DISCONNECTED' });
                // Löscht das Spiel
                delete games[gameId];
                console.log(`Game ${gameId} closed.`);
            }
        }
        clients.delete(ws);
    });
});

// Leere Export-Anweisung, um TypeScript-Fehler in der React-Umgebung zu vermeiden
export {};
