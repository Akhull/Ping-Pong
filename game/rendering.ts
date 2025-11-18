

import { GameState, PlayerID } from '../types';
import { Particle, ExplosionCore } from './effects';
import { drawBackground } from './rendering/drawBackground';
import { drawEntities } from './rendering/drawEntities';
import { drawArenaObjects } from './rendering/drawArenaObjects';
import { drawEffects } from './rendering/drawEffects';
import { drawUI } from './rendering/drawUI';

export function draw(
    ctx: CanvasRenderingContext2D, 
    gs: GameState, 
    particles: Particle[],
    explosionCores: ExplosionCore[],
    timestamp: number,
    clockOffset: number = 0,
    localPlayerId: PlayerID | null,
) {
    // Layer 1: Background & Fullscreen Effects
    drawBackground(ctx, gs, timestamp, clockOffset);
    
    // Layer 2: Arena Objects (behind entities)
    drawArenaObjects(ctx, gs, timestamp, clockOffset, localPlayerId);

    // Layer 3: Effects (Particles, Explosions, etc.)
    drawEffects(ctx, gs, particles, explosionCores, timestamp, clockOffset);

    // Layer 4: Game Entities (Paddles, Ball)
    drawEntities(ctx, gs, timestamp, particles);
    
    // Layer 5: UI Elements (Countdown, Floating Text)
    drawUI(ctx, gs, timestamp, clockOffset);
}