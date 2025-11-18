// types.ts: Defines all the core data structures and types for the game.

export type PlayerID = 'player1' | 'player2';

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
}

export enum AugmentCategory {
    PADDLE,
    BALL,
    PLAYER_STATS,
    OPPONENT_DEBUFF,
    ARENA,
    SPECIAL
}

export type AugmentID = string;

export interface Augment {
    id: AugmentID;
    name: string;
    description: string;
    rarity: Rarity;
    category: AugmentCategory;
    maxStacks?: number;
}

export interface ActiveAugment {
    id: AugmentID;
    stacks: number;
}

export interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    lastHitBy: PlayerID | null;
    curve: { magnitude: number; direction: 'up' | 'down' } | null;
    isFireball: boolean;
    isInvisible: boolean;
    invisibilityEndTime: number;
    isSticky: boolean;
    stickyPlayerId: PlayerID | null;
    stickyReleaseTime: number;
    stickyReleaseStartTime: number;
    stickyStartY: number | null;
    stickySpeed: number | null;
    lastPaddleHitTime: number;
    isLaunching: boolean;
    launchSourceVx: number;
    launchSourceVy: number;
    targetVx: number;
    targetVy: number;
    launchStartTime: number;
    lastExodiaHitTimestamp: number;
    lastKamehamehaHitTimestamp: number;
}

export interface HistoricalState {
    timestamp: number;
    ball: Ball;
}

export interface BlackHole {
    ownerId: PlayerID;
    x: number;
    y: number;
    strength: number;
    rotationStrength: number;
    rotationAngle: number;
    safeRadius: number;
    endTime: number;
}

export type WhiteHole = BlackHole;


export interface DeployableWall {
    id: string;
    ownerId: PlayerID;
    x: number;
    y: number;
    width: number;
    height: number;
    blocksRemaining: number;
    maxBlocks: number;
    cooldownEndTime: number;
    cooldownDuration: number;
}

export interface ExodiaLaser {
    ownerId: PlayerID;
    y: number;
    height: number;
    endTime: number;
}

export interface ExodiaLaserCharge {
    ownerId: PlayerID;
    y: number;
    endTime: number;
}

export interface KamehamehaCharge {
    ownerId: PlayerID;
    endTime: number;
}

export interface KamehamehaBeam {
    ownerId: PlayerID;
    y: number;
    height: number;
    endTime: number;
}

export interface MidlineSeal {
    ownerId: PlayerID;
    endTime: number;
}

export interface ArenaState {
    obstacles: { x: number, y: number, width: number, height: number, type: 'bumper' | 'meteor' }[];
    gravity: { x: number, y: number };
    modifiers: ('SHRINKING_WALLS' | 'INVERTED_GRAVITY')[];
    blackHoles: BlackHole[];
    whiteHoles: WhiteHole[];
    walls: DeployableWall[];
    exodiaLasers: ExodiaLaser[];
    exodiaLaserCharges: ExodiaLaserCharge[];
    kamehamehaCharges: KamehamehaCharge[];
    kamehamehaBeams: KamehamehaBeam[];
    midlineSeals: MidlineSeal[];
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    life: number;
    decay: number;
}

export interface PlayerState {
    id: PlayerID;
    score: number;
    paddle: {
        x: number;
        y: number;
        width: number;
        height: number;
        targetY: number;
        vy: number;
    };
    stats: {
        attack: number;
        critChance: number;
        critForce: number;
        moveSpeed: number;
        luck: number;
    };
    abilities: {
        fireball: { cooldown: number; cooldownEndTime: number; isActive: boolean; bannedUntil?: number; };
        shrink: { cooldown: number; cooldownEndTime: number; activeUntil: number; bannedUntil?: number; };
        blackHole: { cooldown: number; cooldownEndTime: number; activeUntil: number; bannedUntil?: number; };
        whiteHole: { cooldown: number; cooldownEndTime: number; activeUntil: number; bannedUntil?: number; };
        invertControls: { cooldown: number; cooldownEndTime: number; activeUntil: number; bannedUntil?: number; };
        vacBann: { cooldown: number; cooldownEndTime: number; isArmed: boolean };
        aimbot: { cooldown: number; cooldownEndTime: number; charges: number; };
        lastStand: { isActive: boolean; pointsConceded: number; };
        wormhole: { isActive: boolean; };
        exodiaLaser: { cooldown: number; cooldownEndTime: number; };
        kamehameha: { cooldown: number; cooldownEndTime: number; };
        midlineSeal: { cooldown: number; cooldownEndTime: number; };
        shenronsBlessing: { isActive: boolean; };
    };
    activeAugments: ActiveAugment[];
    isAimbotActive: boolean;
    isWormholeActive: boolean;
    isShrunk: boolean;
    shrinkEndTime: number;
    areControlsInverted: boolean;
    invertControlsEndTime: number;
    doubleStrikeReady: boolean;
    isMultiCloneActive: boolean;
    isStunned: boolean;
    stunEndTime: number;
}

export interface VisualEffect {
    id: string;
    type: 'chain_lightning' | 'wormhole_teleport' | 'exodia_summon' | 'exodia_laser_hit' | 'dragonball_wish' | 'ki_aura_teleport' | 'midline_seal_block';
    from: { x: number, y: number };
    to: { x: number, y: number };
    life: number;
    decay: number;
}

export interface TimeWarpState {
    isActive: boolean;
    startTime: number;
    duration: number;
    minTimeScale: number;
    rampDownDuration: number;
    holdDuration: number;
    rampUpDuration: number;
    impactX: number;
    impactY: number;
}

export interface BallSpawnState {
  isActive: boolean;
  startTime: number;
  duration: number; // in milliseconds
  p1SourceX: number;
  p2SourceX: number;
}

export interface GameState {
    hostTimestamp: number; // Will now be serverTimestamp
    ball: Ball;
    players: {
        player1: PlayerState;
        player2: PlayerState;
    };
    isPaused: boolean;
    pauseStartTime: number;
    arena: ArenaState;
    floatingTexts: FloatingText[];
    visualEffects: VisualEffect[];
    countdown: number | null;
    countdownStartTime: number;
    ballSpawn: BallSpawnState;
    augmentRoundCounter: number;
    pointsSinceLastAugment: number;
    pointsNeededForNextAugment: number;
    timeWarp: TimeWarpState;
    isEndlessMode: boolean;
    isAugmentSelectionActive: boolean;
    pendingAugmentSelectionTimestamp: number | null;
    pendingBallSpawnTimestamp: number | null;
    augmentSelectionData: {
        player1Augments: Augment[];
        player2Augments: Augment[];
        player1Rerolls: number;
        player2Rerolls: number;
    } | null;
    wishSelection?: {
        playerId: PlayerID;
        wishes: Augment[];
    };
    dragonballScatterAnimation: {
        isActive: boolean;
        startTime: number;
    } | null;
}

// --- WebSocket Message Types ---

// Client to Server
export enum ClientMessageType {
    CREATE_GAME = 'CREATE_GAME',
    JOIN_GAME = 'JOIN_GAME',
    PADDLE_MOVE = 'PADDLE_MOVE',
    AUGMENT_CHOSEN = 'AUGMENT_CHOSEN',
    REROLL_AUGMENT = 'REROLL_AUGMENT',
    ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
    POST_GAME_CHOICE = 'POST_GAME_CHOICE',
    PONG = 'PONG',
}

export interface CreateGameMessage { type: ClientMessageType.CREATE_GAME; }
export interface JoinGameMessage { type: ClientMessageType.JOIN_GAME; payload: { gameId: string }; }
export interface PaddleMoveMessage { type: ClientMessageType.PADDLE_MOVE; payload: { y: number; vy: number; clientTimestamp: number; }; }
export interface AugmentChosenMessage { type: ClientMessageType.AUGMENT_CHOSEN; payload: { augmentId: AugmentID }; }
// FIX: Renamed interface from RerolledAugmentMessage to RerollAugmentMessage to match the type union.
export interface RerollAugmentMessage { type: ClientMessageType.REROLL_AUGMENT; payload: { slotIndex: number }; }
export interface ActivateAbilityMessage { type: ClientMessageType.ACTIVATE_ABILITY; payload: { abilityId: 'aimbot'; isDevToggle?: boolean }; }
export interface PostGameChoiceMessage { type: ClientMessageType.POST_GAME_CHOICE; payload: { choice: 'menu' | 'endless' }; }
export interface PongMessage { type: ClientMessageType.PONG; payload: { timestamp: number }; }

export type ClientMessage =
    | CreateGameMessage | JoinGameMessage | PaddleMoveMessage | AugmentChosenMessage
    | RerollAugmentMessage | ActivateAbilityMessage | PostGameChoiceMessage | PongMessage;


// Server to Client
export enum ServerMessageType {
    GAME_CREATED = 'GAME_CREATED',
    JOIN_SUCCESS = 'JOIN_SUCCESS',
    GAME_START = 'GAME_START',
    GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
    PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
    GAME_OVER = 'GAME_OVER',
    RESET_TO_MENU = 'RESET_TO_MENU',
    ERROR = 'ERROR',
    PING = 'PING',
}

export interface GameCreatedMessage { type: ServerMessageType.GAME_CREATED; payload: { gameId: string; }; }
export interface JoinSuccessMessage { type: ServerMessageType.JOIN_SUCCESS; payload: { gameId: string; localPlayerId: PlayerID; }; }
export interface GameStartMessage { type: ServerMessageType.GAME_START; }
export interface GameStateUpdateMessage { type: ServerMessageType.GAME_STATE_UPDATE; payload: GameState; }
export interface PlayerDisconnectedMessage { type: ServerMessageType.PLAYER_DISCONNECTED; }
export interface GameOverMessage { type: ServerMessageType.GAME_OVER; payload: { winner: PlayerID }; }
export interface ResetToMenuMessage { type: ServerMessageType.RESET_TO_MENU; }
export interface ErrorMessage { type: ServerMessageType.ERROR; payload: { message: string }; }
export interface PingMessage { type: ServerMessageType.PING; payload: { timestamp: number }; }


export type ServerMessage =
    | GameCreatedMessage | JoinSuccessMessage | GameStartMessage | GameStateUpdateMessage
    | PlayerDisconnectedMessage | GameOverMessage | ResetToMenuMessage | ErrorMessage | PingMessage;