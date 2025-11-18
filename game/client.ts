// game/client.ts: Handles all client-side logic, including predictive physics
// for the ball and smooth visual interpolation for the remote player's paddle.
import React from 'react';
import { GameState, PlayerID, PlayerState } from '../types';
import * as C from '../constants';

// --- CONSTANTS FOR SMOOTHING ---
// These values control how quickly the client-side visuals correct themselves
// towards the authoritative state received from the host.

// A longer half-life for the ball makes its movement smoother and less jittery,
// especially when correcting for minor prediction errors.
const INTERPOLATION_HALF_LIFE_BALL_MS = 120;
// A shorter half-life for the paddle makes it feel more responsive to the opponent's
// movements, at the cost of potentially showing more jitter on a laggy connection.
const INTERPOLATION_HALF_LIFE_PADDLE_MS = 75;

const getPlayerPaddles = (player: PlayerState): { x: number, y: number, width: number, height: number }[] => {
    if (player.isMultiCloneActive) {
        const { x, y, width, height } = player.paddle;
        const mainPaddle = { x, y, width, height };
        const topPaddle = { x, y: y - height - C.MULTI_CLONE_GAP, width, height };
        const bottomPaddle = { x, y: y + height + C.MULTI_CLONE_GAP, width, height };
        return [mainPaddle, topPaddle, bottomPaddle];
    }
    return [player.paddle];
};

/**
 * Runs predictive physics on the client side between receiving host updates.
 * This function moves the ball based on its last known velocity and simulates
 * collisions to make the game feel responsive, even with network latency.
 */
export const updateClientState = (
    gameStateRef: React.MutableRefObject<GameState>,
    localPlayerId: PlayerID | null,
    deltaTime: number,
    // FIX: Changed parameter from a mutable ref to the GameState object to match the caller's argument.
    authoritativeGameState: GameState | null,
) => {
    const gs = gameStateRef.current;
    if (gs.isPaused || !localPlayerId) return;

    const { ball, players } = gs;

    // --- Predictive Physics ---
    // Handle sticky ball state first. If the ball is stuck, it shouldn't move on its own.
    if (ball.isSticky && ball.stickyPlayerId) {
        const player = players[ball.stickyPlayerId];
        if (player) {
            // Smoothly interpolate the ball's position towards the paddle's center,
            // mirroring the host-side logic for a better game feel.
            const targetX = player.id === 'player1' 
                ? player.paddle.x + player.paddle.width + ball.radius 
                : player.paddle.x - ball.radius;
            const targetY = player.paddle.y + player.paddle.height / 2;
            
            // This half-life should match the one in `game/physics.ts` for consistency.
            const STICKY_INTERPOLATION_HALF_LIFE_MS = 250; 
            const correctionFactor = 1 - Math.pow(0.5, (deltaTime * 1000) / STICKY_INTERPOLATION_HALF_LIFE_MS);
            
            ball.x += (targetX - ball.x) * correctionFactor;
            ball.y += (targetY - ball.y) * correctionFactor;
            ball.vx = 0;
            ball.vy = 0;
        }
    } else {
        const speedFactor = 60 * deltaTime;
        // Apply forces to the ball's velocity vector to more accurately predict its path.
        gs.arena.blackHoles.forEach(bh => {
            const dx = bh.x - ball.x;
            const dy = bh.y - ball.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            if (dist > 20) {
                const forceFalloff = 40000;
                const radialForce = (bh.strength * forceFalloff) / (distSq + forceFalloff);
                ball.vx += (dx / dist) * radialForce * speedFactor;
                ball.vy += (dy / dist) * radialForce * speedFactor;
                
                const orbitalForce = (bh.rotationStrength * forceFalloff) / (distSq + forceFalloff);
                ball.vx += (-dy / dist) * orbitalForce * speedFactor;
                ball.vy += (dx / dist) * orbitalForce * speedFactor;
            }
        });

        gs.arena.whiteHoles.forEach(wh => {
            const dx = wh.x - ball.x;
            const dy = wh.y - ball.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > 20 * 20) {
                const dist = Math.sqrt(distSq);
                const forceFalloff = 40000;
                const radialForce = (wh.strength * forceFalloff) / (distSq + forceFalloff);
                
                ball.vx -= (dx / dist) * radialForce * speedFactor;
                ball.vy -= (dy / dist) * radialForce * speedFactor;
            }
        });

        if (ball.curve) {
            ball.vy += ball.curve.magnitude * (ball.curve.direction === 'up' ? -1 : 1);
        }
        
        // --- SUB-STEPPING LOGIC FOR MOVEMENT AND COLLISION (from engine.ts) ---
        const totalMoveX = ball.vx * speedFactor;
        const totalMoveY = ball.vy * speedFactor;
        const moveDistance = Math.sqrt(totalMoveX * totalMoveX + totalMoveY * totalMoveY);

        const SUBSTEP_THRESHOLD = ball.radius;
        const numSubsteps = Math.max(1, Math.ceil(moveDistance / SUBSTEP_THRESHOLD));
        
        const subMoveX = totalMoveX / numSubsteps;
        const subMoveY = totalMoveY / numSubsteps;

        for (let i = 0; i < numSubsteps; i++) {
            ball.x += subMoveX;
            ball.y += subMoveY;

            let collisionOccurred = false;

            // Predictive Paddle Collision (for both players)
            for (const player of Object.values(players) as PlayerState[]) {
                for (const paddle of getPlayerPaddles(player)) {
                    const isApproaching = (ball.vx < 0 && player.id === 'player1') || (ball.vx > 0 && player.id === 'player2');
                    if (isApproaching && 
                        ball.x - ball.radius <= paddle.x + paddle.width && 
                        ball.x + ball.radius >= paddle.x && 
                        ball.y - ball.radius <= paddle.y + paddle.height && 
                        ball.y + ball.radius >= paddle.y) 
                    {
                        // Check for sticky paddle augment for predictive sticking
                        if (player.activeAugments.some(a => a.id === 'RARE_STICKY_PADDLE')) {
                            ball.isSticky = true;
                            ball.stickyPlayerId = player.id;
                            // Stop the ball for prediction. The host will manage the release.
                            ball.vx = 0;
                            ball.vy = 0;
                            // Attach to paddle predictively.
                            ball.x = player.id === 'player1'
                                ? paddle.x + paddle.width + ball.radius
                                : paddle.x - ball.radius;
                            ball.y = paddle.y + paddle.height / 2;
                        } else {
                            // Simplified, deterministic bounce prediction. No random effects like crits.
                            const paddleCenterY = paddle.y + (paddle.height / 2);
                            const clampedBallY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
                            const intersectY = paddleCenterY - clampedBallY;
                            let normalizedIntersectY = intersectY / (paddle.height / 2);
                            
                            const bounceAngle = normalizedIntersectY * (Math.PI / 4);
                            
                            let baseSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
                            let newSpeed = baseSpeed * player.stats.attack;
                            
                            const direction = (player.id === 'player1') ? 1 : -1;
                            ball.vx = direction * newSpeed * Math.cos(bounceAngle);
                            ball.vy = -newSpeed * Math.sin(bounceAngle);
                            
                            ball.x = (player.id === 'player1') ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;
                            
                            ball.curve = null;
                            ball.isFireball = false;
                        }

                        collisionOccurred = true;
                        break;
                    }
                }
                if (collisionOccurred) break;
            }
            if (collisionOccurred) break;

            // Predictive Defensive Wall Collision
            for (const wall of gs.arena.walls) {
                if (wall.blocksRemaining <= 0) continue;
                const isBallThreatening = (wall.ownerId === 'player1' && ball.vx < 0) || (wall.ownerId === 'player2' && ball.vx > 0);
                if (isBallThreatening && ball.x + ball.radius > wall.x && ball.x - ball.radius < wall.x + wall.width && ball.y + ball.radius > wall.y && ball.y - ball.radius < wall.y + wall.height) {
                    ball.curve = null; ball.isFireball = false;
                    const overlapX = Math.min(ball.x + ball.radius - wall.x, wall.x + wall.width - (ball.x - ball.radius));
                    const overlapY = Math.min(ball.y + ball.radius - wall.y, wall.y + wall.height - (ball.y - ball.radius));

                    if (overlapX < overlapY) {
                        ball.vx *= -1;
                        ball.x = ball.vx > 0 ? wall.x + wall.width + ball.radius : ball.x - ball.radius;
                    } else {
                        ball.vy *= -1;
                        ball.y = ball.vy > 0 ? wall.y + wall.height + ball.radius : ball.y - ball.radius;
                    }
                    collisionOccurred = true;
                    break;
                }
            }
            if (collisionOccurred) break;
            
            // Predictive Arena Boundary & Wormhole Collision
            const wormholeOwner = ball.lastHitBy ? players[ball.lastHitBy] : null;
            if (wormholeOwner && wormholeOwner.isWormholeActive) {
                if (ball.y - ball.radius <= 0) { ball.y = C.CANVAS_HEIGHT - ball.radius; collisionOccurred = true; } 
                else if (ball.y + ball.radius >= C.CANVAS_HEIGHT) { ball.y = ball.radius; collisionOccurred = true; }
                if (collisionOccurred) break;
            } else {
                if (ball.y - ball.radius < 0 || ball.y + ball.radius > C.CANVAS_HEIGHT) {
                    ball.vy *= -1;
                    ball.y = Math.max(ball.radius, Math.min(ball.y, C.CANVAS_HEIGHT - ball.radius));
                    collisionOccurred = true;
                    break;
                }
            }
        }
    }

    // --- Server Reconciliation (Ball Interpolation) ---
    // Smoothly correct the client's predicted ball position towards the server's authoritative position.
    // FIX: Updated logic to use the authoritativeGameState object directly instead of a ref.
    if (authoritativeGameState) {
        const serverBall = authoritativeGameState.ball;
        const clientBall = gs.ball;

        const yDifference = Math.abs(serverBall.y - clientBall.y);
        const TELEPORT_THRESHOLD = C.CANVAS_HEIGHT * 0.8; // A large jump signifies a wormhole teleport

        // If a teleport is detected, snap the ball's Y position immediately.
        // Continue to interpolate X for smoothness.
        if (yDifference > TELEPORT_THRESHOLD) {
            clientBall.y = serverBall.y; // Snap Y position
            const xCorrectionFactor = 1 - Math.pow(0.5, deltaTime / (INTERPOLATION_HALF_LIFE_BALL_MS / 1000));
            clientBall.x += (serverBall.x - clientBall.x) * xCorrectionFactor; // Interpolate X
        } else {
            // Standard interpolation for both X and Y
            const correctionFactor = 1 - Math.pow(0.5, deltaTime / (INTERPOLATION_HALF_LIFE_BALL_MS / 1000));
            clientBall.x += (serverBall.x - clientBall.x) * correctionFactor;
            clientBall.y += (serverBall.y - clientBall.y) * correctionFactor;
        }
    }
};

/**
 * Smooths the visual movement of the remote (non-local) player's paddle.
 * It uses a combination of two techniques:
 * 1. Extrapolation: Predicts the paddle's next position based on its last known velocity.
 *    This makes the paddle continue to move smoothly even if a network packet is delayed.
 * 2. Interpolation: Gently corrects the extrapolated position towards the authoritative
 *    position received from the host (`targetY`). This prevents the paddle from
 *    drifting out of sync over time.
 */
export const interpolatePaddles = (
    gameStateRef: React.MutableRefObject<GameState>,
    localPlayerId: PlayerID | null,
    deltaTime: number
) => {
    if (!localPlayerId) return;
    const remotePlayerId = localPlayerId === 'player1' ? 'player2' : 'player1';
    const remotePlayer = gameStateRef.current.players[remotePlayerId];
    
    // Aimbot is a special case that overrides normal movement. It's calculated
    // deterministically on both client and host, so we just simulate it directly.
    if (remotePlayer.isAimbotActive) {
        const newY = gameStateRef.current.ball.y - remotePlayer.paddle.height / 2;
        if (remotePlayer.isMultiCloneActive) {
            const h = remotePlayer.paddle.height, g = C.MULTI_CLONE_GAP, topBound = h + g, bottomBound = C.CANVAS_HEIGHT - (h * 2 + g);
            remotePlayer.paddle.y = Math.max(topBound, Math.min(newY, bottomBound));
        } else {
            remotePlayer.paddle.y = Math.max(0, Math.min(newY, C.CANVAS_HEIGHT - remotePlayer.paddle.height));
        }
        return;
    }

    // --- Extrapolation + Interpolation Logic ---
    
    // 1. EXTRAPOLATION: Predict the next position based on the last known velocity.
    // This makes the paddle appear to move instantly, hiding latency.
    const extrapolatedY = remotePlayer.paddle.y + (remotePlayer.paddle.vy || 0) * deltaTime;

    // 2. CORRECTION CALCULATION: Determine how far our prediction is from the host's truth.
    const distanceToTarget = remotePlayer.paddle.targetY - extrapolatedY;
    
    // 3. SNAP TO TARGET: If the paddle has stopped moving (vy=0) and is very close
    // to its final destination, snap it into place to prevent tiny, jittery corrections.
    if (Math.abs(distanceToTarget) < 0.5 && remotePlayer.paddle.vy === 0) {
        remotePlayer.paddle.y = remotePlayer.paddle.targetY;
        return;
    }
    
    // 4. INTERPOLATION: Calculate a frame-rate independent correction factor. This moves
    // the paddle a fraction of the `distanceToTarget` each frame.
    const correctionFactor = 1 - Math.pow(0.5, (deltaTime * 1000) / INTERPOLATION_HALF_LIFE_PADDLE_MS);

    // 5. APPLY CORRECTION: Add the interpolated correction to the extrapolated position.
    const correction = distanceToTarget * correctionFactor;
    let finalY = extrapolatedY + correction;
    
    // 6. CLAMP: Ensure the final position is within the canvas bounds.
    if (remotePlayer.isMultiCloneActive) {
        const h = remotePlayer.paddle.height;
        const g = C.MULTI_CLONE_GAP;
        const topBound = h + g;
        const bottomBound = C.CANVAS_HEIGHT - (h * 2 + g);
        finalY = Math.max(topBound, Math.min(finalY, bottomBound));
    } else {
        finalY = Math.max(0, Math.min(finalY, C.CANVAS_HEIGHT - remotePlayer.paddle.height));
    }
    
    remotePlayer.paddle.y = finalY;
};