import { GameState, PlayerState, PlayerID, ExodiaLaser } from '../types';
import * as C from '../constants';
import { getPlayerPaddles } from './utils';
import { recalculatePlayerPaddleSize } from './augments';

export function applyPaddleHitEffects(gs: GameState, player: PlayerState, paddle: { x: number; y: number; width: number; height: number; }, timestamp: number): {vx: number, vy: number} {
    const { ball } = gs;
    const opponentId = player.id === 'player1' ? 'player2' : 'player1';
    const opponent = gs.players[opponentId];
    const isGravityWellActive = gs.arena.blackHoles.length > 0 || gs.arena.whiteHoles.length > 0;
    ball.lastPaddleHitTime = timestamp;
    ball.curve = null;
    ball.isFireball = false;
    let normalizedIntersectY: number;
    if (ball.isSticky && ball.stickyPlayerId === player.id && ball.stickyStartY !== null) {
        const yMovement = player.paddle.y - ball.stickyStartY;
        const maxInfluenceMove = 40;
        normalizedIntersectY = Math.max(-1, Math.min(1, yMovement / maxInfluenceMove));
    } else {
        const paddleCenterY = paddle.y + (paddle.height / 2);
        const clampedBallY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
        const intersectY = paddleCenterY - clampedBallY;
        normalizedIntersectY = intersectY / (paddle.height / 2);
    }
    const bounceAngle = normalizedIntersectY * (Math.PI / 4);
    let baseSpeed = ball.stickySpeed ?? Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    if (baseSpeed === 0) {
        baseSpeed = C.INITIAL_BALL_SPEED + gs.augmentRoundCounter * 0.2;
    }
    let effectiveAttack = player.stats.attack;
    const isCrit = Math.random() < player.stats.critChance;
    if (isCrit) {
        const attackBonus = player.stats.attack - 1;
        const critModifiedAttackBonus = attackBonus * (1 + player.stats.critForce);
        effectiveAttack = 1 + critModifiedAttackBonus;
    }
    const getThrottleMultiplier = (displaySpeed: number): number => {
        const EFFICIENCY_FLOOR = 0.10; const SPEED_START = 50; const SPEED_MID = 250; const SPEED_END = 400;
        if (displaySpeed < SPEED_START) return 1.0;
        if (displaySpeed <= SPEED_MID) return 1.0 + (displaySpeed - SPEED_START) * (0.5 - 1.0) / (SPEED_MID - SPEED_START);
        if (displaySpeed <= SPEED_END) return Math.max(EFFICIENCY_FLOOR, 0.5 + (displaySpeed - SPEED_MID) * (EFFICIENCY_FLOOR - 0.5) / (SPEED_END - SPEED_MID));
        return EFFICIENCY_FLOOR;
    };
    const displaySpeed = baseSpeed * 10;
    const throttleMultiplier = getThrottleMultiplier(displaySpeed);
    const attackBonus = effectiveAttack - 1;
    const throttledAttack = 1 + (attackBonus * throttleMultiplier);
    let newSpeed = baseSpeed * throttledAttack;
    
    if (player.abilities.shenronsBlessing.isActive) {
        newSpeed += 2; // Ki-Aura passive
    }

    if (player.abilities.fireball.isActive) {
        if (opponent.abilities.vacBann.isArmed) {
            player.abilities.fireball.bannedUntil = timestamp + C.AUGMENT_BANNED_DURATION_MS;
            player.abilities.fireball.cooldownEndTime = timestamp + C.AUGMENT_BANNED_DURATION_MS + player.abilities.fireball.cooldown;
            opponent.abilities.vacBann.isArmed = false;
            opponent.abilities.vacBann.cooldownEndTime = timestamp + opponent.abilities.vacBann.cooldown;
            gs.floatingTexts.push({ x: player.id === 'player1' ? C.CANVAS_WIDTH / 2 - 150 : C.CANVAS_WIDTH / 2 + 150, y: player.paddle.y, text: 'BANNED!', color: '#ef4444', life: 2, decay: 1 });
        } else {
            newSpeed *= 2; ball.isFireball = true; player.abilities.fireball.isActive = false;
            player.abilities.fireball.cooldownEndTime = timestamp + player.abilities.fireball.cooldown;
        }
    } else if (player.doubleStrikeReady) {
        newSpeed *= 1.5; player.doubleStrikeReady = false;
    }
    if (isCrit && !isGravityWellActive) {
        gs.floatingTexts.push({ x: ball.x, y: ball.y, text: 'Crit!', color: '#f87171', life: 1.5, decay: 1 });
        const speedRatio = Math.min(1, Math.max(0, (newSpeed - C.INITIAL_BALL_SPEED * 2) / (C.MAX_BALL_SPEED * 0.8)));
        if (speedRatio > 0.1) {
            const duration = 100 + 650 * speedRatio;
            const minTimeScale = Math.max(0.05, 1 - (speedRatio * 0.95));
            gs.timeWarp = { isActive: true, startTime: timestamp, duration: duration, minTimeScale: minTimeScale, rampDownDuration: duration * 0.05, holdDuration: duration * 0.8, rampUpDuration: duration * 0.15, impactX: ball.x, impactY: ball.y };
        }
    }
    if (player.activeAugments.some(a => a.id === 'EPIC_CURVEBALL') && Math.random() < 0.25) {
        ball.curve = { magnitude: 0.2, direction: Math.random() < 0.5 ? 'up' : 'down' };
    }
    if (player.activeAugments.some(a => a.id === 'EPIC_CHAIN_LIGHTNING') && Math.random() < player.stats.critChance) {
        opponent.isStunned = true; const stunDuration = 250 * (1 + player.stats.critForce);
        opponent.stunEndTime = timestamp + stunDuration;
        if (!isGravityWellActive) {
            gs.visualEffects.push({ id: `lightning-${timestamp}`, type: 'chain_lightning', from: { x: ball.x, y: ball.y }, to: { x: opponent.paddle.x + opponent.paddle.width / 2, y: opponent.paddle.y + opponent.paddle.height / 2 }, life: 0.3, decay: 1 });
        }
    }
    if (player.isAimbotActive) {
        player.abilities.aimbot.charges--;
        if (player.abilities.aimbot.charges <= 0) {
            player.isAimbotActive = false;
            player.abilities.aimbot.cooldownEndTime = timestamp + player.abilities.aimbot.cooldown;
        }
    }

    const direction = (player.id === 'player1') ? 1 : -1;
    const finalVx = direction * newSpeed * Math.cos(bounceAngle);
    const finalVy = -newSpeed * Math.sin(bounceAngle);
    ball.lastHitBy = player.id;
    return { vx: finalVx, vy: finalVy };
}


export function updateBallAndPhysics(gs: GameState, deltaTime: number, timestamp: number) {
    const { ball, players } = gs;

    gs.arena.blackHoles.forEach(bh => {
        const dx = bh.x - ball.x; const dy = bh.y - ball.y; const distSq = dx * dx + dy * dy; const dist = Math.sqrt(distSq);
        if (dist > 20) {
            const speedFactor = 60 * deltaTime; const forceFalloff = 40000;
            const radialForce = (bh.strength * forceFalloff) / (distSq + forceFalloff);
            ball.vx += (dx / dist) * radialForce * speedFactor; ball.vy += (dy / dist) * radialForce * speedFactor;
            const orbitalForce = (bh.rotationStrength * forceFalloff) / (distSq + forceFalloff);
            ball.vx += (-dy / dist) * orbitalForce * speedFactor; ball.vy += (dx / dist) * orbitalForce * speedFactor;
        }
    });

    gs.arena.whiteHoles.forEach(wh => {
        const dx = wh.x - ball.x; const dy = wh.y - ball.y; const distSq = dx * dx + dy * dy;
        if (distSq > 20 * 20) {
            const dist = Math.sqrt(distSq); const speedFactor = 60 * deltaTime; const forceFalloff = 40000;
            const radialForce = (wh.strength * forceFalloff) / (distSq + forceFalloff);
            ball.vx -= (dx / dist) * radialForce * speedFactor; ball.vy -= (dy / dist) * radialForce * speedFactor;
        }
    });

    if (ball.curve) {
        ball.vy += ball.curve.magnitude * (ball.curve.direction === 'up' ? -1 : 1);
    }

    const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    const displaySpeed = currentSpeed * 10;
    const AIRDRAG_THRESHOLD = 125;
    if (displaySpeed > AIRDRAG_THRESHOLD) {
        const maxRelevantSpeed = C.MAX_BALL_SPEED * 10;
        const excessSpeedRatio = Math.max(0, (displaySpeed - AIRDRAG_THRESHOLD) / (maxRelevantSpeed - AIRDRAG_THRESHOLD));
        const dragCoefficient = 0.0525 * excessSpeedRatio;
        const dragFactor = 1.0 - (dragCoefficient * deltaTime);
        ball.vx *= dragFactor;
        ball.vy *= dragFactor;
    }

    // Kamehameha Beam Collision
    const KAMEHAMEHA_HIT_COOLDOWN_MS = 250;
    gs.arena.kamehamehaBeams.forEach(beam => {
        if (timestamp > (ball.lastKamehamehaHitTimestamp ?? 0) + KAMEHAMEHA_HIT_COOLDOWN_MS) {
            const beamIsP1 = beam.ownerId === 'player1';
            const ballMovingTowardsBeam = (beamIsP1 && ball.vx > 0) || (!beamIsP1 && ball.vx < 0);
            
            if (!ballMovingTowardsBeam &&
                ball.y + ball.radius > beam.y &&
                ball.y - ball.radius < beam.y + beam.height) 
            {
                const opponentDirection = beam.ownerId === 'player1' ? 1 : -1;
                const currentSpeed = Math.sqrt(ball.vx**2 + ball.vy**2);
                // Ensure a minimum speed and accelerate from there, with a cap.
                const newSpeed = Math.min(C.MAX_BALL_SPEED * 2.0, Math.max(C.MAX_BALL_SPEED * 1.5, currentSpeed * 1.2));

                ball.vx = opponentDirection * newSpeed;
                ball.vy = 0; // Straight shot
                ball.curve = null;
                ball.isFireball = false;
                ball.lastHitBy = beam.ownerId;
                ball.lastKamehamehaHitTimestamp = timestamp; // Apply cooldown
                
                // Add a visual hit effect
                gs.visualEffects.push({
                    id: `exodia-hit-${timestamp}`, // can reuse this effect type
                    type: 'exodia_laser_hit',
                    from: { x: ball.x, y: ball.y },
                    to: { x: ball.x, y: ball.y },
                    life: 0.1,
                    decay: 1
                });
            }
        }
    });

    // Exodia Laser Logic
    const EXODIA_HIT_COOLDOWN_MS = 500; // Prevent ball from being hit multiple times by the same beam
    gs.arena.exodiaLasers.forEach(laser => {
        if (timestamp > (ball.lastExodiaHitTimestamp ?? 0) + EXODIA_HIT_COOLDOWN_MS) {
            // Check for collision across the entire width of the arena
            if (ball.y + ball.radius > laser.y && ball.y - ball.radius < laser.y + laser.height) {
                const opponentDirection = laser.ownerId === 'player1' ? 1 : -1;
                ball.vx = opponentDirection * C.EXODIA_LASER_BALL_SPEED_BOOST;
                ball.vy = (Math.random() - 0.5) * 5;
                ball.curve = null;
                ball.isFireball = false;
                ball.lastHitBy = laser.ownerId;
                ball.lastExodiaHitTimestamp = timestamp; // Apply cooldown
                
                gs.visualEffects.push({
                    id: `exodia-hit-${timestamp}`,
                    type: 'exodia_laser_hit',
                    from: { x: ball.x, y: ball.y },
                    to: { x: ball.x, y: ball.y },
                    life: 0.1,
                    decay: 1
                });
            }
        }
    });

    if (ball.isSticky && ball.stickyPlayerId) {
        const player = players[ball.stickyPlayerId];
        const targetX = player.id === 'player1' ? player.paddle.x + player.paddle.width + ball.radius : player.paddle.x - ball.radius;
        const targetY = player.paddle.y + player.paddle.height / 2;
        const STICKY_INTERPOLATION_HALF_LIFE_MS = 250; 
        const correctionFactor = 1 - Math.pow(0.5, (deltaTime * 1000) / STICKY_INTERPOLATION_HALF_LIFE_MS);
        ball.x += (targetX - ball.x) * correctionFactor; ball.y += (targetY - ball.y) * correctionFactor;
        ball.vx = 0; ball.vy = 0;
        if (timestamp > ball.stickyReleaseTime && ball.stickyReleaseStartTime === 0) {
            ball.stickyReleaseStartTime = timestamp; ball.stickyStartY = player.paddle.y;
        }
        if (ball.stickyReleaseStartTime > 0 && timestamp - ball.stickyReleaseStartTime >= 100) {
            const { vx: targetVx, vy: targetVy } = applyPaddleHitEffects(gs, player, player.paddle, timestamp);
            ball.isSticky = false; ball.stickyPlayerId = null; ball.stickySpeed = null; ball.stickyStartY = null;
            ball.isLaunching = true; ball.launchStartTime = timestamp;
            ball.launchSourceVx = ball.vx; ball.launchSourceVy = ball.vy;
            ball.targetVx = targetVx; ball.targetVy = targetVy;
        }
        return;
    }

    if (ball.isLaunching) {
        const elapsed = timestamp - ball.launchStartTime;
        if (elapsed >= 120) {
            ball.vx = ball.targetVx; ball.vy = ball.targetVy; ball.isLaunching = false;
        } else {
            const easeOutProgress = 1 - Math.pow(1 - (elapsed / 120), 3);
            ball.vx = ball.launchSourceVx + (ball.targetVx - ball.launchSourceVx) * easeOutProgress;
            ball.vy = ball.launchSourceVy + (ball.targetVy - ball.launchSourceVy) * easeOutProgress;
        }
    }

    const speedFactor = 60 * deltaTime;
    const totalMoveX = ball.vx * speedFactor;
    const totalMoveY = ball.vy * speedFactor;
    const moveDistance = Math.sqrt(totalMoveX * totalMoveX + totalMoveY * totalMoveY);
    const SUBSTEP_THRESHOLD = C.PADDLE_WIDTH / 2.0;
    const numSubsteps = Math.max(1, Math.ceil(moveDistance / SUBSTEP_THRESHOLD));
    const subMoveX = totalMoveX / numSubsteps;
    const subMoveY = totalMoveY / numSubsteps;
    const prevFrameX = ball.x;

    for (let i = 0; i < numSubsteps; i++) {
        ball.x += subMoveX; ball.y += subMoveY;
        let collisionOccurred = false;

        gs.arena.midlineSeals.forEach(seal => {
            if (collisionOccurred) return;
            const lastHitter = ball.lastHitBy;
            if (lastHitter && lastHitter !== seal.ownerId) {
                const midlineX = C.CANVAS_WIDTH / 2;
                const isCrossing = (seal.ownerId === 'player1' && prevFrameX > midlineX && ball.x <= midlineX) || (seal.ownerId === 'player2' && prevFrameX < midlineX && ball.x >= midlineX);
                if (isCrossing) {
                    ball.vx *= -1.2;
                    ball.vy += (Math.random() - 0.5) * 4;
                    ball.x = midlineX + (ball.vx > 0 ? 1 : -1);
                    ball.lastHitBy = null;
                    collisionOccurred = true;
                    gs.visualEffects.push({
                        id: `midline-block-${timestamp}`,
                        type: 'midline_seal_block',
                        from: { x: ball.x, y: ball.y },
                        to: { x: ball.x, y: ball.y }, // Not used but required by type
                        life: 0.3,
                        decay: 1,
                    });
                }
            }
        });
        if (collisionOccurred) break;

        for (const player of Object.values(players)) {
            for (const paddle of getPlayerPaddles(player)) {
                const isApproaching = (ball.vx < 0 && player.id === 'player1') || (ball.vx > 0 && player.id === 'player2');
                if (isApproaching && 
                    ball.x - ball.radius <= paddle.x + paddle.width && 
                    ball.x + ball.radius >= paddle.x && 
                    ball.y - ball.radius <= paddle.y + paddle.height && 
                    ball.y + ball.radius >= paddle.y) 
                {
                    if(player.activeAugments.some(a => a.id === 'RARE_STICKY_PADDLE')) {
                        ball.isSticky = true; ball.stickyPlayerId = player.id;
                        ball.stickySpeed = Math.sqrt(ball.vx**2 + ball.vy**2);
                        ball.stickyReleaseTime = timestamp + 150; ball.stickyReleaseStartTime = 0;
                        ball.stickyStartY = null;
                    } else {
                        const { vx, vy } = applyPaddleHitEffects(gs, player, paddle, timestamp);
                        ball.vx = vx; ball.vy = vy;
                        ball.x = (player.id === 'player1') ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;
                        if (player.abilities.shenronsBlessing.isActive) {
                            const TELEPORT_DISTANCE = 40;
                            const currentSpeed = Math.sqrt(ball.vx**2 + ball.vy**2);
                            if (currentSpeed > 0) {
                                const fromPos = { x: ball.x, y: ball.y };
                                const normVx = ball.vx / currentSpeed;
                                const normVy = ball.vy / currentSpeed;

                                const toPos = { x: fromPos.x + normVx * TELEPORT_DISTANCE, y: fromPos.y + normVy * TELEPORT_DISTANCE };
                                
                                toPos.x = Math.max(ball.radius, Math.min(toPos.x, C.CANVAS_WIDTH - ball.radius));
                                toPos.y = Math.max(ball.radius, Math.min(toPos.y, C.CANVAS_HEIGHT - ball.radius));
                                
                                gs.visualEffects.push({
                                    id: `ki-aura-${timestamp}`,
                                    type: 'ki_aura_teleport',
                                    from: fromPos,
                                    to: toPos,
                                    life: 0.2,
                                    decay: 2
                                });
                                
                                ball.x = toPos.x;
                                ball.y = toPos.y;
                            }
                        }
                    }
                    collisionOccurred = true; break;
                }
            }
            if (collisionOccurred) break;
        }
        if (collisionOccurred) break;
        for (const wall of gs.arena.walls) {
            if (wall.blocksRemaining <= 0) continue;
            const isBallThreatening = (wall.ownerId === 'player1' && ball.vx < 0) || (wall.ownerId === 'player2' && ball.vx > 0);
            if (isBallThreatening && ball.x + ball.radius > wall.x && ball.x - ball.radius < wall.x + wall.width && ball.y + ball.radius > wall.y && ball.y - ball.radius < wall.y + wall.height) {
                ball.isFireball = false; ball.curve = null; ball.lastHitBy = null;
                const overlapX = Math.min(ball.x + ball.radius - wall.x, wall.x + wall.width - (ball.x - ball.radius));
                const overlapY = Math.min(ball.y + ball.radius - wall.y, wall.y + wall.height - (ball.y - ball.radius));
                if (overlapX < overlapY) {
                    ball.vx *= -1;
                    ball.x = ball.vx > 0 ? wall.x + wall.width + ball.radius : wall.x - ball.radius;
                } else {
                    ball.vy *= -1;
                    ball.y = ball.vy > 0 ? wall.y + wall.height + ball.radius : wall.y - ball.radius;
                }
                const requiredDirection = wall.ownerId === 'player1' ? 1 : -1;
                if (Math.sign(ball.vx) !== requiredDirection) { ball.vx = Math.abs(ball.vx) * requiredDirection; }
                wall.blocksRemaining--;
                if (wall.blocksRemaining <= 0) { wall.cooldownEndTime = timestamp + wall.cooldownDuration; }
                collisionOccurred = true; break;
            }
        }
        if (collisionOccurred) break;

        const wormholeOwner = ball.lastHitBy ? players[ball.lastHitBy] : null;
        if (wormholeOwner && wormholeOwner.isWormholeActive) {
            let teleported = false;
            let fromY = 0, toY = 0;
            if (ball.y - ball.radius <= 0) { fromY = 0; toY = C.CANVAS_HEIGHT; ball.y = C.CANVAS_HEIGHT - ball.radius; teleported = true; } 
            else if (ball.y + ball.radius >= C.CANVAS_HEIGHT) { fromY = C.CANVAS_HEIGHT; toY = 0; ball.y = ball.radius; teleported = true; }
            if (teleported) {
                gs.visualEffects.push({ id: `wormhole-${timestamp}`, type: 'wormhole_teleport', from: { x: ball.x, y: fromY }, to: { x: ball.x, y: toY }, life: 0.5, decay: 1 });
                collisionOccurred = true; break;
            }
        } else {
            if (ball.y - ball.radius < 0 || ball.y + ball.radius > C.CANVAS_HEIGHT) {
                ball.vy *= -1;
                ball.y = Math.max(ball.radius, Math.min(ball.y, C.CANVAS_HEIGHT - ball.radius));
                collisionOccurred = true; break;
            }
        }
    }
    const crossedCenter = (prevFrameX < C.CANVAS_WIDTH / 2 && ball.x >= C.CANVAS_WIDTH / 2) || (prevFrameX > C.CANVAS_WIDTH / 2 && ball.x <= C.CANVAS_WIDTH / 2);
    if (crossedCenter && ball.lastHitBy) {
        const lastHitter = gs.players[ball.lastHitBy];
        if (lastHitter.activeAugments.some(a => a.id === 'RARE_GHOST_BALL') && Math.random() < 0.25) {
            ball.isInvisible = true;
            ball.invisibilityEndTime = timestamp + 750;
        }
    }
}

export function updatePlayerAndAbilityStates(gs: GameState, timestamp: number) {
    Object.values(gs.players).forEach((player: PlayerState) => {
        if (player.isShrunk && timestamp > player.shrinkEndTime) { 
            player.isShrunk = false; recalculatePlayerPaddleSize(player); 
        }
        if (player.areControlsInverted && timestamp > player.invertControlsEndTime) { player.areControlsInverted = false; }
        if (player.isStunned && timestamp > player.stunEndTime) { player.isStunned = false; }
        if (gs.ball.isInvisible && timestamp > gs.ball.invisibilityEndTime) { gs.ball.isInvisible = false; }
        if (player.abilities.blackHole.activeUntil && timestamp > player.abilities.blackHole.activeUntil) {
            // FIX: Corrected typo from blackHle to blackHole.
            player.abilities.blackHole.activeUntil = 0;
        }
        if (player.abilities.whiteHole.activeUntil && timestamp > player.abilities.whiteHole.activeUntil) {
            player.abilities.whiteHole.activeUntil = 0;
        }
        if (player.abilities.shrink.activeUntil && timestamp > player.abilities.shrink.activeUntil) {
            player.abilities.shrink.activeUntil = 0;
        }
        if (player.abilities.invertControls.activeUntil && timestamp > player.abilities.invertControls.activeUntil) {
            player.abilities.invertControls.activeUntil = 0;
        }
        const hasFireball = player.activeAugments.some(a => a.id === 'BALL_SPEED_INCREASE');
        if (hasFireball && !player.abilities.fireball.isActive && timestamp > player.abilities.fireball.cooldownEndTime && timestamp > (player.abilities.fireball.bannedUntil ?? 0)) {
            player.abilities.fireball.isActive = true;
        }
        const hasVacBann = player.activeAugments.some(a => a.id === 'EPIC_VAC_BANN');
        if (hasVacBann && !player.abilities.vacBann.isArmed && timestamp > player.abilities.vacBann.cooldownEndTime) {
            player.abilities.vacBann.isArmed = true;
        }
        if (player.activeAugments.some(a => a.id === 'RARE_LAST_STAND') && !player.abilities.lastStand.isActive) {
            if (player.abilities.lastStand.pointsConceded >= 5) {
                player.abilities.lastStand.isActive = true;
                player.abilities.lastStand.pointsConceded = 0;
            }
        }
        const hasMidlineSeal = player.activeAugments.some(a => a.id === 'WISH_MIDLINE_SEAL');
        if (hasMidlineSeal && timestamp > player.abilities.midlineSeal.cooldownEndTime) {
            const MIDLINE_SEAL_DURATION_MS = 5000;
            gs.arena.midlineSeals.push({
                ownerId: player.id,
                endTime: timestamp + MIDLINE_SEAL_DURATION_MS,
            });
            player.abilities.midlineSeal.cooldownEndTime = timestamp + player.abilities.midlineSeal.cooldown;
        }
        const hasKamehameha = player.activeAugments.some(a => a.id === 'WISH_KAMEHAMEHA');
        if (hasKamehameha && timestamp > player.abilities.kamehameha.cooldownEndTime) {
            player.abilities.kamehameha.cooldownEndTime = timestamp + player.abilities.kamehameha.cooldown;
            const KAMEHAMEHA_CHARGE_TIME_MS = 1200;
            gs.arena.kamehamehaCharges.push({
                ownerId: player.id,
                endTime: timestamp + KAMEHAMEHA_CHARGE_TIME_MS,
            });
        }
    });

    gs.arena.walls.forEach(wall => {
        if (wall.blocksRemaining <= 0 && timestamp > wall.cooldownEndTime) {
            wall.blocksRemaining = wall.maxBlocks;
        }
    });

    // Handle Kamehameha charges and spawning
    const finishedKamehamehaCharges = gs.arena.kamehamehaCharges.filter(c => timestamp >= c.endTime);
    gs.arena.kamehamehaCharges = gs.arena.kamehamehaCharges.filter(c => timestamp < c.endTime);
    finishedKamehamehaCharges.forEach(charge => {
        const owner = gs.players[charge.ownerId];
        if (owner) {
            const KAMEHAMEHA_BEAM_DURATION_MS = 2000;
            const KAMEHAMEHA_BEAM_HEIGHT = 125;
            gs.arena.kamehamehaBeams.push({
                ownerId: charge.ownerId,
                y: owner.paddle.y + (owner.paddle.height / 2) - (KAMEHAMEHA_BEAM_HEIGHT / 2),
                height: KAMEHAMEHA_BEAM_HEIGHT,
                endTime: timestamp + KAMEHAMEHA_BEAM_DURATION_MS,
            });
        }
    });

    // Update active Kamehameha beam positions to follow the paddle
    gs.arena.kamehamehaBeams.forEach(beam => {
        const owner = gs.players[beam.ownerId];
        if (owner) {
            beam.y = owner.paddle.y + (owner.paddle.height / 2) - (beam.height / 2);
        }
    });

    // Remove expired effects
    gs.arena.kamehamehaBeams = gs.arena.kamehamehaBeams.filter(beam => timestamp < beam.endTime);
    gs.arena.midlineSeals = gs.arena.midlineSeals.filter(seal => timestamp < seal.endTime);

    Object.values(gs.players).forEach((player: PlayerState) => {
        const opponentId = player.id === 'player1' ? 'player2' : 'player1';
        const opponent = gs.players[opponentId];
        const hasShrink = player.activeAugments.some(a => a.id === 'OPPONENT_PADDLE_SIZE_DECREASE');
        const hasInvert = player.activeAugments.some(a => a.id === 'EPIC_VANGUARD_ERROR');
        const hasBlackHole = player.activeAugments.some(a => a.id === 'LEGENDARY_BLACK_HOLE');
        const hasWhiteHole = player.activeAugments.some(a => a.id === 'LEGENDARY_WHITE_HOLE');
        const hasBWSynergy = hasBlackHole && hasWhiteHole;
        const hasExodiaObliterate = player.activeAugments.some(a => a.id === 'SPECIAL_EXODIA_OBLITERATE');

        if (hasExodiaObliterate && timestamp > player.abilities.exodiaLaser.cooldownEndTime) {
            player.abilities.exodiaLaser.cooldownEndTime = timestamp + player.abilities.exodiaLaser.cooldown;
            gs.arena.exodiaLaserCharges.push({ ownerId: player.id, y: Math.random() * (C.CANVAS_HEIGHT - C.EXODIA_LASER_HEIGHT), endTime: timestamp + C.EXODIA_LASER_CHARGE_TIME_MS });
        }

        if (hasShrink && timestamp > player.abilities.shrink.cooldownEndTime && timestamp > (player.abilities.shrink.bannedUntil ?? 0)) {
            if (opponent.abilities.vacBann.isArmed) {
                player.abilities.shrink.bannedUntil = timestamp + C.AUGMENT_BANNED_DURATION_MS;
                player.abilities.shrink.cooldownEndTime = timestamp + C.AUGMENT_BANNED_DURATION_MS + player.abilities.shrink.cooldown;
                opponent.abilities.vacBann.isArmed = false;
                opponent.abilities.vacBann.cooldownEndTime = timestamp + opponent.abilities.vacBann.cooldown;
                gs.floatingTexts.push({ x: player.id === 'player1' ? C.CANVAS_WIDTH / 2 - 150 : C.CANVAS_WIDTH / 2 + 150, y: player.paddle.y, text: 'BANNED!', color: '#ef4444', life: 2, decay: 1 });
            } else {
                opponent.isShrunk = true;
                opponent.shrinkEndTime = timestamp + C.AUGMENT_SHRINK_DURATION_MS;
                player.abilities.shrink.cooldownEndTime = timestamp + player.abilities.shrink.cooldown;
                player.abilities.shrink.activeUntil = timestamp + C.AUGMENT_SHRINK_DURATION_MS;
                recalculatePlayerPaddleSize(opponent);
            }
        }
        if (hasInvert && timestamp > player.abilities.invertControls.cooldownEndTime && timestamp > (player.abilities.invertControls.bannedUntil ?? 0)) {
            if (opponent.abilities.vacBann.isArmed) {
                player.abilities.invertControls.bannedUntil = timestamp + C.AUGMENT_BANNED_DURATION_MS;
                player.abilities.invertControls.cooldownEndTime = timestamp + C.AUGMENT_BANNED_DURATION_MS + player.abilities.invertControls.cooldown;
                opponent.abilities.vacBann.isArmed = false;
                opponent.abilities.vacBann.cooldownEndTime = timestamp + opponent.abilities.vacBann.cooldown;
                gs.floatingTexts.push({ x: player.id === 'player1' ? C.CANVAS_WIDTH / 2 - 150 : C.CANVAS_WIDTH / 2 + 150, y: player.paddle.y, text: 'BANNED!', color: '#ef4444', life: 2, decay: 1 });
            } else {
                opponent.areControlsInverted = true;
                opponent.invertControlsEndTime = timestamp + C.AUGMENT_INVERT_CONTROLS_DURATION_MS;
                player.abilities.invertControls.cooldownEndTime = timestamp + player.abilities.invertControls.cooldown;
                player.abilities.invertControls.activeUntil = timestamp + C.AUGMENT_INVERT_CONTROLS_DURATION_MS;
            }
        }
        if (hasBWSynergy) {
            if (timestamp > player.abilities.blackHole.cooldownEndTime) {
                gs.arena.blackHoles = gs.arena.blackHoles.filter(bh => bh.ownerId !== player.id);
                gs.arena.blackHoles.push({ ownerId: player.id, x: opponent.id === 'player1' ? -100 : C.CANVAS_WIDTH + 100, y: C.CANVAS_HEIGHT / 2, strength: 8.0, rotationStrength: 0.16, rotationAngle: 0, safeRadius: 200, endTime: timestamp + C.AUGMENT_BLACK_HOLE_DURATION_MS });
                gs.arena.whiteHoles = gs.arena.whiteHoles.filter(wh => wh.ownerId !== player.id);
                gs.arena.whiteHoles.push({ ownerId: player.id, x: player.id === 'player1' ? -100 : C.CANVAS_WIDTH + 100, y: C.CANVAS_HEIGHT / 2, strength: 8.0, rotationStrength: 0, rotationAngle: 0, safeRadius: 200, endTime: timestamp + C.AUGMENT_WHITE_HOLE_DURATION_MS });
                const cooldown = C.AUGMENT_BLACK_HOLE_COOLDOWN_MS; const duration = C.AUGMENT_BLACK_HOLE_DURATION_MS;
                player.abilities.blackHole.cooldownEndTime = timestamp + cooldown; player.abilities.whiteHole.cooldownEndTime = timestamp + cooldown;
                player.abilities.blackHole.activeUntil = timestamp + duration; player.abilities.whiteHole.activeUntil = timestamp + duration;
            }
        } else {
            if (hasBlackHole && timestamp > player.abilities.blackHole.cooldownEndTime) {
                gs.arena.blackHoles = gs.arena.blackHoles.filter(bh => bh.ownerId !== player.id);
                gs.arena.blackHoles.push({ ownerId: player.id, x: opponent.id === 'player1' ? -100 : C.CANVAS_WIDTH + 100, y: C.CANVAS_HEIGHT / 2, strength: 8.0, rotationStrength: 0.16, rotationAngle: 0, safeRadius: 200, endTime: timestamp + C.AUGMENT_BLACK_HOLE_DURATION_MS });
                player.abilities.blackHole.cooldownEndTime = timestamp + player.abilities.blackHole.cooldown;
                player.abilities.blackHole.activeUntil = timestamp + C.AUGMENT_BLACK_HOLE_DURATION_MS;
            }
            if (hasWhiteHole && timestamp > player.abilities.whiteHole.cooldownEndTime) {
                gs.arena.whiteHoles = gs.arena.whiteHoles.filter(wh => wh.ownerId !== player.id);
                gs.arena.whiteHoles.push({ ownerId: player.id, x: player.id === 'player1' ? -100 : C.CANVAS_WIDTH + 100, y: C.CANVAS_HEIGHT / 2, strength: 8.0, rotationStrength: 0, rotationAngle: 0, safeRadius: 200, endTime: timestamp + C.AUGMENT_WHITE_HOLE_DURATION_MS });
                player.abilities.whiteHole.cooldownEndTime = timestamp + player.abilities.whiteHole.cooldown;
                player.abilities.whiteHole.activeUntil = timestamp + C.AUGMENT_WHITE_HOLE_DURATION_MS;
            }
        }
    });
    
    // Handle Exodia laser charges and spawning
    const finishedCharges = gs.arena.exodiaLaserCharges.filter(c => timestamp >= c.endTime);
    gs.arena.exodiaLaserCharges = gs.arena.exodiaLaserCharges.filter(c => timestamp < c.endTime);
    finishedCharges.forEach(charge => {
        gs.arena.exodiaLasers.push({
            ownerId: charge.ownerId,
            y: charge.y,
            height: C.EXODIA_LASER_HEIGHT,
            endTime: timestamp + C.EXODIA_LASER_DURATION_MS,
        });
    });
    
    // Remove expired Exodia lasers
    gs.arena.exodiaLasers = gs.arena.exodiaLasers.filter(laser => timestamp < laser.endTime);

    gs.arena.blackHoles = gs.arena.blackHoles.filter(bh => timestamp < bh.endTime);
    gs.arena.whiteHoles = gs.arena.whiteHoles.filter(wh => timestamp < wh.endTime);
    gs.arena.blackHoles.forEach(bh => bh.rotationAngle += 0.02);
    gs.arena.whiteHoles.forEach(wh => wh.rotationAngle -= 0.03);
}