import React from 'react';
import { GameState } from '../../types';
import { Sounds } from '../../App';
import { Particle, createExplosion } from './utils';

export const handleCollisionEvents = (
    gs: GameState, 
    prevState: GameState,
    sounds: Sounds, 
    particlesRef: React.MutableRefObject<Particle[]>
) => {
    const { ball, players, floatingTexts, arena } = gs;
    const { ball: prevBall, players: prevPlayers, floatingTexts: prevFloatingTexts, arena: prevArena } = prevState;

    const justScored = players.player1.score > prevPlayers.player1.score || players.player2.score > prevPlayers.player2.score;
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    const justGotSticky = !prevBall.isSticky && ball.isSticky;

    if (Math.sign(ball.vy) !== Math.sign(prevBall.vy) && prevBall.vy !== 0) {
        const wormholeOwner = ball.lastHitBy ? players[ball.lastHitBy] : null;
        if (!wormholeOwner || !wormholeOwner.isWormholeActive) {
            sounds.wallHit();
        }
    }

    if (!justScored && ball.lastHitBy && ball.lastHitBy !== prevBall.lastHitBy && !justGotSticky) {
        const color = ball.lastHitBy === 'player1' ? '#22d3ee' : '#fb923c';
        createExplosion(particlesRef, ball.x, ball.y, color, 25, speed);
        
        const p1UsedFireball = prevPlayers.player1.abilities.fireball.isActive && !players.player1.abilities.fireball.isActive;
        const p2UsedFireball = prevPlayers.player2.abilities.fireball.isActive && !players.player2.abilities.fireball.isActive;
        const newCritText = floatingTexts.length > prevFloatingTexts.length && floatingTexts[floatingTexts.length - 1].text === 'Crit!';
        
        if (p1UsedFireball || p2UsedFireball) sounds.fireball();
        else if (newCritText) sounds.paddleCrit();
        else sounds.paddleHit();
    }
    
    if (justGotSticky) sounds.stickyAttach();
    if (prevBall.isSticky && !ball.isSticky) {
        sounds.stickyRelease();
        if (prevBall.stickyPlayerId && players[prevBall.stickyPlayerId]) {
            const color = prevBall.stickyPlayerId === 'player1' ? '#22d3ee' : '#fb923c';
            createExplosion(particlesRef, ball.x, ball.y, color, 25, Math.sqrt(ball.targetVx**2 + ball.targetVy**2));
        }
    }

    arena.walls.forEach(wall => {
        const prevWall = prevArena.walls.find(pw => pw.id === wall.id);
        if (prevWall) {
            if (prevWall.blocksRemaining > 0 && wall.blocksRemaining === 0) sounds.wallBreak();
            if (prevWall.blocksRemaining === 0 && wall.blocksRemaining > 0) sounds.wallReactivate();
            if (prevWall.blocksRemaining > wall.blocksRemaining && wall.blocksRemaining > 0) sounds.wallBlock();
        }
    });

    arena.walls.forEach(wall => {
        const isBallFromOwner = (wall.ownerId === 'player1' && ball.vx > 0) || (wall.ownerId === 'player2' && ball.vx < 0);
        if (isBallFromOwner && wall.blocksRemaining > 0) {
            const wallX = wall.x + wall.width / 2;
            if ((prevBall.x < wallX && ball.x >= wallX) || (prevBall.x > wallX && ball.x <= wallX)) {
                if (ball.y > wall.y && ball.y < wall.y + wall.height) sounds.wallPassThrough();
            }
        }
    });
};
