import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PlayerState, ActiveAugment } from '../types';
import { ALL_AUGMENTS } from '../data/augments'; // Import the new data source

interface StatsDisplayProps {
    playerState: PlayerState;
    isAugmentSelectionActive: boolean;
}

const AugmentDisplayLine: React.FC<{ augment: ActiveAugment }> = ({ augment }) => {
    const augmentData = ALL_AUGMENTS.find(a => a.id === augment.id);
    if (!augmentData) return null;

    const isWormholeSynergy = augment.id === 'LEGENDARY_WORM_HOLE';
    const isExodiaPiece = augment.id.includes('EXODIA');
    const isSpecialWish = augment.id.startsWith('WISH_') || augment.id === 'SPECIAL_SHENRONS_WISH';
    const isDragonballPiece = augment.id.includes('DRAGONBALL');

    return (
        <div className="flex justify-between items-baseline text-sm">
            <span className={
                isExodiaPiece ? "text-yellow-400 animate-pulse font-semibold" :
                isDragonballPiece || isSpecialWish ? "text-orange-400 animate-pulse font-semibold" :
                isWormholeSynergy ? "text-green-400 animate-pulse font-semibold" : 
                "text-gray-400"
            }>{augmentData.name}</span>
            {augment.stacks > 1 && <span className="font-mono font-bold text-yellow-400">x{augment.stacks}</span>}
        </div>
    );
};

// FIX: Make cooldown properties optional and add pointsConceded to support different ability types like Last Stand.
interface Ability {
    cooldown?: number;
    cooldownEndTime?: number;
    bannedUntil?: number;
    isActive?: boolean;
    activeUntil?: number;
    isArmed?: boolean;
    charges?: number;
    pointsConceded?: number;
}

const AbilityLine: React.FC<{ ability: Ability; name: string; isAugmentSelectionActive: boolean; isAimbotActive?: boolean; }> = ({ ability, name, isAugmentSelectionActive, isAimbotActive }) => {
    const [now, setNow] = useState(performance.now());

    useEffect(() => {
        if (isAugmentSelectionActive) {
            return;
        }

        let frameId: number;
        const update = () => {
            setNow(performance.now());
            frameId = requestAnimationFrame(update);
        };
        frameId = requestAnimationFrame(update);

        return () => cancelAnimationFrame(frameId);
    }, [isAugmentSelectionActive]);
    
    // Timestamps from server are authoritative.
    const bannedUntil = ability.bannedUntil || 0;
    const activeUntil = ability.activeUntil || 0;
    const cooldownEndTime = ability.cooldownEndTime || 0;
    
    const nameClasses = name === 'Exodia Obliterate' ? "text-yellow-400 animate-pulse font-semibold" :
                        name === 'Wormhole' ? "text-green-400 animate-pulse font-semibold" :
                        name.startsWith('Kamehameha') || name.startsWith("Shenron's Barrier") || name.startsWith("Shenron's Blessing") ? "text-orange-400 animate-pulse font-semibold" :
                        "text-gray-400";

    if (name === 'Wormhole') {
        if (!ability.isActive) return null;
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className={`font-mono font-bold text-green-400 animate-pulse`}>ACTIVE</span>
            </div>
        );
    }

    if (name === "Shenron's Blessing") {
        if (!ability.isActive) return null;
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
            </div>
        );
    }

    if (bannedUntil && now < bannedUntil) {
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-red-500 animate-pulse">
                    BANNED
                </span>
            </div>
        );
    }

    if (name === 'Last Stand') {
        if (ability.isActive) {
            return (
                <div className="flex justify-between items-baseline">
                    <span className={nameClasses}>{name}</span>
                    <span className="font-mono font-bold text-cyan-400 animate-pulse">ACTIVE</span>
                </div>
            );
        }
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-gray-400">{ability.pointsConceded ?? 0}/5 Charged</span>
            </div>
        );
    }

    if (isAimbotActive) {
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-cyan-400 animate-pulse">ACTIVE ({ability.charges})</span>
            </div>
        );
    }

    if (typeof ability.charges === 'number' && ability.charges > 0) {
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-yellow-400 animate-pulse">{ability.charges} CHARGE{ability.charges > 1 ? 'S' : ''}</span>
            </div>
        );
    }

    // Specific logic for Shrink being active on the opponent
    if ((name === 'Shrink Ray' || name === 'Black Hole' || name === 'White Hole' || name === 'Vanguard Error' || name === 'B/W Hole') && activeUntil && now < activeUntil) {
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-purple-400">ACTIVE</span>
            </div>
        );
    }
    
    if (ability.isArmed) {
         return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-yellow-400 animate-pulse">ARMED</span>
            </div>
        );
    }
    
    // If the ability is explicitly marked as active (e.g., Fireball is armed), show a prominent "READY" state.
    if (ability.isActive) {
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-green-400 animate-pulse">READY</span>
            </div>
        );
    }
    
    if (ability.cooldownEndTime === undefined) {
        return null; // Should be handled by specific cases above.
    }

    const remainingTime = cooldownEndTime - now;

    if (remainingTime <= 0) {
        if (name === "Aimbot") {
            return (
                <div className="flex justify-between items-baseline">
                    <span className={nameClasses}>{name}</span>
                    <span className="font-mono font-bold text-green-400 animate-pulse">PRESS SPACE</span>
                </div>
            )
        }
        return (
            <div className="flex justify-between items-baseline">
                <span className={nameClasses}>{name}</span>
                <span className="font-mono font-bold text-green-400">READY</span>
            </div>
        );
    }
    
    const remainingSeconds = (remainingTime / 1000).toFixed(1);

    return (
        <div className="flex justify-between items-baseline">
            <span className={nameClasses}>{name}</span>
            <span className="font-mono font-bold text-red-500">{remainingSeconds}s</span>
        </div>
    );
};

// FIX: Added Last Stand to the ability config to be displayed in the UI.
const ABILITY_CONFIG: { augmentId: string, name: string, abilityKey: keyof PlayerState['abilities'] }[] = [
    { augmentId: 'LEGENDARY_WORM_HOLE', name: 'Wormhole', abilityKey: 'wormhole' },
    { augmentId: 'SPECIAL_EXODIA_OBLITERATE', name: 'Exodia Obliterate', abilityKey: 'exodiaLaser' },
    { augmentId: 'WISH_SHENRONS_BLESSING', name: "Shenron's Blessing", abilityKey: 'shenronsBlessing' },
    { augmentId: 'LEGENDARY_AIMBOT', name: 'Aimbot', abilityKey: 'aimbot' },
    { augmentId: 'WISH_KAMEHAMEHA', name: 'Kamehameha', abilityKey: 'kamehameha' },
    { augmentId: 'WISH_MIDLINE_SEAL', name: "Shenron's Barrier", abilityKey: 'midlineSeal' },
    { augmentId: 'BALL_SPEED_INCREASE', name: 'Fireball', abilityKey: 'fireball' },
    { augmentId: 'OPPONENT_PADDLE_SIZE_DECREASE', name: 'Shrink Ray', abilityKey: 'shrink' },
    { augmentId: 'LEGENDARY_BLACK_HOLE', name: 'Black Hole', abilityKey: 'blackHole' },
    { augmentId: 'LEGENDARY_WHITE_HOLE', name: 'White Hole', abilityKey: 'whiteHole' },
    { augmentId: 'EPIC_VANGUARD_ERROR', name: 'Vanguard Error', abilityKey: 'invertControls' },
    { augmentId: 'EPIC_VAC_BANN', name: 'VAC Bann', abilityKey: 'vacBann' },
    { augmentId: 'RARE_LAST_STAND', name: 'Last Stand', abilityKey: 'lastStand' },
];


const StatsDisplay: React.FC<StatsDisplayProps> = ({ playerState, isAugmentSelectionActive }) => {
    const { id, stats, paddle, abilities, activeAugments } = playerState;
    const isPlayer1 = id === 'player1';
    const alignClass = isPlayer1 ? 'text-left' : 'text-right';
    const headerColor = isPlayer1 ? 'text-cyan-400' : 'text-orange-400';

    const activeAbilities = useMemo(() => {
        const hasBlackHole = (activeAugments || []).some(aug => aug.id === 'LEGENDARY_BLACK_HOLE');
        const hasWhiteHole = (activeAugments || []).some(aug => aug.id === 'LEGENDARY_WHITE_HOLE');

        if (hasBlackHole && hasWhiteHole) {
            // Synergy is active. Get all other abilities the player has.
            const baseAbilities = ABILITY_CONFIG.filter(config => 
                (activeAugments || []).some(aug => aug.id === config.augmentId) &&
                config.augmentId !== 'LEGENDARY_BLACK_HOLE' && 
                config.augmentId !== 'LEGENDARY_WHITE_HOLE'
            );
            
            // Add the new synergy ability, using blackHole's state as the master
            baseAbilities.push({ augmentId: 'SYNERGY_BW_HOLE', name: 'B/W Hole', abilityKey: 'blackHole' });
            return baseAbilities;
        }

        // No synergy, original logic
        return ABILITY_CONFIG.filter(config => 
            (activeAugments || []).some(aug => aug.id === config.augmentId)
        );
    }, [activeAugments]);

    const regularAugments = useMemo(() => {
        return (activeAugments || []).filter(aug => !ABILITY_CONFIG.some(config => config.augmentId === aug.id));
    }, [activeAugments]);

    const StatLine: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <div className="flex justify-between items-baseline">
            <span className="text-gray-400">{label}</span>
            <span className="font-mono font-bold text-white">{value}</span>
        </div>
    );

    return (
        <div 
            className={`w-full h-full bg-gray-800/50 p-6 rounded-lg border border-gray-700 font-sans ${alignClass} flex flex-col`}
        >
            <div className="flex-shrink-0">
                <h3 className={`text-2xl font-bold mb-4 ${headerColor}`}>
                    {isPlayer1 ? 'Player 1' : 'Player 2'}
                </h3>
                
                <div className="space-y-3 text-lg">
                    <StatLine label="Attack" value={`${((stats.attack - 1) * 100).toFixed(0)}%`} />
                    <StatLine label="Crit Chance" value={`${(stats.critChance * 100).toFixed(0)}%`} />
                    <StatLine label="Crit Force" value={`+${(stats.critForce * 100).toFixed(0)}%`} />
                    <StatLine label="Move Speed" value={stats.moveSpeed.toFixed(0)} />
                    <StatLine label="Height" value={paddle.height.toFixed(0)} />
                    <StatLine label="Width" value={paddle.width.toFixed(0)} />
                    <StatLine label="Luck" value={`${(stats.luck * 100).toFixed(0)}%`} />
                </div>
            </div>

            {activeAbilities.length > 0 && (
                 <div className="mt-6 pt-4 border-t border-gray-700 space-y-3 text-lg flex-shrink-0">
                    {activeAbilities.map(config => (
                        <AbilityLine
                            key={config.abilityKey}
                            ability={abilities[config.abilityKey]}
                            name={config.name}
                            isAugmentSelectionActive={isAugmentSelectionActive}
                            isAimbotActive={config.abilityKey === 'aimbot' ? playerState.isAimbotActive : undefined}
                        />
                    ))}
                 </div>
            )}
            
            {(regularAugments || []).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700 flex-1 relative min-h-0">
                    <div className="absolute inset-0 overflow-y-auto pr-2">
                        <h4 className="text-lg font-bold text-gray-200 mb-3">Augments</h4>
                        <div className="space-y-2">
                            {(regularAugments || []).map(aug => (
                                <AugmentDisplayLine key={aug.id} augment={aug} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsDisplay;