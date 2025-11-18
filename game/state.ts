import { GameState, PlayerState, PlayerID } from '../types';
import * as C from '../constants';

export function clearHostStateBuffer() {
    // This is a placeholder for the actual buffer, which lives in engine.ts
    // to avoid circular dependencies. A more advanced state management
    // solution might handle this differently.
}

export function createInitialGameState(options?: { devAimbot?: boolean }): GameState {
    const createPlayer = (id: PlayerID, xPos: number): PlayerState => {
      const player: PlayerState = {
        id,
        score: 0,
        paddle: { x: xPos, y: C.CANVAS_HEIGHT / 2, width: C.PADDLE_WIDTH, height: C.INITIAL_PADDLE_HEIGHT, targetY: C.CANVAS_HEIGHT / 2, vy: 0 },
        stats: { attack: C.INITIAL_ATTACK, critChance: C.INITIAL_CRIT_CHANCE, critForce: C.INITIAL_CRIT_FORCE, moveSpeed: C.INITIAL_MOVESPEED, luck: C.INITIAL_LUCK },
        abilities: {
          fireball: { cooldown: C.AUGMENT_FIREBALL_COOLDOWN_MS, cooldownEndTime: 0, isActive: false },
          shrink: { cooldown: C.AUGMENT_SHRINK_COOLDOWN_MS, cooldownEndTime: 0, activeUntil: 0 },
          blackHole: { cooldown: C.AUGMENT_BLACK_HOLE_COOLDOWN_MS, cooldownEndTime: 0, activeUntil: 0 },
          whiteHole: { cooldown: C.AUGMENT_WHITE_HOLE_COOLDOWN_MS, cooldownEndTime: 0, activeUntil: 0 },
          invertControls: { cooldown: C.AUGMENT_INVERT_CONTROLS_COOLDOWN_MS, cooldownEndTime: 0, activeUntil: 0 },
          vacBann: { cooldown: C.AUGMENT_VAC_BANN_COOLDOWN_MS, cooldownEndTime: 0, isArmed: false },
          aimbot: { cooldown: C.AUGMENT_AIMBOT_COOLDOWN_MS, cooldownEndTime: 0, charges: 0 },
          lastStand: { isActive: false, pointsConceded: 0 },
          wormhole: { isActive: false },
          exodiaLaser: { cooldown: C.EXODIA_LASER_COOLDOWN_MS, cooldownEndTime: 0 },
          kamehameha: { cooldown: 10000, cooldownEndTime: 0 },
          midlineSeal: { cooldown: 35000, cooldownEndTime: 0 },
          shenronsBlessing: { isActive: false },
        },
        activeAugments: [],
        isAimbotActive: false,
        isWormholeActive: false,
        isShrunk: false,
        shrinkEndTime: 0,
        areControlsInverted: false,
        invertControlsEndTime: 0,
        doubleStrikeReady: false,
        isMultiCloneActive: false,
        isStunned: false,
        stunEndTime: 0,
      };

      if (options?.devAimbot) {
        player.activeAugments.push({ id: 'LEGENDARY_AIMBOT', stacks: 1 });
      }

      return player;
    };

    return {
      hostTimestamp: 0,
      ball: { 
        x: C.CANVAS_WIDTH / 2, y: -100,
        vx: 0, vy: 0, radius: C.BALL_RADIUS, 
        lastHitBy: null, curve: null, isFireball: false, isInvisible: false, invisibilityEndTime: 0, isSticky: false, stickyPlayerId: null, stickyReleaseTime: 0, stickyReleaseStartTime: 0, stickyStartY: null, stickySpeed: null, lastPaddleHitTime: 0,
        isLaunching: false, launchSourceVx: 0, launchSourceVy: 0, targetVx: 0, targetVy: 0, launchStartTime: 0,
        lastExodiaHitTimestamp: 0,
        lastKamehamehaHitTimestamp: 0,
      },
      players: {
        player1: createPlayer('player1', C.PADDLE_WIDTH),
        player2: createPlayer('player2', C.CANVAS_WIDTH - C.PADDLE_WIDTH * 2)
      },
      isPaused: true,
      pauseStartTime: 0,
      arena: {
        obstacles: [],
        gravity: { x: 0, y: 0 },
        modifiers: [],
        blackHoles: [],
        whiteHoles: [],
        walls: [],
        exodiaLasers: [],
        exodiaLaserCharges: [],
        kamehamehaCharges: [],
        kamehamehaBeams: [],
        midlineSeals: [],
      },
      floatingTexts: [],
      visualEffects: [],
      countdown: null,
      countdownStartTime: 0,
      ballSpawn: { isActive: false, startTime: 0, duration: 1500, p1SourceX: C.CANVAS_WIDTH * 0.25, p2SourceX: C.CANVAS_WIDTH * 0.75 },
      augmentRoundCounter: 0,
      pointsSinceLastAugment: 0,
      pointsNeededForNextAugment: 1,
      timeWarp: { isActive: false, startTime: 0, duration: 0, minTimeScale: 1, rampDownDuration: 0, holdDuration: 0, rampUpDuration: 0, impactX: 0, impactY: 0 },
      isEndlessMode: false,
      isAugmentSelectionActive: false,
      pendingAugmentSelectionTimestamp: null,
      pendingBallSpawnTimestamp: null,
      augmentSelectionData: null,
      dragonballScatterAnimation: null,
    };
}