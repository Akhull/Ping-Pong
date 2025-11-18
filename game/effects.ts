// FIX: Import React to resolve namespace errors for types like React.MutableRefObject.
import React from 'react';
import { GameState, PlayerID } from '../types';
import { deepCopy } from '../utils/helpers';
import { Sounds } from '../App';
import { Particle, ExplosionCore } from './effects/utils';
import { handleScoreAndCountdownEvents } from './effects/score';
import { handleCollisionEvents } from './effects/collisions';
import { handleAbilityAndStatusEvents } from './effects/abilities';

// FIX: Export Particle and ExplosionCore types to make them available to other modules.
export type { Particle, ExplosionCore };


export const updateParticles = (particlesRef: React.MutableRefObject<Particle[]>, deltaTime: number) => {
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= p.decay * deltaTime; });
};

export const updateFloatingTexts = (gs: GameState, deltaTime: number) => {
    if (!gs.floatingTexts) gs.floatingTexts = [];
    gs.floatingTexts = gs.floatingTexts.filter(ft => ft.life > 0);
    gs.floatingTexts.forEach(ft => { ft.y -= 20 * deltaTime; ft.life -= ft.decay * deltaTime; });
};

export const updateVisualEffects = (gs: GameState, deltaTime: number) => {
    if (!gs.visualEffects) gs.visualEffects = [];
    gs.visualEffects = gs.visualEffects.filter(ve => ve.life > 0);
    gs.visualEffects.forEach(ve => { ve.life -= ve.decay * deltaTime; });
};
  
export const handleAudioVisualEvents = (
    gs: GameState,
    prevStateRef: React.MutableRefObject<GameState | null>,
    sounds: Sounds,
    particlesRef: React.MutableRefObject<Particle[]>,
    explosionCoresRef: React.MutableRefObject<ExplosionCore[]>,
    isHost: boolean,
    pendingGoalRef: React.MutableRefObject<{ scorerId: PlayerID; goalY: number; speedOnScore: number; timestamp: number; score: number } | null>
) => {
    const prevState = prevStateRef.current;
    if (!prevState) {
        prevStateRef.current = deepCopy(gs);
        return;
    }

    handleScoreAndCountdownEvents(gs, prevState, sounds, particlesRef, explosionCoresRef, isHost, pendingGoalRef);
    handleCollisionEvents(gs, prevState, sounds, particlesRef);
    handleAbilityAndStatusEvents(gs, prevState, sounds, particlesRef);

    prevStateRef.current = deepCopy(gs);
};