import { GameState, PlayerID, AugmentID } from '../types';
import * as C from '../constants';
import { getAugmentChoices } from '../data/augments';

export const triggerBallSpawn = (gs: GameState, timestamp: number) => {
    gs.ball.x = C.CANVAS_WIDTH / 2;
    gs.ball.y = -100;
    gs.ball.vx = 0;
    gs.ball.vy = 0;
    gs.ballSpawn.isActive = true;
    gs.ballSpawn.startTime = timestamp;
    gs.isPaused = true;
};

export const resetBall = (gs: GameState, timestamp: number, direction: number = 1) => {
    gs.ball.x = C.CANVAS_WIDTH / 2;
    gs.ball.y = C.CANVAS_HEIGHT / 2;
    const newInitialSpeed = C.INITIAL_BALL_SPEED + gs.augmentRoundCounter * 0.2;
    gs.ball.vx = newInitialSpeed * direction;
    gs.ball.vy = (Math.random() - 0.5) * 4;
    gs.ball.lastHitBy = null;
    gs.ball.curve = null;
    gs.ball.isFireball = false;
    gs.ball.isInvisible = false;
    gs.ball.invisibilityEndTime = 0;
    gs.ball.isSticky = false;
    gs.ball.stickyPlayerId = null;
    gs.ball.stickyStartY = null;
    gs.ball.stickySpeed = null;
    gs.ball.lastPaddleHitTime = timestamp;
};

export const triggerAugmentSelection = (gs: GameState, timestamp: number, allowedAugments: Set<AugmentID> | null) => {
    gs.isPaused = true;
    gs.isAugmentSelectionActive = true;
    gs.pauseStartTime = timestamp;
    gs.pointsSinceLastAugment = 0;
    gs.augmentRoundCounter++;
    gs.pointsNeededForNextAugment = Math.floor(gs.augmentRoundCounter / 3) + 1;
    
    let player1Rerolls = 0;
    let player2Rerolls = 0;
    const scoreDiff = gs.players.player1.score - gs.players.player2.score;

    if (scoreDiff < 0) { // Player 1 is behind
        player1Rerolls = Math.floor(Math.abs(scoreDiff) / 5);
    } else if (scoreDiff > 0) { // Player 2 is behind
        player2Rerolls = Math.floor(scoreDiff / 5);
    }

    gs.augmentSelectionData = {
        player1Augments: getAugmentChoices(gs.players.player1.activeAugments, gs.players.player1.stats.luck, allowedAugments),
        player2Augments: getAugmentChoices(gs.players.player2.activeAugments, gs.players.player2.stats.luck, allowedAugments),
        player1Rerolls,
        player2Rerolls,
    };
};