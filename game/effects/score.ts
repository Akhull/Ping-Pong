import React from 'react';
import { GameState, PlayerID } from '../../types';
import { Sounds } from '../../App';
import * as C from '../../constants';
import { Particle, ExplosionCore, createGoalExplosionParticles, createGoalFountains } from './utils';

/**
 * Triggers all visual and audio effects for a confirmed goal.
 * This is called by the game loop AFTER the confirmation delay has passed.
 */
export const triggerGoalEffects = (
    scorerId: PlayerID,
    goalY: number,
    speedOnScore: number,
    sounds: Sounds,
    particlesRef: React.MutableRefObject<Particle[]>,
    explosionCoresRef: React.MutableRefObject<ExplosionCore[]>
) => {
    const goalX = scorerId === 'player1' ? C.CANVAS_WIDTH : 0;
    createGoalExplosionParticles(particlesRef, goalX, goalY, scorerId, 100, speedOnScore);
    explosionCoresRef.current.push({
        id: performance.now(),
        x: goalX,
        y: goalY,
        life: 0.8,
        startTime: performance.now(),
        maxRadius: 70 + speedOnScore * 4,
        rotation: Math.random() * Math.PI * 2,
        scorerId: scorerId
    });
    createGoalFountains(particlesRef, scorerId);
    sounds.explosion();
    sounds.score(); // Also trigger score sound effect
};

/**
 * Detects score changes and other UI events by comparing the current and previous game states.
 * Instead of triggering effects immediately, it queues a "pending goal" to be confirmed
 * by the main game loop, preventing false celebrations for goals that get reverted by the rewind system.
 */
export const handleScoreAndCountdownEvents = (
    gs: GameState, 
    prevState: GameState,
    sounds: Sounds, 
    particlesRef: React.MutableRefObject<Particle[]>, 
    explosionCoresRef: React.MutableRefObject<ExplosionCore[]>,
    isHost: boolean,
    pendingGoalRef: React.MutableRefObject<{ scorerId: PlayerID; goalY: number; speedOnScore: number; timestamp: number; score: number } | null>
) => {
    const { players: prevPlayers, ball: prevBall, countdown: prevCountdown, ballSpawn: prevBallSpawn } = prevState;

    // Handle countdown sounds
    if (gs.countdown !== null && gs.countdown !== prevCountdown) {
        if (gs.countdown > 0) sounds.countdownTick();
        else if (gs.countdown === 0) sounds.countdownGo();
    }
    
    // Handle ball spawn sound
    if (prevBallSpawn.isActive && !gs.ballSpawn.isActive) {
        sounds.lastStandActivate(); // Re-using a fitting sound for the spawn
    }

    // --- PENDING GOAL DETECTION ---
    // A goal is detected when a player's score increases. This logic now applies to BOTH host and client.
    // It queues a "pending goal" which will be animated by the game loop after a short confirmation delay.
    // This gives the host's rewind system a chance to invalidate the goal before the effects play.
    if (gs.players.player1.score > prevPlayers.player1.score) {
        pendingGoalRef.current = { 
            scorerId: 'player1', 
            goalY: prevBall.y, 
            speedOnScore: Math.sqrt(prevBall.vx**2 + prevBall.vy**2), 
            timestamp: performance.now(), 
            score: gs.players.player1.score, 
        };
    } else if (gs.players.player2.score > prevPlayers.player2.score) {
        pendingGoalRef.current = { 
            scorerId: 'player2', 
            goalY: prevBall.y, 
            speedOnScore: Math.sqrt(prevBall.vx**2 + prevBall.vy**2), 
            timestamp: performance.now(), 
            score: gs.players.player2.score, 
        };
    }
};
