




import React, { useEffect, useRef } from 'react';
import { PlayerID, GameState, PlayerState, Ball, AugmentID, TimeWarpState } from '../types';
import * as C from '../constants';
import { ALL_AUGMENTS } from '../data/augments';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    decay: number;
}

const BackgroundGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameStateRef = useRef<GameState | null>(null);
    const lastTimestampRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const aiStateRef = useRef({
        player1: { targetY: C.CANVAS_HEIGHT / 2, nextDecisionTime: 0 },
        player2: { targetY: C.CANVAS_HEIGHT / 2, nextDecisionTime: 0 },
    });

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Simplified logic copied and adapted from Game.tsx ---
        
        const createInitialGameState = (): GameState => {
            const createPlayer = (id: PlayerID, xPos: number): PlayerState => ({
            id,
            score: 0,
            // FIX: Added missing 'vy' property to the paddle object to match the PlayerState type.
            paddle: { x: xPos, y: C.CANVAS_HEIGHT / 2, width: C.PADDLE_WIDTH, height: C.INITIAL_PADDLE_HEIGHT, targetY: C.CANVAS_HEIGHT / 2, vy: 0 },
            // FIX: Added the missing 'luck' property to the stats object to match the 'PlayerState' type definition.
            stats: { attack: C.INITIAL_ATTACK, critChance: C.INITIAL_CRIT_CHANCE, critForce: C.INITIAL_CRIT_FORCE, moveSpeed: C.INITIAL_MOVESPEED, luck: C.INITIAL_LUCK },
            // FIX: Corrected typo in abilityKey from 'blackHle' to 'blackHole' to match the PlayerState type definition.
            // FIX: Added the missing 'shenronsBlessing' property to the abilities object to match the 'PlayerState' type.
            abilities: { fireball: {cooldown: 0, cooldownEndTime: 0, isActive: false}, shrink: {cooldown: 0, cooldownEndTime: 0, activeUntil: 0}, blackHole: {cooldown: 0, cooldownEndTime: 0, activeUntil: 0}, whiteHole: {cooldown: 0, cooldownEndTime: 0, activeUntil: 0}, invertControls: {cooldown: 0, cooldownEndTime: 0, activeUntil: 0}, vacBann: { cooldown: 0, cooldownEndTime: 0, isArmed: false }, aimbot: { cooldown: 0, cooldownEndTime: 0, charges: 0 }, lastStand: { isActive: false, pointsConceded: 0 }, wormhole: { isActive: false }, exodiaLaser: { cooldown: 0, cooldownEndTime: 0 }, kamehameha: { cooldown: 10000, cooldownEndTime: 0 }, midlineSeal: { cooldown: 35000, cooldownEndTime: 0 }, shenronsBlessing: { isActive: false } },
            activeAugments: [],
            // FIX: Add missing `isWormholeActive` property to match PlayerState type.
            isWormholeActive: false,
            isAimbotActive: false, isShrunk: false, shrinkEndTime: 0, areControlsInverted: false, invertControlsEndTime: 0, doubleStrikeReady: false, isMultiCloneActive: false, isStunned: false, stunEndTime: 0,
            });

            return {
            // FIX: Added missing 'hostTimestamp' property to match the 'GameState' type definition.
            hostTimestamp: 0,
            // FIX: Added missing 'stickyReleaseStartTime' property to the initial ball state to match the 'Ball' type definition.
            ball: { x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2, vx: 0, vy: 0, radius: C.BALL_RADIUS, lastHitBy: null, curve: null, isFireball: false, isInvisible: false, invisibilityEndTime: 0, isSticky: false, stickyPlayerId: null, stickyReleaseTime: 0, stickyReleaseStartTime: 0, stickyStartY: null, stickySpeed: null, lastPaddleHitTime: 0, isLaunching: false, launchSourceVx: 0, launchSourceVy: 0, targetVx: 0, targetVy: 0, launchStartTime: 0, lastExodiaHitTimestamp: 0, lastKamehamehaHitTimestamp: 0 },
            players: {
                player1: createPlayer('player1', C.PADDLE_WIDTH),
                player2: createPlayer('player2', C.CANVAS_WIDTH - C.PADDLE_WIDTH * 2)
            },
            isPaused: true,
            // FIX: Added missing 'pauseStartTime' property to match the 'GameState' type definition.
            pauseStartTime: 0,
            arena: { obstacles: [], gravity: { x: 0, y: 0 }, modifiers: [], blackHoles: [], whiteHoles: [], walls: [], exodiaLasers: [], exodiaLaserCharges: [], kamehamehaCharges: [], kamehamehaBeams: [], midlineSeals: [] },
            floatingTexts: [], visualEffects: [], countdown: null, countdownStartTime: 0,
            // FIX: Add missing `ballSpawn` property to match GameState type.
            ballSpawn: { isActive: false, startTime: 0, duration: 1500, p1SourceX: C.CANVAS_WIDTH * 0.25, p2SourceX: C.CANVAS_WIDTH * 0.75 },
            augmentRoundCounter: 0, pointsSinceLastAugment: 0, pointsNeededForNextAugment: 1,
            timeWarp: { isActive: false, startTime: 0, duration: 0, minTimeScale: 1, rampDownDuration: 0, holdDuration: 0, rampUpDuration: 0, impactX: 0, impactY: 0 },
            // FIX: Added missing 'isEndlessMode' property to match the 'GameState' type.
            isEndlessMode: false,
            // FIX: Add missing properties to match GameState type.
            isAugmentSelectionActive: false,
            pendingAugmentSelectionTimestamp: null,
            // FIX: Add missing `pendingBallSpawnTimestamp` property to match GameState type.
            pendingBallSpawnTimestamp: null,
            augmentSelectionData: null,
            // FIX: Add missing `dragonballScatterAnimation` property to match GameState type.
            dragonballScatterAnimation: null,
            };
        };

        gameStateRef.current = createInitialGameState();
        const gs = gameStateRef.current;

        const getPlayerPaddles = (player: PlayerState): { x: number, y: number, width: number, height: number }[] => {
            if (player.isMultiCloneActive) {
                const { x, y, width, height } = player.paddle;
                return [
                    { x, y, width, height },
                    { x, y: y - height - C.MULTI_CLONE_GAP, width, height },
                    { x, y: y + height + C.MULTI_CLONE_GAP, width, height }
                ];
            }
            return [player.paddle];
        };

        const resetBall = (direction: number = 1) => {
            gs.ball.x = C.CANVAS_WIDTH / 2;
            gs.ball.y = C.CANVAS_HEIGHT / 2;
            gs.ball.vx = C.INITIAL_BALL_SPEED * direction;
            gs.ball.vy = (Math.random() - 0.5) * 4;
            gs.ball.lastHitBy = null;
            gs.ball.curve = null;
        };
        
        const spawnBackgroundWall = (player: PlayerState, wallWidth: number, wallHeight: number) => {
            const PADDING = 50;
            const X_SPAWN_AREA_WIDTH = C.CANVAS_WIDTH / 2 - PADDING * 2;
            const Y_SPAWN_AREA_HEIGHT = C.CANVAS_HEIGHT - PADDING * 2 - wallHeight;
            const WALL_SPACING = 15;

            let wallX = 0, wallY = 0, positionFound = false;

            for (let i = 0; i < 50; i++) {
                const candidateX = player.id === 'player1' 
                    ? PADDING + Math.random() * X_SPAWN_AREA_WIDTH
                    : C.CANVAS_WIDTH / 2 + PADDING + Math.random() * X_SPAWN_AREA_WIDTH;
                const candidateY = PADDING + Math.random() * Y_SPAWN_AREA_HEIGHT;

                let overlaps = false;
                for (const existingWall of gs.arena.walls) {
                    if (
                        candidateX < existingWall.x + existingWall.width + WALL_SPACING &&
                        candidateX + wallWidth + WALL_SPACING > existingWall.x &&
                        candidateY < existingWall.y + existingWall.height + WALL_SPACING &&
                        candidateY + wallHeight + WALL_SPACING > existingWall.y
                    ) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    wallX = candidateX;
                    wallY = candidateY;
                    positionFound = true;
                    break;
                }
            }

            if (!positionFound) {
                wallX = player.id === 'player1' 
                    ? PADDING + Math.random() * X_SPAWN_AREA_WIDTH
                    : C.CANVAS_WIDTH / 2 + PADDING + Math.random() * X_SPAWN_AREA_WIDTH;
                wallY = PADDING + Math.random() * Y_SPAWN_AREA_HEIGHT;
            }

            const existingWalls = gs.arena.walls.filter(w => w.ownerId === player.id).length;
            if (existingWalls < 3) {
                 gs.arena.walls.push({
                    id: `wall-bg-${player.id}-${Math.random()}`, ownerId: player.id, x: wallX,
                    y: wallY, width: wallWidth, height: wallHeight,
                    blocksRemaining: 1, maxBlocks: 1, cooldownEndTime: 0, cooldownDuration: 0,
                });
            }
        };

        const applyAugmentToPlayer = (player: PlayerState, augmentId: AugmentID): boolean => {
            const augmentData = ALL_AUGMENTS.find(a => a.id === augmentId);
            if (!augmentData) return false;

            const existingAugment = player.activeAugments.find(a => a.id === augmentId);
            
            if (existingAugment && existingAugment.stacks >= (augmentData.maxStacks ?? 1)) {
                return false; // Augment is maxed out, cannot apply.
            }

            if (existingAugment) {
                existingAugment.stacks++;
            } else {
                player.activeAugments.push({ id: augmentId, stacks: 1 });
            }

            let widthChange = 0;

            // Apply stat changes - simplified from Game.tsx's applyAugment
            switch(augmentData.id){
                // Common
                case 'COMMON_ATTACK_UP': player.stats.attack += 0.02; break;
                case 'COMMON_CRIT_CHANCE': player.stats.critChance += 0.01; break;
                case 'COMMON_MOVE_SPEED': player.stats.moveSpeed += 20; break;
                case 'COMMON_CRIT_FORCE': player.stats.critForce += 0.05; break;
                case 'COMMON_PADDLE_HEIGHT': player.paddle.height += C.AUGMENT_COMMON_PADDLE_HEIGHT_INCREASE; break;
                case 'COMMON_SWIFT_GUARD': player.stats.moveSpeed += 10; player.paddle.height += 5; break;
                case 'COMMON_PRECISE_JAB': player.stats.attack += 0.01; player.stats.critChance += 0.005; break;
                case 'COMMON_SOLID_FOUNDATION': 
                    player.paddle.height += 5; 
                    widthChange = 2;
                    break;

                // Uncommon
                case 'UNCOMMON_AGILITY': player.stats.moveSpeed += 50; break;
                case 'UNCOMMON_PRECISION': player.stats.critChance += 0.05; break;
                case 'UNCOMMON_POWER_STANCE': player.stats.critForce += 0.10; break;
                case 'UNCOMMON_FOCUSED_STRIKE': player.stats.critChance += 0.01; player.stats.attack += 0.01; break;
                case 'UNCOMMON_WIDER_PADDLE': 
                    widthChange = C.AUGMENT_UNCOMMON_PADDLE_WIDTH_INCREASE; 
                    break;
                case 'PADDLE_SIZE_INCREASE': player.paddle.height += C.AUGMENT_PADDLE_HEIGHT_STACK_INCREASE; break;
                case 'UNCOMMON_AGGRESSIVE_STANCE': player.stats.attack += 0.03; player.stats.moveSpeed += 20; break;
                case 'UNCOMMON_NIMBLE_DEFENDER': player.stats.moveSpeed += 40; player.paddle.height += 15; break;
                case 'UNCOMMON_CALCULATED_RISK': player.stats.critChance += 0.03; player.stats.critForce += 0.05; break;

                // Rare
                case 'RARE_SHATTER': player.stats.critForce += 0.25; break;
                case 'RARE_DEADLY_PRECISION': player.stats.critChance += 0.03; player.stats.critForce += 0.10; break;
                case 'RARE_GLASS_CANNON': player.stats.attack += 0.08; player.stats.critForce += 0.20; player.paddle.height -= 15; break;
                case 'RARE_KINETIC_TRANSFER': player.stats.attack += 0.04; player.stats.moveSpeed += 60; break;
                case 'RARE_CRITICAL_FLOW': player.stats.critChance += 0.07; player.stats.attack += 0.02; break;
                case 'RARE_FORTRESS': 
                    player.paddle.height += 40; 
                    widthChange = 8;
                    break;
                
                // Epic
                case 'EPIC_EXECUTIONER': player.stats.attack += 0.05; player.stats.critForce += 0.30; break;
                case 'EPIC_BERSERKERS_FURY': 
                    player.stats.attack += 0.10; 
                    player.stats.critForce += 0.40; 
                    player.paddle.height -= 25;
                    break;
                case 'EPIC_FLOW_STATE': player.stats.moveSpeed += 100; player.stats.critChance += 0.10; break;
                case 'EPIC_UNSTOPPABLE_FORCE': player.stats.attack += 0.05; player.stats.critForce += 0.15; player.stats.moveSpeed += 50; break;
                
                // Legendary
                case 'LEGENDARY_PERFECT_FORM': 
                    player.stats.attack += 0.03;
                    player.stats.critChance += 0.02;
                    player.stats.critForce += 0.10;
                    player.stats.moveSpeed += 30;
                    break;
                case 'LEGENDARY_MULTI_CLONE': 
                    if (!player.isMultiCloneActive) {
                        player.isMultiCloneActive = true; 
                        player.paddle.height /= 3; 
                    }
                    break;
                case 'LEGENDARY_GODSPEED': player.stats.moveSpeed += 200; player.stats.attack += 0.08; break;
                case 'LEGENDARY_ONE_PUNCH': player.stats.attack += 0.15; player.stats.critForce += 0.75; break;
                case 'LEGENDARY_GREAT_WALL': 
                    player.paddle.height += 100; 
                    widthChange = 20;
                    player.stats.moveSpeed += 50; 
                    break;
                case 'UNCOMMON_BARRICADE': 
                case 'RARE_BUNKER':
                case 'EPIC_FORTRESS': {
                    let wallWidth, wallHeight;
                    if (augmentData.id === 'UNCOMMON_BARRICADE') {
                        wallWidth = C.RARE_WALL_WIDTH;
                        wallHeight = C.RARE_WALL_HEIGHT;
                    } else if (augmentData.id === 'RARE_BUNKER') {
                        wallWidth = C.EPIC_WALL_WIDTH;
                        wallHeight = C.EPIC_WALL_HEIGHT;
                    } else { // EPIC_FORTRESS
                        wallWidth = C.LEGENDARY_WALL_WIDTH;
                        wallHeight = C.LEGENDARY_WALL_HEIGHT;
                    }
                    spawnBackgroundWall(player, wallWidth, wallHeight);
                    break;
                }
                case 'LEGENDARY_GRAND_BASTION': {
                    const wallTypes = [
                        { id: 'UNCOMMON_BARRICADE', width: C.RARE_WALL_WIDTH, height: C.RARE_WALL_HEIGHT },
                        { id: 'RARE_BUNKER', width: C.EPIC_WALL_WIDTH, height: C.EPIC_WALL_HEIGHT },
                        { id: 'EPIC_FORTRESS', width: C.LEGENDARY_WALL_WIDTH, height: C.LEGENDARY_WALL_HEIGHT },
                    ];
                    wallTypes.forEach(type => {
                        spawnBackgroundWall(player, type.width, type.height);
                    });
                    break;
                }
            }

            // Apply width change and adjust Player 2's position if necessary
            if (widthChange !== 0) {
                player.paddle.width += widthChange;
                if (player.id === 'player2') {
                    player.paddle.x -= widthChange;
                }
            }
            
            return true; // Successfully applied.
        };

        const applyRandomAugments = (player: PlayerState, augmentPool: AugmentID[]) => {
            let appliedCount = 0;
            let attempts = 0;
            // Try up to 100 times to apply 20 augments, to account for hitting max stacks.
            while (appliedCount < 20 && attempts < 100) {
                const randomAugId = augmentPool[Math.floor(Math.random() * augmentPool.length)];
                if (applyAugmentToPlayer(player, randomAugId)) {
                    appliedCount++;
                }
                attempts++;
            }
        };

        const offensiveAugmentIds: AugmentID[] = [
            'COMMON_ATTACK_UP', 'COMMON_CRIT_CHANCE', 'COMMON_CRIT_FORCE', 
            'UNCOMMON_PRECISION', 'UNCOMMON_POWER_STANCE', 'UNCOMMON_FOCUSED_STRIKE',
            'RARE_DOUBLE_STRIKE', 'RARE_SHATTER', 'RARE_DEADLY_PRECISION',
            'EPIC_EXECUTIONER', 'BALL_SPEED_INCREASE', 'EPIC_CHAIN_LIGHTNING',
            'OPPONENT_PADDLE_SIZE_DECREASE', 'LEGENDARY_BLACK_HOLE', 'LEGENDARY_PERFECT_FORM'
        ];

        const defensiveAugmentIds: AugmentID[] = [
            'COMMON_PADDLE_HEIGHT', 'COMMON_MOVE_SPEED', 'UNCOMMON_AGILITY',
            'UNCOMMON_WIDER_PADDLE', 'PADDLE_SIZE_INCREASE', 'RARE_STICKY_PADDLE',
            'LEGENDARY_MULTI_CLONE', 'RARE_GHOST_BALL', 'EPIC_CURVEBALL',
            'LEGENDARY_PERFECT_FORM', 'UNCOMMON_BARRICADE', 'RARE_BUNKER', 'EPIC_FORTRESS', 'LEGENDARY_GRAND_BASTION'
        ];
        
        applyRandomAugments(gs.players.player1, offensiveAugmentIds);
        applyRandomAugments(gs.players.player2, defensiveAugmentIds);
        
        resetBall(Math.random() > 0.5 ? 1 : -1);
        gs.isPaused = false;


        const createExplosion = (x: number, y: number, color: string, count: number = 20) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                particlesRef.current.push({
                    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    radius: Math.random() * 1.5 + 0.5, color, life: 1, decay: Math.random() * 0.5 + 0.5,
                });
            }
        };

        const updateParticles = (deltaTime: number) => {
            particlesRef.current = particlesRef.current.filter(p => p.life > 0);
            particlesRef.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay * deltaTime;
            });
        };

        const updateGameState = (deltaTime: number, timestamp: number) => {
            if (gs.isPaused) return;

            // AI Logic
            const movePlayer = (player: PlayerState, idleOffset: number) => {
                const aiState = player.id === 'player1' ? aiStateRef.current.player1 : aiStateRef.current.player2;
                let targetY: number;
                const isBallComingTowards = (player.id === 'player1' && gs.ball.vx < 0) || (player.id === 'player2' && gs.ball.vx > 0);

                if (isBallComingTowards) {
                    // Time to make a new decision on where to move?
                    if (timestamp > aiState.nextDecisionTime) {
                        // Decide on a new target position and stick to it for a bit.
                        const AI_ERROR_MARGIN = 40; // A bit of inaccuracy
                        const error = (Math.random() - 0.5) * AI_ERROR_MARGIN;
                        aiState.targetY = gs.ball.y - player.paddle.height / 2 + error;
                        
                        // Re-evaluate target position based on a human-like reaction time.
                        const reactionTime = 120 + Math.random() * 100; // 120ms to 220ms
                        aiState.nextDecisionTime = timestamp + reactionTime;
                    }
                    // Move towards the last decided target.
                    targetY = aiState.targetY;

                } else {
                    // Passively return to a neutral, central position with a slight idle oscillation.
                    // This logic is already smooth, so we can calculate it every frame.
                    const idleAmplitude = 25;
                    const idleFrequency = 0.5; // Radians per second
                    const center = C.CANVAS_HEIGHT / 2 - player.paddle.height / 2;
                    targetY = center + Math.sin((timestamp / 1000) * idleFrequency + idleOffset) * idleAmplitude;
                }

                const distanceToTarget = targetY - player.paddle.y;
                const maxMovement = player.stats.moveSpeed * deltaTime;

                // Clamp movement to max speed, ensuring the paddle respects its moveSpeed stat.
                const movement = Math.max(-maxMovement, Math.min(maxMovement, distanceToTarget));
                player.paddle.y += movement;


                // Clamp paddle position within canvas bounds
                if (player.isMultiCloneActive) {
                    const h = player.paddle.height; const g = C.MULTI_CLONE_GAP;
                    const topBound = h + g; const bottomBound = C.CANVAS_HEIGHT - (h * 2 + g);
                    player.paddle.y = Math.max(topBound, Math.min(player.paddle.y, bottomBound));
                } else {
                    player.paddle.y = Math.max(0, Math.min(player.paddle.y, C.CANVAS_HEIGHT - player.paddle.height));
                }
            };
            // Pass different offsets to break synchronization and create constant, subtle movement.
            movePlayer(gs.players.player1, 0);
            movePlayer(gs.players.player2, Math.PI);

            // Ball Physics
            const { ball } = gs;
            const speedFactor = 60 * deltaTime;
            ball.x += ball.vx * speedFactor;
            ball.y += ball.vy * speedFactor;
            
            if (ball.curve) {
                const curveForce = ball.curve.magnitude * (ball.curve.direction === 'up' ? -1 : 1);
                ball.vy += curveForce;
            }

            // Cap the ball's speed to prevent it from getting too fast from curveballs
            const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
            if (currentSpeed > C.MAX_BALL_SPEED) {
                const scale = C.MAX_BALL_SPEED / currentSpeed;
                ball.vx *= scale;
                ball.vy *= scale;
            }


            if (ball.y - ball.radius < 0 || ball.y + ball.radius > C.CANVAS_HEIGHT) {
                ball.vy = -ball.vy;
                ball.y = Math.max(ball.radius, Math.min(ball.y, C.CANVAS_HEIGHT - ball.radius));
            }

            const checkPaddleCollision = (player: PlayerState) => {
                const paddles = getPlayerPaddles(player);
                for (const paddle of paddles) {
                    const isApproaching = (ball.vx < 0 && player.id === 'player1') || (ball.vx > 0 && player.id === 'player2');
                    if (isApproaching && ball.x - ball.radius < paddle.x + paddle.width && ball.x + ball.radius > paddle.x && ball.y - ball.radius < paddle.y + paddle.height && ball.y + ball.radius > paddle.y) {
                       const intersectY = (paddle.y + (paddle.height / 2)) - ball.y;
                       let normalizedIntersectY = intersectY / (paddle.height / 2);

                       // To prevent perfectly straight shots, add a small random angle if the hit is too central.
                       if (Math.abs(normalizedIntersectY) < 0.1) {
                           normalizedIntersectY = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.2); // Random angle between 0.1 and 0.3
                       }
                       
                       const bounceAngle = normalizedIntersectY * (Math.PI / 4);
                       let newSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2) * player.stats.attack;
                       
                       if (Math.random() < player.stats.critChance) {
                           newSpeed *= (1 + player.stats.critForce);
                           createExplosion(ball.x, ball.y, '#ef4444', 30);
                       }
                       
                       const direction = (player.id === 'player1') ? 1 : -1;
                       ball.vx = direction * newSpeed * Math.cos(bounceAngle);
                       ball.vy = -newSpeed * Math.sin(bounceAngle);
                       ball.lastHitBy = player.id;
                       ball.x = (player.id === 'player1') ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;

                       if (player.activeAugments.some(a => a.id === 'EPIC_CURVEBALL') && Math.random() < 0.25) {
                            ball.curve = { magnitude: 0.2, direction: Math.random() < 0.5 ? 'up' : 'down' };
                       } else {
                           ball.curve = null;
                       }

                       createExplosion(ball.x, ball.y, player.id === 'player1' ? '#22d3ee' : '#fb923c', 25);
                       return;
                    }
                }
            };
            checkPaddleCollision(gs.players.player1);
            checkPaddleCollision(gs.players.player2);

            if (ball.x + ball.radius < 0) {
                resetBall(1);
            } else if (ball.x - ball.radius > C.CANVAS_WIDTH) {
                resetBall(-1);
            }
        };

        const draw = () => {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(C.CANVAS_WIDTH / 2, 0);
            ctx.lineTo(C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Simplified wall drawing
            gs.arena.walls.forEach(wall => {
                ctx.fillStyle = wall.ownerId === 'player1' ? '#22d3ee' : '#fb923c';
                ctx.globalAlpha = 0.8;
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                ctx.globalAlpha = 1.0;
            });

            Object.values(gs.players).forEach((player: PlayerState) => {
                const paddles = getPlayerPaddles(player);
                ctx.fillStyle = player.id === 'player1' ? '#22d3ee' : '#fb923c';
                paddles.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
            });

            particlesRef.current.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.restore();
            });

            ctx.beginPath();
            ctx.arc(gs.ball.x, gs.ball.y, gs.ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
        };

        let animationFrameId: number;
        const gameLoop = (timestamp: number) => {
            if (lastTimestampRef.current === 0) lastTimestampRef.current = timestamp;
            const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
            lastTimestampRef.current = timestamp;

            updateGameState(deltaTime, timestamp);
            updateParticles(deltaTime);
            draw();
            
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <canvas 
            ref={canvasRef}
            width={C.CANVAS_WIDTH} 
            height={C.CANVAS_HEIGHT} 
            className="absolute top-0 left-0 w-full h-full object-cover opacity-40"
        />
    );
};

export default BackgroundGame;