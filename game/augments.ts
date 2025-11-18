import { GameState, PlayerState, AugmentID } from '../types';
import * as C from '../constants';
import { ALL_AUGMENTS, EXODIA_PIECES, DRAGONBALL_PIECES, SPECIAL_WISH_PIECES } from '../data/augments';

function checkForWormholeSynergy(player: PlayerState, gs: GameState) {
    const hasBlackHole = player.activeAugments.some(aug => aug.id === 'LEGENDARY_BLACK_HOLE');
    const hasWhiteHole = player.activeAugments.some(aug => aug.id === 'LEGENDARY_WHITE_HOLE');
    const hasWormHole = player.activeAugments.some(aug => aug.id === 'LEGENDARY_WORM_HOLE');

    if (hasBlackHole && hasWhiteHole && !hasWormHole) {
        player.isWormholeActive = true;
        player.abilities.wormhole.isActive = true;
        player.activeAugments.push({ id: 'LEGENDARY_WORM_HOLE', stacks: 1 });
    }
}

const spawnWall = (
    gs: GameState, 
    player: PlayerState, 
    wallWidth: number, 
    wallHeight: number, 
    maxBlocks: number, 
    idSuffix: string, 
    timestamp: number
) => {
    const PADDING = 50;
    const X_SPAWN_AREA_WIDTH = C.CANVAS_WIDTH / 2 - PADDING * 2;
    const Y_SPAWN_AREA_HEIGHT = C.CANVAS_HEIGHT - PADDING * 2 - wallHeight;
    const WALL_SPACING = 15;

    let wallX = 0;
    let wallY = 0;
    let positionFound = false;
    
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

    gs.arena.walls.push({
        id: `wall-${player.id}-${idSuffix}-${timestamp}-${Math.random()}`,
        ownerId: player.id,
        x: wallX,
        y: wallY,
        width: wallWidth,
        height: wallHeight,
        blocksRemaining: maxBlocks,
        maxBlocks: maxBlocks,
        cooldownEndTime: 0,
        cooldownDuration: C.WALL_COOLDOWN_MS,
    });
};

export const recalculatePlayerPaddleSize = (player: PlayerState) => {
    const oldWidth = player.paddle.width;

    let height = C.INITIAL_PADDLE_HEIGHT;
    let width = C.PADDLE_WIDTH;

    player.activeAugments.forEach(aug => {
        const data = ALL_AUGMENTS.find(a => a.id === aug.id);
        if (!data) return;

        switch (data.id) {
            case 'COMMON_SOLID_FOUNDATION':
                height += 5 * aug.stacks; width += 2 * aug.stacks; break;
            case 'RARE_FORTRESS':
                height += 40 * aug.stacks; width += 8 * aug.stacks; break;
            case 'LEGENDARY_GREAT_WALL':
                height += 100 * aug.stacks; width += 20 * aug.stacks; break;
            case 'COMMON_PADDLE_HEIGHT': height += C.AUGMENT_COMMON_PADDLE_HEIGHT_INCREASE * aug.stacks; break;
            case 'PADDLE_SIZE_INCREASE': height += C.AUGMENT_PADDLE_HEIGHT_STACK_INCREASE * aug.stacks; break;
            case 'COMMON_SWIFT_GUARD': height += 5 * aug.stacks; break;
            case 'UNCOMMON_NIMBLE_DEFENDER': height += 15 * aug.stacks; break;
            case 'RARE_GLASS_CANNON': height -= 15 * aug.stacks; break;
            case 'EPIC_BERSERKERS_FURY': height -= 25 * aug.stacks; break;
            case 'UNCOMMON_WIDER_PADDLE': width += C.AUGMENT_UNCOMMON_PADDLE_WIDTH_INCREASE * aug.stacks; break;
            case 'COMMON_EXODIA_LEFT_ARM': height += 5; break;
            case 'UNCOMMON_EXODIA_RIGHT_ARM': width += 4; break;
            case 'EPIC_EXODIA_RIGHT_LEG': height += 10; break;
            case 'SPECIAL_EXODIA_OBLITERATE':
                height += 15; // 5 from Left Arm + 10 from Right Leg
                width += 4;   // 4 from Right Arm
                break;
            case 'WISH_SHENRONS_BLESSING':
                height *= 2;
                width *= 2;
                break;
        }
    });

    if (player.isMultiCloneActive) {
        height /= 3;
    }
    if (player.isShrunk) {
        height /= 2;
    }

    if (player.id === 'player2') {
        const widthChange = width - oldWidth;
        player.paddle.x -= widthChange;
    }

    player.paddle.height = height;
    player.paddle.width = width;
};

export const applyAugment = (augmentId: AugmentID, player: PlayerState, gs: GameState, timestamp: number) => {
    const augmentData = ALL_AUGMENTS.find(a => a.id === augmentId);
    if (!augmentData) return;

    // After a wish is selected, clear the wish selection state
    if (gs.wishSelection?.playerId === player.id) {
        gs.wishSelection = undefined;
        // Trigger the scatter animation
        gs.dragonballScatterAnimation = { isActive: true, startTime: timestamp };
    }

    const existingAugment = player.activeAugments.find(a => a.id === augmentId);
    if (existingAugment) { existingAugment.stacks++; } 
    else { player.activeAugments.push({ id: augmentId, stacks: 1 }); }
    
    const newStacks = (player.activeAugments.find(a => a.id === augmentId)?.stacks) ?? 1;

    switch(augmentData.id){
        case 'BALL_SPEED_INCREASE':
            player.abilities.fireball.cooldown = C.AUGMENT_FIREBALL_COOLDOWN_MS - (3000 * (newStacks - 1)); break;
        case 'OPPONENT_PADDLE_SIZE_DECREASE':
            player.abilities.shrink.cooldown = C.AUGMENT_SHRINK_COOLDOWN_MS - (5000 * (newStacks - 1)); break;
        case 'EPIC_VANGUARD_ERROR':
            player.abilities.invertControls.cooldown = C.AUGMENT_INVERT_CONTROLS_COOLDOWN_MS - (4000 * (newStacks - 1)); break;
        case 'EPIC_VAC_BANN':
            player.abilities.vacBann.cooldown = C.AUGMENT_VAC_BANN_COOLDOWN_MS - (10000 * (newStacks - 1)); break;
        case 'COMMON_ATTACK_UP': player.stats.attack += 0.02; break;
        case 'COMMON_CRIT_CHANCE': player.stats.critChance += 0.01; break;
        case 'COMMON_MOVE_SPEED': player.stats.moveSpeed += 20; break;
        case 'COMMON_CRIT_FORCE': player.stats.critForce += 0.05; break;
        case 'COMMON_SWIFT_GUARD': player.stats.moveSpeed += 10; break;
        case 'COMMON_PRECISE_JAB': player.stats.attack += 0.01; player.stats.critChance += 0.01; break;
        case 'COMMON_LUCK_UP': player.stats.luck += 0.02; break;
        case 'UNCOMMON_AGILITY': player.stats.moveSpeed += 50; break;
        case 'UNCOMMON_PRECISION': player.stats.critChance += 0.05; break;
        case 'UNCOMMON_POWER_STANCE': player.stats.critForce += 0.10; break;
        case 'UNCOMMON_FOCUSED_STRIKE': player.stats.critChance += 0.01; player.stats.attack += 0.01; break;
        case 'UNCOMMON_AGGRESSIVE_STANCE': player.stats.attack += 0.03; player.stats.moveSpeed += 20; break;
        case 'UNCOMMON_NIMBLE_DEFENDER': player.stats.moveSpeed += 40; break;
        case 'UNCOMMON_CALCULATED_RISK': player.stats.critChance += 0.03; player.stats.critForce += 0.05; break;
        case 'UNCOMMON_LUCK_UP': player.stats.luck += 0.05; break;
        case 'UNCOMMON_BARRICADE':
        case 'RARE_BUNKER':
        case 'EPIC_FORTRESS': {
          let wallWidth, wallHeight, maxBlocks;
          if (augmentData.id === 'UNCOMMON_BARRICADE') {
              wallWidth = C.RARE_WALL_WIDTH; wallHeight = C.RARE_WALL_HEIGHT; maxBlocks = 1;
          } else if (augmentData.id === 'RARE_BUNKER') {
              wallWidth = C.EPIC_WALL_WIDTH; wallHeight = C.EPIC_WALL_HEIGHT; maxBlocks = 2;
          } else {
              wallWidth = C.LEGENDARY_WALL_WIDTH; wallHeight = C.LEGENDARY_WALL_HEIGHT; maxBlocks = 3;
          }
          spawnWall(gs, player, wallWidth, wallHeight, maxBlocks, augmentData.id, timestamp);
          break;
        }
        case 'RARE_SHATTER': player.stats.critForce += 0.25; break;
        case 'RARE_DEADLY_PRECISION': player.stats.critChance += 0.03; player.stats.critForce += 0.10; break;
        case 'RARE_GLASS_CANNON': player.stats.attack += 0.08; player.stats.critForce += 0.20; break;
        case 'RARE_KINETIC_TRANSFER': player.stats.attack += 0.04; player.stats.moveSpeed += 60; break;
        case 'RARE_CRITICAL_FLOW': player.stats.critChance += 0.07; player.stats.attack += 0.02; break;
        case 'RARE_LUCK_UP': player.stats.luck += 0.10; break;
        case 'EPIC_BERSERKERS_FURY': 
          player.stats.attack += 0.10; player.stats.critForce += 0.40; break;
        case 'EPIC_CHAIN_LIGHTNING': 
          player.stats.critChance += 0.05; player.stats.critForce += 0.05; break;
        case 'EPIC_EXECUTIONER': player.stats.attack += 0.05; player.stats.critForce += 0.30; break;
        case 'EPIC_FLOW_STATE': player.stats.moveSpeed += 100; player.stats.critChance += 0.10; break;
        case 'EPIC_UNSTOPPABLE_FORCE': player.stats.attack += 0.05; player.stats.critForce += 0.15; player.stats.moveSpeed += 50; break;
        case 'EPIC_LUCK_UP': player.stats.luck += 0.20; break;
        case 'LEGENDARY_MULTI_CLONE':
          if (!player.isMultiCloneActive) { player.isMultiCloneActive = true; } break;
        case 'LEGENDARY_PERFECT_FORM': player.stats.attack += 0.05; player.stats.critChance += 0.05; player.stats.critForce += 0.25; player.stats.moveSpeed += 50; break;
        case 'LEGENDARY_GODSPEED': player.stats.moveSpeed += 200; player.stats.attack += 0.08; break;
        case 'LEGENDARY_ONE_PUNCH': player.stats.attack += 0.15; player.stats.critForce += 0.75; break;
        case 'LEGENDARY_GREAT_WALL': player.stats.moveSpeed += 50; break;
        case 'LEGENDARY_LUCK_UP': player.stats.luck += 0.30; break;
        case 'LEGENDARY_GRAND_BASTION': {
          const wallTypes = [
              { id: 'UNCOMMON_BARRICADE', width: C.RARE_WALL_WIDTH, height: C.RARE_WALL_HEIGHT, blocks: 1 },
              { id: 'RARE_BUNKER', width: C.EPIC_WALL_WIDTH, height: C.EPIC_WALL_HEIGHT, blocks: 2 },
              { id: 'EPIC_FORTRESS', width: C.LEGENDARY_WALL_WIDTH, height: C.LEGENDARY_WALL_HEIGHT, blocks: 3 },
          ];
          wallTypes.forEach(type => {
              spawnWall(gs, player, type.width, type.height, type.blocks, type.id, timestamp);
          });
          break;
        }
        // Exodia Pieces
        case 'COMMON_EXODIA_LEFT_ARM': player.stats.attack += 0.02; break;
        case 'RARE_EXODIA_LEFT_LEG': player.stats.moveSpeed += 30; break;
        case 'EPIC_EXODIA_RIGHT_LEG': player.stats.moveSpeed += 30; break;
        case 'LEGENDARY_EXODIA_HEAD': 
            player.stats.attack += 0.05;
            player.stats.critChance += 0.05;
            player.stats.critForce += 0.05;
            player.stats.moveSpeed += 20;
            player.stats.luck += 0.05;
            break;
        // Dragonball Pieces
        case 'COMMON_DRAGONBALL_1': player.stats.luck += 0.02; break;
        case 'COMMON_DRAGONBALL_2': player.stats.critChance += 0.01; break;
        case 'UNCOMMON_DRAGONBALL_3': player.stats.moveSpeed += 20; break;
        case 'UNCOMMON_DRAGONBALL_4': player.stats.critForce += 0.05; break;
        case 'RARE_DRAGONBALL_5': player.stats.luck += 0.05; player.stats.critChance += 0.02; break;
        case 'EPIC_DRAGONBALL_6': player.stats.attack += 0.05; break;
        case 'LEGENDARY_DRAGONBALL_7': 
            player.stats.attack += 0.05;
            player.stats.critChance += 0.05;
            player.stats.critForce += 0.05;
            player.stats.moveSpeed += 20;
            player.stats.luck += 0.05;
            break;
        // WISHES
        case 'WISH_SHENRONS_BLESSING':
            player.abilities.shenronsBlessing.isActive = true;
            player.stats.attack *= 1.5;
            player.stats.critChance *= 1.5;
            player.stats.critForce *= 1.5;
            player.stats.moveSpeed *= 1.5;
            player.stats.luck *= 1.5;
            break;
        case 'WISH_KAMEHAMEHA':
            player.abilities.kamehameha.cooldownEndTime = 0;
            break;
        case 'WISH_MIDLINE_SEAL':
             // The ability is now available, cooldown starts at 0.
            player.abilities.midlineSeal.cooldownEndTime = 0;
            break;
    }
    recalculatePlayerPaddleSize(player);
    checkForWormholeSynergy(player, gs);
    checkForExodia(player, gs);
    checkForDragonballs(player, gs, timestamp);
};

export const recalculateCoreStats = (player: PlayerState) => {
    // Reset core stats to their initial values
    player.stats.attack = C.INITIAL_ATTACK;
    player.stats.critChance = C.INITIAL_CRIT_CHANCE;
    player.stats.critForce = C.INITIAL_CRIT_FORCE;
    player.stats.moveSpeed = C.INITIAL_MOVESPEED;
    player.stats.luck = C.INITIAL_LUCK;

    // Re-apply all stat bonuses from the player's current augments
    player.activeAugments.forEach(activeAug => {
        const augmentData = ALL_AUGMENTS.find(a => a.id === activeAug.id);
        if (!augmentData) return;

        for (let i = 0; i < activeAug.stacks; i++) {
            switch (augmentData.id) {
                case 'COMMON_ATTACK_UP': player.stats.attack += 0.02; break;
                case 'COMMON_CRIT_CHANCE': player.stats.critChance += 0.01; break;
                case 'COMMON_MOVE_SPEED': player.stats.moveSpeed += 20; break;
                case 'COMMON_CRIT_FORCE': player.stats.critForce += 0.05; break;
                case 'COMMON_SWIFT_GUARD': player.stats.moveSpeed += 10; break;
                case 'COMMON_PRECISE_JAB': player.stats.attack += 0.01; player.stats.critChance += 0.01; break;
                case 'COMMON_LUCK_UP': player.stats.luck += 0.02; break;
                case 'UNCOMMON_AGILITY': player.stats.moveSpeed += 50; break;
                case 'UNCOMMON_PRECISION': player.stats.critChance += 0.05; break;
                case 'UNCOMMON_POWER_STANCE': player.stats.critForce += 0.10; break;
                case 'UNCOMMON_FOCUSED_STRIKE': player.stats.critChance += 0.01; player.stats.attack += 0.01; break;
                case 'UNCOMMON_AGGRESSIVE_STANCE': player.stats.attack += 0.03; player.stats.moveSpeed += 20; break;
                case 'UNCOMMON_NIMBLE_DEFENDER': player.stats.moveSpeed += 40; break;
                case 'UNCOMMON_CALCULATED_RISK': player.stats.critChance += 0.03; player.stats.critForce += 0.05; break;
                case 'UNCOMMON_LUCK_UP': player.stats.luck += 0.05; break;
                case 'RARE_SHATTER': player.stats.critForce += 0.25; break;
                case 'RARE_DEADLY_PRECISION': player.stats.critChance += 0.03; player.stats.critForce += 0.10; break;
                case 'RARE_GLASS_CANNON': player.stats.attack += 0.08; player.stats.critForce += 0.20; break;
                case 'RARE_KINETIC_TRANSFER': player.stats.attack += 0.04; player.stats.moveSpeed += 60; break;
                case 'RARE_CRITICAL_FLOW': player.stats.critChance += 0.07; player.stats.attack += 0.02; break;
                case 'RARE_LUCK_UP': player.stats.luck += 0.10; break;
                case 'EPIC_BERSERKERS_FURY': player.stats.attack += 0.10; player.stats.critForce += 0.40; break;
                case 'EPIC_CHAIN_LIGHTNING': player.stats.critChance += 0.05; player.stats.critForce += 0.05; break;
                case 'EPIC_EXECUTIONER': player.stats.attack += 0.05; player.stats.critForce += 0.30; break;
                case 'EPIC_FLOW_STATE': player.stats.moveSpeed += 100; player.stats.critChance += 0.10; break;
                case 'EPIC_UNSTOPPABLE_FORCE': player.stats.attack += 0.05; player.stats.critForce += 0.15; player.stats.moveSpeed += 50; break;
                case 'EPIC_LUCK_UP': player.stats.luck += 0.20; break;
                case 'LEGENDARY_PERFECT_FORM': player.stats.attack += 0.05; player.stats.critChance += 0.05; player.stats.critForce += 0.25; player.stats.moveSpeed += 50; break;
                case 'LEGENDARY_GODSPEED': player.stats.moveSpeed += 200; player.stats.attack += 0.08; break;
                case 'LEGENDARY_ONE_PUNCH': player.stats.attack += 0.15; player.stats.critForce += 0.75; break;
                case 'LEGENDARY_GREAT_WALL': player.stats.moveSpeed += 50; break;
                case 'LEGENDARY_LUCK_UP': player.stats.luck += 0.30; break;
                case 'COMMON_EXODIA_LEFT_ARM': player.stats.attack += 0.02; break;
                case 'RARE_EXODIA_LEFT_LEG': player.stats.moveSpeed += 30; break;
                case 'EPIC_EXODIA_RIGHT_LEG': player.stats.moveSpeed += 30; break;
                case 'LEGENDARY_EXODIA_HEAD': 
                    player.stats.attack += 0.05; player.stats.critChance += 0.05;
                    player.stats.critForce += 0.05; player.stats.moveSpeed += 20;
                    player.stats.luck += 0.05;
                    break;
                case 'SPECIAL_EXODIA_OBLITERATE':
                    player.stats.attack += 0.07; // 0.02 (L.Arm) + 0.05 (Head)
                    player.stats.critChance += 0.05; // 0.05 (Head)
                    player.stats.critForce += 0.05; // 0.05 (Head)
                    player.stats.moveSpeed += 80; // 30 (L.Leg) + 30 (R.Leg) + 20 (Head)
                    player.stats.luck += 0.05; // 0.05 (Head)
                    break;
                 // Dragonball pieces re-application (only relevant if they weren't removed)
                 case 'COMMON_DRAGONBALL_1': player.stats.luck += 0.02; break;
                 case 'COMMON_DRAGONBALL_2': player.stats.critChance += 0.01; break;
                 case 'UNCOMMON_DRAGONBALL_3': player.stats.moveSpeed += 20; break;
                 case 'UNCOMMON_DRAGONBALL_4': player.stats.critForce += 0.05; break;
                 case 'RARE_DRAGONBALL_5': player.stats.luck += 0.05; player.stats.critChance += 0.02; break;
                 case 'EPIC_DRAGONBALL_6': player.stats.attack += 0.05; break;
                 case 'LEGENDARY_DRAGONBALL_7': 
                     player.stats.attack += 0.05; player.stats.critChance += 0.05;
                     player.stats.critForce += 0.05; player.stats.moveSpeed += 20;
                     player.stats.luck += 0.05;
                     break;
                case 'SPECIAL_SHENRONS_WISH':
                    player.stats.attack += 0.10; // 5% (DB6) + 5% (DB7)
                    player.stats.critChance += 0.08; // 1% (DB2) + 2% (DB5) + 5% (DB7)
                    player.stats.critForce += 0.10; // 5% (DB4) + 5% (DB7)
                    player.stats.moveSpeed += 40; // 20 (DB3) + 20 (DB7)
                    player.stats.luck += 0.12; // 2% (DB1) + 5% (DB5) + 5% (DB7)
                    break;
                 case 'WISH_SHENRONS_BLESSING':
                    player.stats.attack *= 1.5;
                    player.stats.critChance *= 1.5;
                    player.stats.critForce *= 1.5;
                    player.stats.moveSpeed *= 1.5;
                    player.stats.luck *= 1.5;
                    break;
            }
        }
    });
};

function checkForExodia(player: PlayerState, gs: GameState) {
    // Prevent this from running if the player already has the final form
    if (player.activeAugments.some(a => a.id === 'SPECIAL_EXODIA_OBLITERATE')) {
        return;
    }

    const collectedPieces = new Set(player.activeAugments.map(a => a.id));
    const hasAllPieces = EXODIA_PIECES.every(piece => collectedPieces.has(piece));

    if (hasAllPieces) {
        // Grant a massive score bonus
        player.score += 50;
        gs.floatingTexts.push({ 
            x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2, 
            text: 'EXODIA, OBLITERATE!', color: '#facc15', life: 3, decay: 0.5 
        });
        
        gs.visualEffects.push({
            id: `exodia-summon-${performance.now()}`,
            type: 'exodia_summon',
            from: { x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2 },
            to: { x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2 },
            life: 3,
            decay: 0.5,
        });

        // Consume the pieces and grant the final "Obliterate" augment
        player.activeAugments = player.activeAugments.filter(aug => !EXODIA_PIECES.includes(aug.id));
        player.activeAugments.push({ id: 'SPECIAL_EXODIA_OBLITERATE', stacks: 1 });
        
        // Recalculate all stats from scratch to remove the piece bonuses
        recalculateCoreStats(player);
        recalculatePlayerPaddleSize(player);
    }
}

function checkForDragonballs(player: PlayerState, gs: GameState, timestamp: number) {
    if (player.activeAugments.some(a => SPECIAL_WISH_PIECES.includes(a.id) || a.id === 'SPECIAL_SHENRONS_WISH')) {
        return;
    }

    const collectedPieces = new Set(player.activeAugments.map(a => a.id));
    const hasAllPieces = DRAGONBALL_PIECES.every(piece => collectedPieces.has(piece));

    if (hasAllPieces) {
        player.score += 25;
        gs.floatingTexts.push({ 
            x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2, 
            text: 'Your Wish is Granted!', color: '#fb923c', life: 3, decay: 0.5 
        });
        
        gs.visualEffects.push({
            id: `dragonball-wish-${performance.now()}`,
            type: 'dragonball_wish',
            from: { x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2 },
            to: { x: C.CANVAS_WIDTH / 2, y: C.CANVAS_HEIGHT / 2 },
            life: 1.5,
            decay: 1,
        });

        // Remove the individual pieces
        player.activeAugments = player.activeAugments.filter(aug => !DRAGONBALL_PIECES.includes(aug.id));
        // Add the new consolidated augment
        player.activeAugments.push({ id: 'SPECIAL_SHENRONS_WISH', stacks: 1 });
        
        gs.wishSelection = {
            playerId: player.id,
            wishes: ALL_AUGMENTS.filter(aug => SPECIAL_WISH_PIECES.includes(aug.id))
        };
        
        // Force immediate wish selection
        gs.isAugmentSelectionActive = true;
        gs.pauseStartTime = timestamp;
        
        // Recalculate stats to include the new consolidated augment
        recalculateCoreStats(player);
        recalculatePlayerPaddleSize(player);
    }
}