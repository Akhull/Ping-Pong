import { Augment, Rarity, AugmentCategory, AugmentID, ActiveAugment } from '../types';

// The full list of augments, with made-up but plausible names and descriptions where missing.
export const ALL_AUGMENTS: Augment[] = [
    // Common
    { id: 'COMMON_PADDLE_HEIGHT', name: "Paddle Maintenance", description: "+10 Paddle Height.", rarity: Rarity.Common, category: AugmentCategory.PADDLE, maxStacks: Infinity },
    { id: 'COMMON_ATTACK_UP', name: "Sharpened Edge", description: "+2% Attack Speed.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_CRIT_CHANCE', name: "Keen Eye", description: "+1% Critical Hit Chance.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_MOVE_SPEED', name: "Lightweight Frame", description: "+20 Movement Speed.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_CRIT_FORCE', name: "Heavy Handed", description: "+5% Critical Hit Force.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_SWIFT_GUARD', name: "Swift Guard", description: "+10 Movement Speed and +5 Paddle Height.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_PRECISE_JAB', name: "Precise Jab", description: "+1% Attack Speed and +1% Critical Hit Chance.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_SOLID_FOUNDATION', name: "Solid Foundation", description: "+5 Paddle Height and +2 Paddle Width.", rarity: Rarity.Common, category: AugmentCategory.PADDLE, maxStacks: Infinity },
    { id: 'COMMON_LUCK_UP', name: "Four-Leaf Clover", description: "+2% Luck.", rarity: Rarity.Common, category: AugmentCategory.PLAYER_STATS, maxStacks: Infinity },
    { id: 'COMMON_EXODIA_LEFT_ARM', name: "Left Arm of the Forbidden One", description: "A piece of a forgotten power. Grants +2% Attack Speed and +5 Paddle Height.", rarity: Rarity.Common, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'COMMON_DRAGONBALL_1', name: "One-Star Dragonball", description: "A crystal sphere with a single star. You feel a bit luckier. Grants +2% Luck.", rarity: Rarity.Common, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'COMMON_DRAGONBALL_2', name: "Two-Star Dragonball", description: "A crystal sphere with two stars. Your aim feels steadier. Grants +1% Critical Hit Chance.", rarity: Rarity.Common, category: AugmentCategory.SPECIAL, maxStacks: 1 },

    // Uncommon
    { id: 'UNCOMMON_AGILITY', name: "Agility Training", description: "+50 Movement Speed.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_PRECISION', name: "Precision Tuning", description: "+5% Critical Hit Chance.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'PADDLE_SIZE_INCREASE', name: "Paddle Expansion", description: "+25 Paddle Height.", rarity: Rarity.Uncommon, category: AugmentCategory.PADDLE, maxStacks: 5 },
    { id: 'UNCOMMON_POWER_STANCE', name: "Power Stance", description: "+10% Critical Hit Force.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_FOCUSED_STRIKE', name: "Focused Strike", description: "+1% Attack Speed and +1% Critical Hit Chance.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_WIDER_PADDLE', name: "Wider Paddle", description: "+5 Paddle Width.", rarity: Rarity.Uncommon, category: AugmentCategory.PADDLE, maxStacks: 5 },
    { id: 'UNCOMMON_AGGRESSIVE_STANCE', name: "Aggressive Stance", description: "+3% Attack Speed and +20 Movement Speed.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_NIMBLE_DEFENDER', name: "Nimble Defender", description: "+40 Movement Speed and +15 Paddle Height.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_CALCULATED_RISK', name: "Calculated Risk", description: "+3% Critical Hit Chance and +5% Critical Hit Force.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_LUCK_UP', name: "Lucky Horseshoe", description: "+5% Luck.", rarity: Rarity.Uncommon, category: AugmentCategory.PLAYER_STATS, maxStacks: 5 },
    { id: 'UNCOMMON_BARRICADE', name: "Barricade", description: "Spawns a small defensive wall on your side of the arena. Breaks after 1 hit.", rarity: Rarity.Uncommon, category: AugmentCategory.ARENA, maxStacks: 3 },
    { id: 'UNCOMMON_EXODIA_RIGHT_ARM', name: "Right Arm of the Forbidden One", description: "A piece of a forgotten power. Grants +4 Paddle Width.", rarity: Rarity.Uncommon, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'UNCOMMON_DRAGONBALL_3', name: "Three-Star Dragonball", description: "A crystal sphere with three stars. You feel lighter on your feet. Grants +20 Movement Speed.", rarity: Rarity.Uncommon, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'UNCOMMON_DRAGONBALL_4', name: "Four-Star Dragonball", description: "A crystal sphere with four stars. Your hits feel more impactful. Grants +5% Critical Hit Force.", rarity: Rarity.Uncommon, category: AugmentCategory.SPECIAL, maxStacks: 1 },

    // Rare
    { id: 'RARE_DOUBLE_STRIKE', name: "Double Strike", description: "After scoring a point, your next hit is 50% faster.", rarity: Rarity.Rare, category: AugmentCategory.BALL, maxStacks: 1 },
    { id: 'RARE_GHOST_BALL', name: "Ghost Ball", description: "The ball has a 25% chance to become briefly invisible after crossing the center line.", rarity: Rarity.Rare, category: AugmentCategory.BALL, maxStacks: 1 },
    { id: 'RARE_STICKY_PADDLE', name: "Sticky Paddle", description: "The ball sticks to your paddle for a moment, allowing you to aim your return shot.", rarity: Rarity.Rare, category: AugmentCategory.PADDLE, maxStacks: 1 },
    { id: 'RARE_SHATTER', name: "Shatter", description: "+25% Critical Hit Force.", rarity: Rarity.Rare, category: AugmentCategory.PLAYER_STATS, maxStacks: 3 },
    { id: 'RARE_DEADLY_PRECISION', name: "Deadly Precision", description: "+3% Critical Hit Chance and +10% Critical Hit Force.", rarity: Rarity.Rare, category: AugmentCategory.PLAYER_STATS, maxStacks: 3 },
    { id: 'RARE_GLASS_CANNON', name: "Glass Cannon", description: "+8% Attack Speed and +20% Critical Hit Force, but -15 Paddle Height.", rarity: Rarity.Rare, category: AugmentCategory.PLAYER_STATS, maxStacks: 3 },
    { id: 'RARE_KINETIC_TRANSFER', name: "Kinetic Transfer", description: "+4% Attack Speed and +60 Movement Speed.", rarity: Rarity.Rare, category: AugmentCategory.PLAYER_STATS, maxStacks: 3 },
    { id: 'RARE_CRITICAL_FLOW', name: "Critical Flow", description: "+7% Critical Hit Chance and +2% Attack Speed.", rarity: Rarity.Rare, category: AugmentCategory.PLAYER_STATS, maxStacks: 3 },
    { id: 'RARE_FORTRESS', name: "Fortress", description: "+40 Paddle Height and +8 Paddle Width.", rarity: Rarity.Rare, category: AugmentCategory.PADDLE, maxStacks: 3 },
    { id: 'RARE_LAST_STAND', name: "Last Stand", description: "After conceding 5 points, gain a one-time goal-line save.", rarity: Rarity.Rare, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'RARE_LUCK_UP', name: "Rabbit's Foot", description: "+10% Luck.", rarity: Rarity.Rare, category: AugmentCategory.PLAYER_STATS, maxStacks: 3 },
    { id: 'RARE_BUNKER', name: "Bunker", description: "Spawns a medium defensive wall on your side. Breaks after 2 hits.", rarity: Rarity.Rare, category: AugmentCategory.ARENA, maxStacks: 2 },
    { id: 'RARE_EXODIA_LEFT_LEG', name: "Left Leg of the Forbidden One", description: "A piece of a forgotten power. Grants +30 Movement Speed.", rarity: Rarity.Rare, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'RARE_DRAGONBALL_5', name: "Five-Star Dragonball", description: "A crystal sphere with five stars. Fortune and precision are with you. Grants +5% Luck and +2% Critical Hit Chance.", rarity: Rarity.Rare, category: AugmentCategory.SPECIAL, maxStacks: 1 },

    // Epic
    { id: 'BALL_SPEED_INCREASE', name: "Fireball", description: "Gain an active ability to launch a high-speed Fireball. Stacks reduce cooldown.", rarity: Rarity.Epic, category: AugmentCategory.SPECIAL, maxStacks: 5 },
    { id: 'OPPONENT_PADDLE_SIZE_DECREASE', name: "Shrink Ray", description: "Gain an active ability to shrink your opponent's paddle. Stacks reduce cooldown.", rarity: Rarity.Epic, category: AugmentCategory.OPPONENT_DEBUFF, maxStacks: 5 },
    { id: 'EPIC_CURVEBALL', name: "Curveball", description: "Your hits have a 25% chance to apply a curve to the ball.", rarity: Rarity.Epic, category: AugmentCategory.BALL, maxStacks: 1 },
    { id: 'EPIC_CHAIN_LIGHTNING', name: "Chain Lightning", description: "Critical hits have a chance to chain lightning to the opponent, briefly stunning them.", rarity: Rarity.Epic, category: AugmentCategory.OPPONENT_DEBUFF, maxStacks: 3 },
    { id: 'EPIC_VAC_BANN', name: "VAC Bann", description: "Gain a shield that blocks one enemy ability. Recharges on a long cooldown.", rarity: Rarity.Epic, category: AugmentCategory.SPECIAL, maxStacks: 3 },
    { id: 'EPIC_VANGUARD_ERROR', name: "Vanguard Error", description: "Gain an active ability to briefly invert your opponent's controls. Starts with a long cooldown. Stacks reduce cooldown.", rarity: Rarity.Epic, category: AugmentCategory.OPPONENT_DEBUFF, maxStacks: 3 },
    { id: 'EPIC_EXECUTIONER', name: "Executioner", description: "+5% Attack Speed and +30% Critical Hit Force.", rarity: Rarity.Epic, category: AugmentCategory.PLAYER_STATS, maxStacks: 2 },
    { id: 'EPIC_BERSERKERS_FURY', name: "Berserker's Fury", description: "+10% Attack Speed and +40% Critical Hit Force, but -25 Paddle Height.", rarity: Rarity.Epic, category: AugmentCategory.PLAYER_STATS, maxStacks: 2 },
    { id: 'EPIC_FLOW_STATE', name: "Flow State", description: "+100 Movement Speed and +10% Critical Hit Chance.", rarity: Rarity.Epic, category: AugmentCategory.PLAYER_STATS, maxStacks: 2 },
    { id: 'EPIC_UNSTOPPABLE_FORCE', name: "Unstoppable Force", description: "+5% Attack Speed, +15% Critical Hit Force, and +50 Movement Speed.", rarity: Rarity.Epic, category: AugmentCategory.PLAYER_STATS, maxStacks: 2 },
    { id: 'EPIC_LUCK_UP', name: "Wishing Well", description: "+20% Luck.", rarity: Rarity.Epic, category: AugmentCategory.PLAYER_STATS, maxStacks: 2 },
    { id: 'EPIC_FORTRESS', name: "Mobile Fortress", description: "Spawns a large defensive wall on your side. Breaks after 3 hits.", rarity: Rarity.Epic, category: AugmentCategory.ARENA, maxStacks: 1 },
    { id: 'EPIC_EXODIA_RIGHT_LEG', name: "Right Leg of the Forbidden One", description: "A piece of a forgotten power. Grants +30 Movement Speed and +10 Paddle Height.", rarity: Rarity.Epic, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'EPIC_DRAGONBALL_6', name: "Six-Star Dragonball", description: "A crystal sphere with six stars. You feel the energy flowing faster. Grants +5% Attack Speed.", rarity: Rarity.Epic, category: AugmentCategory.SPECIAL, maxStacks: 1 },

    // Legendary
    { id: 'LEGENDARY_AIMBOT', name: "Aimbot", description: "Press SPACE to activate Aimbot for 3 hits, causing your paddle to perfectly track the ball.", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'LEGENDARY_BLACK_HOLE', name: "Black Hole", description: "Periodically spawns a black hole on the opponent's side, pulling the ball towards it.", rarity: Rarity.Legendary, category: AugmentCategory.ARENA, maxStacks: 1 },
    // FIX: Corrected typo in augment ID.
    { id: 'LEGENDARY_WHITE_HOLE', name: "White Hole", description: "Periodically spawns a massive white hole behind your goal, violently repelling the ball.", rarity: Rarity.Legendary, category: AugmentCategory.ARENA, maxStacks: 1 },
    { id: 'LEGENDARY_WORM_HOLE', name: "Wormhole", description: "Bonus: Bend space-time. Your shots can now travel through the top and bottom of the arena.", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'LEGENDARY_MULTI_CLONE', name: "Multi-Clone Jutsu", description: "Your paddle splits into three, covering more area. Individual paddle height is reduced.", rarity: Rarity.Legendary, category: AugmentCategory.PADDLE, maxStacks: 1 },
    { id: 'LEGENDARY_PERFECT_FORM', name: "Perfect Form", description: "A master's technique. +5% Attack, +5% Crit Chance, +25% Crit Force, +50 Move Speed.", rarity: Rarity.Legendary, category: AugmentCategory.PLAYER_STATS, maxStacks: 1 },
    { id: 'LEGENDARY_GODSPEED', name: "Godspeed", description: "+200 Movement Speed and +8% Attack Speed.", rarity: Rarity.Legendary, category: AugmentCategory.PLAYER_STATS, maxStacks: 1 },
    { id: 'LEGENDARY_ONE_PUNCH', name: "One Punch", description: "+15% Attack Speed and +75% Critical Hit Force.", rarity: Rarity.Legendary, category: AugmentCategory.PLAYER_STATS, maxStacks: 1 },
    { id: 'LEGENDARY_GREAT_WALL', name: "The Great Wall", description: "+100 Paddle Height, +20 Paddle Width, and +50 Movement Speed.", rarity: Rarity.Legendary, category: AugmentCategory.PADDLE, maxStacks: 1 },
    { id: 'LEGENDARY_LUCK_UP', name: "Divine Intervention", description: "+30% Luck.", rarity: Rarity.Legendary, category: AugmentCategory.PLAYER_STATS, maxStacks: 1 },
    { id: 'LEGENDARY_GRAND_BASTION', name: "Grand Bastion", description: "Spawns one of each type of defensive wall on your side of the arena.", rarity: Rarity.Legendary, category: AugmentCategory.ARENA, maxStacks: 1 },
    { id: 'LEGENDARY_EXODIA_HEAD', name: "Exodia the Forbidden One", description: "The final piece of a forgotten power. Grants +5% to all stats. Is something about to happen?", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'SPECIAL_EXODIA_OBLITERATE', name: "Exodia Obliterate", description: "You have assembled all five pieces and gained an insurmountable advantage.", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'LEGENDARY_DRAGONBALL_7', name: "Seven-Star Dragonball", description: "The final crystal sphere. Its power courses through you. Grants +5% to all stats. A wish is close...", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'SPECIAL_SHENRONS_WISH', name: "Shenron's Wish", description: "The combined power of the seven Dragonballs, granting their cumulative bonuses.", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    
    // Dragonball Wishes
    { id: 'WISH_SHENRONS_BLESSING', name: "Shenron's Blessing", description: "Permanently gain +50% to all base stats, double paddle height and width, and your hits gain a 'Ki-Aura' that speeds up the ball.", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'WISH_KAMEHAMEHA', name: "Kamehameha", description: "Automatically charges and fires an unstoppable energy beam that guarantees a point. (10s Cooldown)", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
    { id: 'WISH_MIDLINE_SEAL', name: "Shenron's Barrier", description: "Automatically seal the midline for 5 seconds. Your shots pass through, but the opponent's are blocked. (35s Cooldown)", rarity: Rarity.Legendary, category: AugmentCategory.SPECIAL, maxStacks: 1 },
];

export const EXODIA_PIECES: AugmentID[] = [
    'COMMON_EXODIA_LEFT_ARM',
    'UNCOMMON_EXODIA_RIGHT_ARM',
    'RARE_EXODIA_LEFT_LEG',
    'EPIC_EXODIA_RIGHT_LEG',
    'LEGENDARY_EXODIA_HEAD'
];

export const DRAGONBALL_PIECES: AugmentID[] = [
    'COMMON_DRAGONBALL_1',
    'COMMON_DRAGONBALL_2',
    'UNCOMMON_DRAGONBALL_3',
    'UNCOMMON_DRAGONBALL_4',
    'RARE_DRAGONBALL_5',
    'EPIC_DRAGONBALL_6',
    'LEGENDARY_DRAGONBALL_7'
];

export const SPECIAL_WISH_PIECES: AugmentID[] = [
    'WISH_SHENRONS_BLESSING',
    'WISH_KAMEHAMEHA',
    'WISH_MIDLINE_SEAL'
];

const getRarityByChance = (luck: number): Rarity => {
    // Base probabilities. These will be modified by luck.
    const chances = {
        [Rarity.Common]: 0.65,
        [Rarity.Uncommon]: 0.25,
        [Rarity.Rare]: 0.08,
        [Rarity.Epic]: 0.02,
        [Rarity.Legendary]: 0.00,
    };

    // Luck of 0 means absolutely no chance for Legendary augments.
    if (luck > 0) {
        // --- Calculate the bonus probabilities from luck ---
        // Luck has a powerful, non-linear effect on higher rarities.
        
        // More impactful luck scaling
        const legendaryBonus = Math.pow(luck, 1.5) * 0.20; // Max +20% at 100% luck
        chances[Rarity.Legendary] += legendaryBonus;

        const epicBonus = Math.pow(luck, 1.2) * 0.15; // Max +15% at 100% luck
        chances[Rarity.Epic] += epicBonus;

        const rareBonus = luck * 0.25; // Max +25% at 100% luck
        chances[Rarity.Rare] += rareBonus;

        const uncommonBonus = luck * 0.20; // Max +20% at 100% luck
        chances[Rarity.Uncommon] += uncommonBonus;

        // --- Subtract the total bonus from the Common chance ---
        const totalBonus = legendaryBonus + epicBonus + rareBonus + uncommonBonus;
        chances[Rarity.Common] -= totalBonus;

        // Ensure common chance doesn't drop below a minimum threshold.
        const MIN_COMMON_CHANCE = 0.10;
        if (chances[Rarity.Common] < MIN_COMMON_CHANCE) {
            // This case handles extreme luck values. It prevents common augments from disappearing entirely
            // and normalizes the probabilities of other rarities to ensure the total is still 100%.
            const deficit = MIN_COMMON_CHANCE - chances[Rarity.Common];
            chances[Rarity.Common] = MIN_COMMON_CHANCE;
            
            const totalOtherChances = chances[Rarity.Uncommon] + chances[Rarity.Rare] + chances[Rarity.Epic] + chances[Rarity.Legendary];
            if (totalOtherChances > 0) {
                const scaleFactor = (1 - MIN_COMMON_CHANCE) / totalOtherChances;
                chances[Rarity.Uncommon] *= scaleFactor;
                chances[Rarity.Rare] *= scaleFactor;
                chances[Rarity.Epic] *= scaleFactor;
                chances[Rarity.Legendary] *= scaleFactor;
            }
        }
    }

    const rand = Math.random();
    let cumulative = 0;

    // Use a specific order to ensure correct probability distribution
    const rarityOrder: Rarity[] = [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary];

    for (const rarity of rarityOrder) {
        cumulative += chances[rarity as keyof typeof chances];
        if (rand < cumulative) {
            return rarity;
        }
    }
    
    return Rarity.Common; // Fallback
};

// Function to get a single random augment based on rarity and filters
const getRandomAugment = (
    rarity: Rarity,
    playerAugments: ActiveAugment[],
    excludedIds: Set<AugmentID>,
    allowedAugmentsPool: Set<AugmentID> | null,
): Augment | null => {
    
    const hasExodiaObliterate = playerAugments.some(a => a.id === 'SPECIAL_EXODIA_OBLITERATE');
    const hasAnyWish = playerAugments.some(a => SPECIAL_WISH_PIECES.includes(a.id) || a.id === 'SPECIAL_SHENRONS_WISH');

    const availableAugments = ALL_AUGMENTS.filter(augment => {
        if (augment.id === 'LEGENDARY_WORM_HOLE') return false; // Exclude bonus augments
        if (augment.id === 'SPECIAL_EXODIA_OBLITERATE') return false; // Exclude completed Exodia
        if (augment.id === 'SPECIAL_SHENRONS_WISH') return false;
        if (SPECIAL_WISH_PIECES.includes(augment.id)) return false; // Exclude wishes from normal pool
        if (hasExodiaObliterate && EXODIA_PIECES.includes(augment.id)) return false; // Exclude pieces if Obliterate is active
        if (hasAnyWish && DRAGONBALL_PIECES.includes(augment.id)) return false; // Exclude pieces if a Wish is active
        if (augment.rarity !== rarity) return false;
        if (excludedIds.has(augment.id)) return false;
        if (allowedAugmentsPool && !allowedAugmentsPool.has(augment.id)) return false;

        const existingAugment = playerAugments.find(a => a.id === augment.id);
        const maxStacks = augment.maxStacks ?? 1;
        return !existingAugment || existingAugment.stacks < maxStacks;
    });

    if (availableAugments.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAugments.length);
        return availableAugments[randomIndex];
    }
    return null;
};


export const getAugmentChoices = (
    playerAugments: ActiveAugment[],
    playerLuck: number,
    allowedAugmentsPool: Set<AugmentID> | null = null,
): Augment[] => {
    const choices: Augment[] = [];
    const excludedIds = new Set<AugmentID>();

    while (choices.length < 3) {
        let attempts = 0;
        let foundAugment: Augment | null = null;
        
        while (!foundAugment && attempts < 20) {
            const rarity = getRarityByChance(playerLuck);
            foundAugment = getRandomAugment(rarity, playerAugments, excludedIds, allowedAugmentsPool);
            attempts++;
        }

        // If after many attempts we still haven't found one, try any rarity
        if (!foundAugment) {
            let fallbackAttempts = 0;
            while(!foundAugment && fallbackAttempts < 50) {
                const randomRarity = Math.floor(Math.random() * 5) as Rarity;
                foundAugment = getRandomAugment(randomRarity, playerAugments, excludedIds, allowedAugmentsPool);
                fallbackAttempts++;
            }
        }
        
        // If we found an augment, add it to choices and exclude it from future picks.
        if (foundAugment) {
            choices.push(foundAugment);
            excludedIds.add(foundAugment.id);
        } else {
            // This is a rare case where we might not find 3 unique augments.
            // This can happen if the player has almost all augments, or the allowed pool is very small.
            // We'll just break the loop to avoid an infinite loop.
            // The UI should gracefully handle cases with fewer than 3 choices.
            break;
        }
    }

    return choices;
};

// This function now returns a completely random new augment based on player luck.
export const getReplacementAugment = (
    playerLuck: number,
    excludedIds: Set<AugmentID>,
    playerAugments: ActiveAugment[],
): Augment | null => {
    let attempts = 0;
    while (attempts < 50) { // Try up to 50 times to find a suitable replacement based on luck
        const rarity = getRarityByChance(playerLuck);
        const newAugment = getRandomAugment(rarity, playerAugments, excludedIds, null);
        if (newAugment) {
            return newAugment;
        }
        attempts++;
    }

    const hasExodiaObliterate = playerAugments.some(a => a.id === 'SPECIAL_EXODIA_OBLITERATE');
    const hasAnyWish = playerAugments.some(a => SPECIAL_WISH_PIECES.includes(a.id) || a.id === 'SPECIAL_SHENRONS_WISH');

    // Fallback logic: If luck-based attempts fail, create a comprehensive pool
    // of all possible augments that the player could receive.
    const allPossibleReplacements = ALL_AUGMENTS.filter(augment => {
        // Rule 1: Never offer the bonus/special augments.
        if (augment.id === 'LEGENDARY_WORM_HOLE') return false;
        if (augment.id === 'SPECIAL_EXODIA_OBLITERATE') return false;
        if (augment.id === 'SPECIAL_SHENRONS_WISH') return false;
        if (SPECIAL_WISH_PIECES.includes(augment.id)) return false;

        // Rule 2: Exclude pieces if their respective set is complete.
        if (hasExodiaObliterate && EXODIA_PIECES.includes(augment.id)) return false;
        if (hasAnyWish && DRAGONBALL_PIECES.includes(augment.id)) return false;


        // Rule 3: Don't offer any of the augments currently on display.
        if (excludedIds.has(augment.id)) return false;

        // Rule 4: Don't offer augments the player has already maxed out.
        const existingAugment = playerAugments.find(a => a.id === augment.id);
        const maxStacks = augment.maxStacks ?? 1;
        return !existingAugment || existingAugment.stacks < maxStacks;
    });

    // If there is at least one valid replacement in the entire game...
    if (allPossibleReplacements.length > 0) {
        // ...pick one at random from that pool. This guarantees a result if one is possible.
        const randomIndex = Math.floor(Math.random() * allPossibleReplacements.length);
        return allPossibleReplacements[randomIndex];
    }

    // This should now only happen if there are truly no valid augments left to offer.
    return null;
};