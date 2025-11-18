// game/engine.ts: The authoritative game simulation for the host.
// This file contains the core logic that dictates the game's state. It runs exclusively
// on the host's machine. All client actions (like paddle movements) are sent here,
// processed with lag compensation, and the resulting authoritative game state is
// broadcast back to all players.
import React from 'react';
import { GameState, PlayerID, AugmentID, RerollAugmentMessage, PaddleMoveMessage, Augment, HistoricalState, Ball, PlayerState } from '../types';
import * as C from '../constants';
import { getReplacementAugment } from '../data/augments';
import { deepCopy } from '../utils/helpers';
import { getPlayerPaddles } from './utils';

// Import logic from specialized modules
import { applyAugment } from './augments';
import { updateBallAndPhysics, updatePlayerAndAbilityStates, applyPaddleHitEffects } from './physics';
import { triggerBallSpawn, resetBall, triggerAugmentSelection } from './rules';

// Re-export foundational functions for other parts of the app
export { createInitialGameState, clearHostStateBuffer } from './state';
export { applyAugment } from './augments';

// --- HOST-SIDE STATE BUFFER FOR LAG COMPENSATION ---
// Stores a brief history of the ball's position on the host. When a client input arrives,
// the host can "rewind" to the time of the input and check for collisions against
// this historical data, making the game fair despite network latency.
const hostStateBuffer: HistoricalState[] = [];
const HOST_BUFFER_DURATION_MS = 300; // Store 300ms of history

/**
 * The main function for updating the host's game state. It's a reducer that takes
 * the current state and an action, and computes the next state.
 * @param gameStateRef A mutable ref containing the current game state.
 * @param action The type of action to process (e.g., 'update', 'processClientInput').
 * @param payload Data associated with the action (e.g., delta time, client input data).
 */
export const runHostGameStep = (
    gameStateRef: React.MutableRefObject<GameState>,
    action: 'update' | 'triggerBallSpawn' | 'processClientInput' | 'rerollAugment' | 'activateAbility' | 'manipulateScore',
    payload: any
): void => {
    const gs = gameStateRef.current;
    if (!gs) return;

    switch (action) {
        // This is the main game tick, called every frame.
        case 'update': {
            const { timestamp, deltaTime, localPlayerChoice, opponentPlayerChoice, allowedAugments, callbacks }: {
                timestamp: number;
                deltaTime: number;
                localPlayerChoice: AugmentID | null;
                opponentPlayerChoice: AugmentID | null;
                allowedAugments: Set<AugmentID>;
                callbacks: {
                    onAugmentSelection: () => void;
                    onAugmentApplied: () => void;
                    onBallSpawned: () => void;
                    onGameOver: (winner: PlayerID) => void;
                };
            } = payload;
            
            // Store the current ball state in the historical buffer for rewind checks.
            hostStateBuffer.push({ timestamp, ball: deepCopy(gs.ball) });
            while (hostStateBuffer.length > 0 && timestamp - hostStateBuffer[0].timestamp > HOST_BUFFER_DURATION_MS) {
                hostStateBuffer.shift();
            }

            // --- PENDING STATE CONFIRMATION SYSTEM ---
            // This logic prevents UI elements (like augment selection or ball respawns) from
            // appearing instantly, only to be removed a fraction of a second later if a
            // client's late input causes the host to rewind and invalidate the goal.
            const CONFIRMATION_MS = 200;

            // Check if an augment selection is pending confirmation.
            if (gs.pendingAugmentSelectionTimestamp && timestamp - gs.pendingAugmentSelectionTimestamp > CONFIRMATION_MS) {
                // If the state is still valid after the delay, trigger the selection now.
                if (gs.pointsSinceLastAugment >= gs.pointsNeededForNextAugment) {
                    triggerAugmentSelection(gs, timestamp, allowedAugments);
                    callbacks.onAugmentSelection();
                }
                gs.pendingAugmentSelectionTimestamp = null; // Clear the flag.
            }

            // Check if a ball spawn is pending confirmation.
            if (gs.pendingBallSpawnTimestamp && timestamp - gs.pendingBallSpawnTimestamp > CONFIRMATION_MS) {
                // If the conditions are still met, trigger the spawn.
                if (!gs.isAugmentSelectionActive && !gs.pendingAugmentSelectionTimestamp) {
                    triggerBallSpawn(gs, timestamp);
                    callbacks.onBallSpawned();
                }
                gs.pendingBallSpawnTimestamp = null; // Clear the flag.
            }
            
            // If the game is in the augment selection phase, wait for both players to choose.
            if (gs.isAugmentSelectionActive) {
                // Handle Wish Selection (single player choice)
                if (gs.wishSelection) {
                    const wishingPlayerId = gs.wishSelection.playerId;
                    const choice = wishingPlayerId === 'player1' ? localPlayerChoice : opponentPlayerChoice;
                    if (choice) {
                        const wishingPlayer = gs.players[wishingPlayerId];
                        
                        applyAugment(choice, wishingPlayer, gs, timestamp);
                        gs.isAugmentSelectionActive = false;
                        
                        // Clear the choice refs in the parent game loop.
                        if (wishingPlayerId === 'player1') {
                            payload.localPlayerChoice = null; 
                        } else {
                            payload.opponentPlayerChoice = null;
                        }
                        
                        callbacks.onAugmentApplied();
                        // Note: Ball spawn is handled by the scatter animation completion logic.
                    }
                    return; // Prevent normal selection logic
                }
            
                // Normal Augment Selection (both players must choose)
                if (localPlayerChoice && opponentPlayerChoice) {
                    // Unpause cooldowns by the amount of time spent in the augment screen.
                    if (gs.pauseStartTime > 0) {
                        const pauseDuration = timestamp - gs.pauseStartTime;
                        (Object.values(gs.players) as PlayerState[]).forEach((player) => {
                            (Object.keys(player.abilities) as Array<keyof typeof player.abilities>).forEach(key => {
                                const ability = player.abilities[key];
                                if ('cooldownEndTime' in ability && ability.cooldownEndTime && ability.cooldownEndTime > 0) {
                                    ability.cooldownEndTime += pauseDuration;
                                }
                                if ('activeUntil' in ability && ability.activeUntil && ability.activeUntil > 0) {
                                    ability.activeUntil += pauseDuration;
                                }
                                if ('bannedUntil' in ability && ability.bannedUntil && ability.bannedUntil > 0) {
                                    ability.bannedUntil += pauseDuration;
                                }
                            });
                            if (player.shrinkEndTime > 0) player.shrinkEndTime += pauseDuration;
                            if (player.invertControlsEndTime > 0) player.invertControlsEndTime += pauseDuration;
                            if (player.stunEndTime > 0) player.stunEndTime += pauseDuration;
                        });
                        if (gs.ball.invisibilityEndTime > 0) gs.ball.invisibilityEndTime += pauseDuration;
                        gs.arena.blackHoles.forEach(bh => { if(bh.endTime < Infinity) bh.endTime += pauseDuration });
                        gs.arena.whiteHoles.forEach(wh => { if(wh.endTime < Infinity) wh.endTime += pauseDuration });
                        gs.arena.walls.forEach(wall => { if(wall.cooldownEndTime > 0) wall.cooldownEndTime += pauseDuration });
                        gs.pauseStartTime = 0;
                    }

                    applyAugment(localPlayerChoice, gs.players.player1, gs, timestamp);
                    applyAugment(opponentPlayerChoice, gs.players.player2, gs, timestamp);
                    
                    // If this wasn't a wish selection, proceed with normal game flow.
                    if (!gs.wishSelection) {
                        gs.isAugmentSelectionActive = false;
                        gs.augmentSelectionData = null;
                        
                        callbacks.onAugmentApplied();
                        
                        triggerBallSpawn(gs, timestamp);
                        callbacks.onBallSpawned();
                    } else {
                         callbacks.onAugmentApplied(); // Wish selection has its own post-animation spawn.
                    }
                }
                return; // Game is paused during selection, so no physics updates.
            }

            // Pause game physics during the Dragonball scatter animation.
            if (gs.dragonballScatterAnimation?.isActive) {
                const SCATTER_ANIMATION_DURATION = 3500; // ms
                if (timestamp - gs.dragonballScatterAnimation.startTime > SCATTER_ANIMATION_DURATION) {
                    gs.dragonballScatterAnimation = null; // Clear the animation state
                    triggerBallSpawn(gs, timestamp);
                    callbacks.onBallSpawned();
                }
                return;
            }

            if (gs.isPaused) {
                // Handle the ball spawn countdown.
                if(gs.ballSpawn.isActive) {
                    const elapsed = timestamp - gs.ballSpawn.startTime;
                    if (elapsed > gs.ballSpawn.duration) {
                        gs.ballSpawn.isActive = false;
                        gs.isPaused = false;
                        resetBall(gs, timestamp, Math.random() > 0.5 ? 1 : -1);
                    }
                }
                return; // No physics updates while paused.
            }

            // --- CORE GAMEPLAY UPDATE ---
            updatePlayerAndAbilityStates(gs, timestamp);
            updateBallAndPhysics(gs, deltaTime, timestamp);

            // --- GOAL DETECTION ---
            let scorer: PlayerID | null = null;
            // LOCK: This prevents the goal detection from running if a goal has already been scored
            // in a previous frame and is waiting for confirmation. This fixes double-scoring bugs.
            const isGoalPending = gs.pendingBallSpawnTimestamp !== null || gs.pendingAugmentSelectionTimestamp !== null;

            if (!isGoalPending) {
                // Player 2 scores
                if (gs.ball.x + gs.ball.radius < 0) {
                    // Check for Last Stand save
                    if (gs.players.player1.abilities.lastStand.isActive) {
                        gs.players.player1.abilities.lastStand.isActive = false;
                        const LAST_STAND_RETURN_SPEED_X = 7.0;
                        gs.ball.vx = LAST_STAND_RETURN_SPEED_X;
                        gs.ball.vy = (Math.random() - 0.5) * 2 * 3.0;
                        gs.ball.x = gs.ball.radius + 1;
                        // Clear all ball effects upon save
                        gs.ball.curve = null; gs.ball.isFireball = false; gs.ball.isInvisible = false;
                    } else {
                        scorer = 'player2';
                        gs.players.player2.score++;
                        // Handle on-score augments
                        if (gs.players.player1.activeAugments.some(a => a.id === 'RARE_DOUBLE_STRIKE')) gs.players.player1.doubleStrikeReady = true;
                        if (gs.players.player1.activeAugments.some(a => a.id === 'RARE_LAST_STAND')) {
                            gs.players.player1.abilities.lastStand.pointsConceded++;
                        }
                    }
                // Player 1 scores
                } else if (gs.ball.x - gs.ball.radius > C.CANVAS_WIDTH) {
                    // Check for Last Stand save
                    if (gs.players.player2.abilities.lastStand.isActive) {
                        gs.players.player2.abilities.lastStand.isActive = false;
                        const LAST_STAND_RETURN_SPEED_X = 7.0;
                        gs.ball.vx = -LAST_STAND_RETURN_SPEED_X;
                        gs.ball.vy = (Math.random() - 0.5) * 2 * 3.0;
                        gs.ball.x = C.CANVAS_WIDTH - gs.ball.radius - 1;
                        gs.ball.curve = null; gs.ball.isFireball = false; gs.ball.isInvisible = false;
                    } else {
                        scorer = 'player1';
                        gs.players.player1.score++;
                        if (gs.players.player2.activeAugments.some(a => a.id === 'RARE_DOUBLE_STRIKE')) gs.players.player2.doubleStrikeReady = true;
                        if (gs.players.player2.activeAugments.some(a => a.id === 'RARE_LAST_STAND')) {
                            gs.players.player2.abilities.lastStand.pointsConceded++;
                        }
                    }
                }
            }

            // If a goal was scored, set the appropriate pending state.
            if (scorer) {
                gs.pointsSinceLastAugment++;
                if (gs.pointsSinceLastAugment >= gs.pointsNeededForNextAugment) {
                    gs.pendingAugmentSelectionTimestamp = timestamp;
                } else {
                    gs.pendingBallSpawnTimestamp = timestamp;
                }
            }

            // Stalemate detection
            if (timestamp - gs.ball.lastPaddleHitTime > 15000) {
                gs.floatingTexts.push({ x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2, text: 'Stalemate! Resetting ball.', color: '#facc15', life: 2, decay: 1 });
                resetBall(gs, timestamp, gs.ball.vx > 0 ? 1 : -1);
            }

            // Win condition
            if (!gs.isEndlessMode) {
                if (gs.players.player1.score >= C.WINNING_SCORE) {
                    callbacks.onGameOver('player1');
                    gs.isPaused = true;
                } else if (gs.players.player2.score >= C.WINNING_SCORE) {
                    callbacks.onGameOver('player2');
                    gs.isPaused = true;
                }
            }
            break;
        }
        case 'triggerBallSpawn': {
            triggerBallSpawn(gs, payload.timestamp);
            break;
        }
        // This action handles input from the client (Player 2).
        case 'processClientInput': {
            // FIX: Correctly type the movePayload and remove usage of clockOffset, which is not provided.
            const movePayload = payload.payload as PaddleMoveMessage['payload'] & { playerId: PlayerID };
            const { y: clientY, vy: clientVy, clientTimestamp } = movePayload;
            const player = gs.players[movePayload.playerId];
            if (!player) break;

            // Update the client's paddle state with the received data.
            // 'targetY' is the authoritative position, 'y' is the visual position that interpolates towards it.
            player.paddle.targetY = clientY;
            player.paddle.vy = clientVy;
            
            // --- LAG COMPENSATION: TIME REWIND ---
            // 1. Calculate the exact moment the client performed the action in the host's timeline.
            const clockOffset = 0; // Not provided by server, assuming 0 for now.
            const rewindToTime = clientTimestamp + clockOffset;
            
            // 2. Find the two historical game states from our buffer that bracket this moment in time.
            const nextState = hostStateBuffer.find(s => s.timestamp > rewindToTime);
            const prevState = hostStateBuffer.slice().reverse().find(s => s.timestamp <= rewindToTime);

            if (!prevState || !nextState) {
                break; // Not enough history to perform a rewind check.
            }
            
            const timeDiff = nextState.timestamp - prevState.timestamp;
            if (timeDiff <= 0) break; 
            
            let hitDetected = false;
            let hitPaddle: { x: number; y: number; width: number; height: number; } | null = null;
            let hitBallState: Ball | null = null;
            let hitPlayerState: PlayerState | null = null;

            // --- CONTINUOUS COLLISION DETECTION (CCD) ---
            // 3. Instead of checking a single point in time, we scan across the timeslice
            // between `prevState` and `nextState` to avoid missing fast-moving balls ("tunneling").
            const SUBSTEPS = 5; 
            for (let i = 1; i <= SUBSTEPS; i++) {
                const substepFactor = i / SUBSTEPS;
                const interpolationFactor = (prevState.timestamp + timeDiff * substepFactor - prevState.timestamp) / timeDiff;

                // Interpolate the ball's position to its location at this specific substep.
                const ballSubstep: Ball = deepCopy(prevState.ball);
                ballSubstep.x = prevState.ball.x + (nextState.ball.x - prevState.ball.x) * interpolationFactor;
                ballSubstep.y = prevState.ball.y + (nextState.ball.y - prevState.ball.y) * interpolationFactor;

                // **Extrapolate** the client's paddle position based on their velocity at the time of the message.
                // Formula: start_pos + velocity * time_elapsed
                const timeSinceClientMessage = (prevState.timestamp + timeDiff * substepFactor) - rewindToTime;
                const paddleSubstepY = clientY + clientVy * (timeSinceClientMessage / 1000.0);

                const playerStateAtSubstep = deepCopy(player);
                playerStateAtSubstep.paddle.y = paddleSubstepY;

                // Check for collision between the interpolated ball and the extrapolated paddle.
                const clientPaddles = getPlayerPaddles(playerStateAtSubstep);
                for (const paddle of clientPaddles) {
                    const isApproaching = ballSubstep.vx > 0;
                    if (isApproaching &&
                        ballSubstep.x + ballSubstep.radius >= paddle.x &&
                        ballSubstep.x - ballSubstep.radius <= paddle.x + paddle.width &&
                        ballSubstep.y + ballSubstep.radius >= paddle.y &&
                        ballSubstep.y - ballSubstep.radius <= paddle.y + paddle.height) 
                    {
                        hitDetected = true;
                        hitPaddle = paddle;
                        hitBallState = ballSubstep;
                        hitPlayerState = playerStateAtSubstep;
                        break;
                    }
                }
                if (hitDetected) break;
            }
            
            // --- STATE RECONCILIATION ---
            // 4. If a hit was detected in the past, we must correct the present.
            if (hitDetected && hitPaddle && hitBallState && hitPlayerState) {
                const interpolatedY = player.paddle.y;
                player.paddle.y = hitPlayerState.paddle.y; // Use the exact collision position for physics

                const tempGsForHitCalc = { ...gs, ball: hitBallState };
                const { vx: postHitVx, vy: postHitVy } = applyPaddleHitEffects(tempGsForHitCalc, player, hitPaddle, rewindToTime);
                
                // Resimulate the ball's trajectory from the point of impact to the present time.
                let timeToResimulate = performance.now() - rewindToTime;
                let resimulatedBall = { ...hitBallState };
                resimulatedBall.vx = postHitVx;
                resimulatedBall.vy = postHitVy;
                resimulatedBall.x = hitPaddle.x - resimulatedBall.radius;
                
                // Fast-forward the ball simulation in small steps to account for collisions.
                const SIM_STEP_MS = 1000 / 60;
                while (timeToResimulate > 0) {
                    const stepDeltaTime = Math.min(timeToResimulate, SIM_STEP_MS) / 1000.0;
                    const speedFactor = 60 * stepDeltaTime;
                    resimulatedBall.x += resimulatedBall.vx * speedFactor;
                    resimulatedBall.y += resimulatedBall.vy * speedFactor;
                    // (Simplified resimulation - a full implementation would re-check all collisions here)
                    timeToResimulate -= SIM_STEP_MS;
                }
                // Update the authoritative game state with the corrected ball state.
                gs.ball = { ...gs.ball, ...resimulatedBall };

                player.paddle.y = interpolatedY; // Restore visual position

                // --- THE MAGIC: REVERTING INCORRECT PREDICTIONS ---
                // Check if the host had incorrectly awarded a point while waiting for this client message.
                const wasInBallSpawn = gs.ballSpawn.isActive;
                const wasInAugmentSelection = gs.isAugmentSelectionActive;
                const wasAugmentSelectionPending = !!gs.pendingAugmentSelectionTimestamp;
                const wasBallSpawnPending = !!gs.pendingBallSpawnTimestamp;

                if (wasInBallSpawn || wasInAugmentSelection || wasAugmentSelectionPending || wasBallSpawnPending) {
                    const defender = player;
                    const scorerId = defender.id === 'player1' ? 'player2' : 'player1';
                    const scorer = gs.players[scorerId];

                    // If a point was scored, take it back.
                    if (scorer.score > 0) {
                        scorer.score--;
                        gs.pointsSinceLastAugment--;
                        // Revert any on-score augment effects.
                        if (defender.activeAugments.some(a => a.id === 'RARE_DOUBLE_STRIKE')) defender.doubleStrikeReady = false;
                        if (defender.activeAugments.some(a => a.id === 'RARE_LAST_STAND')) defender.abilities.lastStand.pointsConceded--;
                    }

                    // Cancel any UI states that were triggered by the incorrect goal.
                    if (wasInAugmentSelection) gs.isAugmentSelectionActive = false;
                    if (wasAugmentSelectionPending) gs.pendingAugmentSelectionTimestamp = null;
                    if (wasBallSpawnPending) gs.pendingBallSpawnTimestamp = null;

                    // Immediately resume play.
                    gs.ballSpawn.isActive = false;
                    gs.isPaused = false;
                    gs.pauseStartTime = 0;
                }
            }
            break;
        }
        case 'rerollAugment': {
            // FIX: Correctly cast the payload to include playerId.
            const { payload: rerollPayload, callbacks } = payload as { payload: RerollAugmentMessage['payload'] & { playerId: PlayerID }, callbacks: { onStateChanged: () => void } };
            const { playerId, slotIndex } = rerollPayload;
            const player = gs.players[playerId];
        
            if (gs.augmentSelectionData) {
                const rerollsLeft = playerId === 'player1' ? gs.augmentSelectionData.player1Rerolls : gs.augmentSelectionData.player2Rerolls;
        
                if (rerollsLeft > 0) {
                    const currentChoices = playerId === 'player1' ? gs.augmentSelectionData.player1Augments : gs.augmentSelectionData.player2Augments;
                    if (currentChoices && currentChoices[slotIndex]) {
                        const excludedIds = new Set<AugmentID>(currentChoices.map((c: Augment): AugmentID => c.id));
                        const newAugment = getReplacementAugment(player.stats.luck, excludedIds, player.activeAugments);
                        if (newAugment) {
                            currentChoices[slotIndex] = newAugment;
                            if (playerId === 'player1') {
                                gs.augmentSelectionData.player1Rerolls--;
                            } else {
                                gs.augmentSelectionData.player2Rerolls--;
                            }
                            callbacks.onStateChanged();
                        }
                    }
                }
            }
            break;
        }
        case 'activateAbility': {
            // This is currently only used for Aimbot.
            const { payload: abilityPayload } = payload;
            const { playerId, abilityId, isDevToggle } = abilityPayload;
            const player = gs.players[playerId];

            if (abilityId === 'aimbot') {
                 if (isDevToggle) {
                    player.isAimbotActive = !player.isAimbotActive;
                    if(player.isAimbotActive) player.abilities.aimbot.charges = 999;
                } else {
                    const timestamp = performance.now();
                    const opponent = gs.players[playerId === 'player1' ? 'player2' : 'player1'];
                    const hasAimbot = player.activeAugments.some(a => a.id === 'LEGENDARY_AIMBOT');
                    if (hasAimbot && !player.isAimbotActive && timestamp > player.abilities.aimbot.cooldownEndTime) {
                        // Check if opponent has VAC Bann ready
                        if (opponent.abilities.vacBann.isArmed) {
                            player.abilities.aimbot.bannedUntil = timestamp + C.AUGMENT_BANNED_DURATION_MS;
                            player.abilities.aimbot.cooldownEndTime = timestamp + C.AUGMENT_BANNED_DURATION_MS + player.abilities.aimbot.cooldown;
                            opponent.abilities.vacBann.isArmed = false;
                            opponent.abilities.vacBann.cooldownEndTime = timestamp + opponent.abilities.vacBann.cooldown;
                            gs.floatingTexts.push({ x: player.id === 'player1' ? C.CANVAS_WIDTH / 2 - 150 : C.CANVAS_WIDTH / 2 + 150, y: player.paddle.y, text: 'BANNED!', color: '#ef4444', life: 2, decay: 1 });
                        } else {
                            player.isAimbotActive = true;
                            player.abilities.aimbot.charges = 3;
                        }
                    }
                }
            }
            break;
        }
        case 'manipulateScore': {
            // Debug action to manually set scores.
            const { p1Score, p2Score } = payload.payload;
            const { callbacks } = payload;
            gs.players.player1.score = p1Score;
            gs.players.player2.score = p2Score;
            callbacks.onStateChanged();
            break;
        }
    }
};