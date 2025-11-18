import React from 'react';
import { GameState, PlayerID, PlayerState } from '../../types';
import { Sounds } from '../../App';
import * as C from '../../constants';
import { Particle, createExplosion, createImplosion } from './utils';

export const handleAbilityAndStatusEvents = (
    gs: GameState, 
    prevState: GameState,
    sounds: Sounds, 
    particlesRef: React.MutableRefObject<Particle[]>
) => {
    const { players, floatingTexts, visualEffects, arena, timeWarp } = gs;
    const { players: prevPlayers, floatingTexts: prevFloatingTexts, visualEffects: prevVisualEffects, arena: prevArena, timeWarp: prevTimeWarp, wishSelection: prevWishSelection, dragonballScatterAnimation: prevScatterAnimation } = prevState;

    if (!prevTimeWarp.isActive && timeWarp.isActive) {
        sounds.blackHoleActivate();
    }

    if (!prevState.ball.curve && gs.ball.curve) sounds.curveball();

    if (visualEffects.length > prevVisualEffects.length) {
        const newEffect = visualEffects[visualEffects.length - 1];
        if (newEffect.type === 'chain_lightning') sounds.chainLightning();
        else if (newEffect.type === 'wormhole_teleport') {
            sounds.wormholeTeleport();
            for (let i = 0; i < 30; i++) {
                particlesRef.current.push({ x: newEffect.from.x + (Math.random()-0.5)*40, y: newEffect.from.y, vx: (Math.random()-0.5)*2, vy: newEffect.from.y === 0 ? Math.random()*3 : -Math.random()*3, radius: Math.random()*2, color: '#34d399', life: 0.5, decay: 1 });
                particlesRef.current.push({ x: newEffect.to.x + (Math.random()-0.5)*40, y: newEffect.to.y, vx: (Math.random()-0.5)*2, vy: newEffect.to.y === 0 ? Math.random()*3 : -Math.random()*3, radius: Math.random()*2, color: '#10b981', life: 0.5, decay: 1 });
            }
        } else if (newEffect.type === 'exodia_laser_hit') {
            sounds.exodiaLaserHit();
            createExplosion(particlesRef, newEffect.from.x, newEffect.from.y, 'yellow', 40, C.EXODIA_LASER_BALL_SPEED_BOOST);
        } else if (newEffect.type === 'dragonball_wish') {
            sounds.dragonballWish();
        } else if (newEffect.type === 'ki_aura_teleport') {
            sounds.kiAuraTeleport();
        } else if (newEffect.type === 'midline_seal_block') {
            sounds.shenronsBarrierBlock();
            createExplosion(particlesRef, newEffect.from.x, newEffect.from.y, '#fb923c', 30, C.INITIAL_BALL_SPEED * 2);
        }
    }
    
    // Dragonball sequence sounds
    if (!prevWishSelection && gs.wishSelection) {
        sounds.shenronSummon();
    }
    if (!prevScatterAnimation?.isActive && gs.dragonballScatterAnimation?.isActive) {
        sounds.dragonballGather();
        // Schedule whooshes for the scatter phase (starts at 2000ms into the animation)
        for (let i = 0; i < 7; i++) {
            setTimeout(() => sounds.dragonballScatterWhoosh(), 2000 + i * 80);
        }
    }


    const newStalemateText = floatingTexts.length > prevFloatingTexts.length && floatingTexts[floatingTexts.length-1].text.includes('Stalemate');
    if (newStalemateText) sounds.stalemateReset();

    const newExodiaText = floatingTexts.length > prevFloatingTexts.length && floatingTexts[floatingTexts.length-1].text.includes('EXODIA');
    if (newExodiaText) {
        sounds.exodiaObliterate();
    }

    if (arena.exodiaLaserCharges.length > prevArena.exodiaLaserCharges.length) {
        sounds.exodiaLaserCharge();
    }
    if (arena.exodiaLasers.length > prevArena.exodiaLasers.length) {
        sounds.exodiaLaserFire();
    }

    if (arena.kamehamehaCharges.length > prevArena.kamehamehaCharges.length) {
        sounds.kamehamehaCharge();
    }
    if (arena.kamehamehaBeams.length > prevArena.kamehamehaBeams.length) {
        sounds.kamehamehaFire();
    }

    if (arena.midlineSeals.length > prevArena.midlineSeals.length) {
        sounds.shenronsBarrierActivate();
    }

    if (arena.blackHoles.length > prevArena.blackHoles.length) sounds.blackHoleActivate();
    if (arena.whiteHoles.length > prevArena.whiteHoles.length) sounds.whiteHoleActivate();
    if (arena.walls.length > prevArena.walls.length) sounds.wallSpawn();

    Object.values(players).forEach((player: PlayerState) => {
        const prevPlayer = (prevPlayers as Record<PlayerID, PlayerState>)[player.id];
        if (prevPlayer) {
            if (!prevPlayer.isShrunk && player.isShrunk) sounds.shrinkRay();
            if (!prevPlayer.areControlsInverted && player.areControlsInverted) sounds.vanguardError();
            if (!prevPlayer.isAimbotActive && player.isAimbotActive) { sounds.aimbotActivate(); createImplosion(particlesRef, player.paddle.x + player.paddle.width / 2, player.paddle.y + player.paddle.height / 2, '#22d3ee', 40); }
            if (prevPlayer.isAimbotActive && !player.isAimbotActive) { sounds.aimbotDeactivate(); createExplosion(particlesRef, player.paddle.x + player.paddle.width / 2, player.paddle.y + player.paddle.height / 2, '#64748b', 20); }
            if (player.isAimbotActive && prevPlayer.abilities.aimbot.charges > player.abilities.aimbot.charges) { sounds.aimbotHit(); createExplosion(particlesRef, gs.ball.x, gs.ball.y, '#67e8f9', 15); }
            if (!prevPlayer.abilities.lastStand.isActive && player.abilities.lastStand.isActive) {
                sounds.lastStandActivate();
                const netX = player.id === 'player1' ? 0 : C.CANVAS_WIDTH;
                for (let i = 0; i < 50; i++) particlesRef.current.push({ x: netX, y: (i / 49) * C.CANVAS_HEIGHT, vx: (player.id === 'player1' ? 1 : -1) * (Math.random() * 2 + 1), vy: (Math.random() - 0.5) * 1, radius: Math.random() * 1.5 + 1, color: player.id === 'player1' ? '#22d3ee' : '#fb923c', life: 0.4, decay: 1.5 });
            }
            if (prevPlayer.abilities.lastStand.isActive && !player.abilities.lastStand.isActive) {
                sounds.lastStandBlock();
                const impactX = player.id === 'player1' ? 0 : C.CANVAS_WIDTH;
                const color = player.id === 'player1' ? '#22d3ee' : '#fb923c';
                createExplosion(particlesRef, impactX, prevState.ball.y, color, 120, C.INITIAL_BALL_SPEED * 3);
            }
        }
    });
};