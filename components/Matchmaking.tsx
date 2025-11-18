import React, { useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';
import { useWebSocket } from '../context/AblyProvider';
import BackgroundGame from './BackgroundGame';

interface MatchmakingProps {
  onInteraction: () => void;
}

const Matchmaking: React.FC<MatchmakingProps> = ({ onInteraction }) => {
  const { createGame, joinGame, gameId, localPlayerId, error, connectionStatus, leaveGame } = useWebSocket();
  const [joinIdInput, setJoinIdInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateGame = () => {
    onInteraction();
    createGame();
  };

  const handleJoinGame = async () => {
    if (joinIdInput) {
      onInteraction();
      joinGame(joinIdInput);
    }
  };
  
  // Host View: Waiting for P2
  if (gameId && localPlayerId === 'player1') {
    return (
      <>
        <BackgroundGame />
        <div
          className="relative flex flex-col items-center justify-center text-white p-8"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <div className="w-full max-w-md text-center bg-slate-900/80 backdrop-blur-lg border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 p-10">
            <h2 className="text-3xl font-bold mb-4">Game Hosted!</h2>
            <p className="text-lg mb-2">Share this code with a friend:</p>
            <div className="flex items-center justify-center bg-gray-900 p-3 rounded-lg border border-cyan-400">
                <span className="text-2xl font-mono text-yellow-300 mr-4">{gameId}</span>
                <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <p className="text-yellow-400 animate-pulse mt-8 text-xl">Waiting for Player 2...</p>
             <button
                onClick={leaveGame}
                className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
            >
                Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  // Client View: Joining game
  if (gameId && localPlayerId === 'player2') {
    return (
      <>
        <BackgroundGame />
        <div
          className="relative flex flex-col items-center justify-center text-white p-8"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <div className="w-full max-w-md text-center bg-slate-900/80 backdrop-blur-lg border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 p-10">
            <h2 className="text-3xl font-bold mb-4">Joining Game...</h2>
            <p className="text-yellow-400 animate-pulse mt-8 text-xl">Connecting to lobby: {gameId}</p>
             <button
                onClick={leaveGame}
                className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm"
            >
                Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  // Default View: Create or Join
  return (
    <>
      <BackgroundGame />
      <div
        className="relative flex flex-col items-center justify-center text-white p-8"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <div className="w-full max-w-xl text-center bg-slate-900/80 backdrop-blur-lg border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 p-10">
          <h1 className="text-6xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 text-transparent bg-clip-text leading-snug pb-2">
            Pong with Augments
          </h1>

          <div className="text-center mb-4 font-mono text-lg">
            {connectionStatus === 'connecting' && <p className="text-yellow-400 animate-pulse">Connecting to server...</p>}
            {connectionStatus === 'connected' && <p className="text-green-400">Connected to server!</p>}
            {connectionStatus === 'disconnected' && <p className="text-red-500">Disconnected. Reconnecting...</p>}
          </div>
          
          {/* Create Game Section */}
          <div className="mb-6">
              <p className="text-lg mb-4 text-gray-300">Start a new game and invite a friend.</p>
              <button
              onClick={handleCreateGame}
              disabled={connectionStatus !== 'connected'}
              className="w-full px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
              Host Game
              </button>
          </div>

          <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-600"/>
              <span className="px-4 text-gray-400 font-bold">OR</span>
              <hr className="flex-grow border-gray-600"/>
          </div>

          {/* Join Game Section */}
          <div>
              <p className="text-lg mb-4 text-gray-300">Enter a code to join a game.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                  <input
                      type="text"
                      value={joinIdInput}
                      onChange={(e) => setJoinIdInput(e.target.value.toUpperCase())}
                      placeholder="Enter Game Code"
                      className="flex-grow px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
                      maxLength={6}
                  />
                  <button
                      onClick={handleJoinGame}
                      disabled={!joinIdInput || connectionStatus !== 'connected'}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                      Join Game
                  </button>
              </div>
              {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Matchmaking;