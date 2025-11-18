import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayerID, Augment, AugmentID, Rarity, GameState, ClientMessageType } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';
import { Sounds } from '../App';
import { useWebSocket } from '../context/AblyProvider';

interface AugmentSelectionProps {
  augments: Augment[];
  onSelect: (augmentId: AugmentID) => void;
  onReroll: (slotIndex: number) => void;
  sounds: Sounds;
  gameState: GameState;
}

const RARITY_STYLES: { [key in Rarity]: { border: string; bg: string; text: string; shadow: string; title: string; } } = {
    [Rarity.Common]: {
        border: 'border-gray-500',
        bg: 'bg-gradient-to-b from-gray-700 to-gray-800',
        text: 'text-gray-300',
        shadow: 'hover:shadow-gray-500/20',
        title: 'text-gray-200',
    },
    [Rarity.Uncommon]: {
        border: 'border-green-500',
        bg: 'bg-gradient-to-b from-green-800 to-green-900',
        text: 'text-green-400',
        shadow: 'hover:shadow-green-400/30',
        title: 'text-white',
    },
    [Rarity.Rare]: {
        border: 'border-blue-500',
        bg: 'bg-gradient-to-b from-blue-800 to-blue-900',
        text: 'text-blue-400',
        shadow: 'hover:shadow-blue-400/40',
        title: 'text-white',
    },
    [Rarity.Epic]: {
        border: 'border-purple-500',
        bg: 'bg-gradient-to-b from-purple-800 to-purple-900',
        text: 'text-purple-400',
        shadow: 'hover:shadow-purple-400/50',
        title: 'text-yellow-300',
    },
    [Rarity.Legendary]: {
        border: 'border-yellow-500',
        bg: 'bg-gradient-to-b from-yellow-700 via-orange-800 to-yellow-900',
        text: 'text-yellow-400',
        shadow: 'hover:shadow-yellow-400/60',
        title: 'text-yellow-300',
    },
};

const RARITY_NAMES: { [key in Rarity]: string } = {
    [Rarity.Common]: 'Common',
    [Rarity.Uncommon]: 'Uncommon',
    [Rarity.Rare]: 'Rare',
    [Rarity.Epic]: 'Epic',
    [Rarity.Legendary]: 'Legendary',
};

const AugmentCard: React.FC<{ augment: Augment; onSelect: () => void; disabled: boolean; index: number; isSelected: boolean; localPlayerId: PlayerID | null; isWish?: boolean; }> = ({ augment, onSelect, disabled, index, isSelected, localPlayerId, isWish = false }) => {
    const styles = RARITY_STYLES[augment.rarity];
    const rarityName = RARITY_NAMES[augment.rarity];

    const disabledClasses = 'bg-gray-800 border-gray-700 opacity-60 cursor-not-allowed';
    const enabledClasses = `${styles.bg} ${styles.border} ${styles.shadow} transform hover:-translate-y-2`;
    
    const selectionRingColor = localPlayerId === 'player2' ? 'ring-orange-400' : 'ring-cyan-400';
    const selectionShadowColor = localPlayerId === 'player2' ? 'shadow-orange-400/40' : 'shadow-cyan-400/40';
    
    // Wish-specific styling
    const wishRingColor = 'ring-yellow-400';
    const wishShadowColor = 'shadow-yellow-400/40';

    const selectionClasses = isSelected ? `ring-4 ${isWish ? wishRingColor : selectionRingColor} scale-105 shadow-lg ${isWish ? wishShadowColor : selectionShadowColor}` : '';

    return (
      <div className={`relative group flex flex-col justify-between p-6 rounded-xl border-4 overflow-hidden transition-all duration-300 h-full ${disabled ? disabledClasses : enabledClasses} ${selectionClasses}`}>
        {/* LEGENDARY/WISH OUTER GLOW */}
        {(augment.rarity === Rarity.Legendary || isWish) && !disabled && (
            <div className="absolute inset-[-8px] rounded-2xl bg-yellow-400/70 blur-xl -z-20 animate-pulse-glow"></div>
        )}
        
        {/* EPIC GLOW */}
        {augment.rarity === Rarity.Epic && !isWish && !disabled && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/50 rounded-full blur-[80px] -z-10 animate-pulse-glow"></div>
        )}

        {/* LEGENDARY/WISH INNER GLOW & RAYS */}
        {(augment.rarity === Rarity.Legendary || isWish) && !disabled && (
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
                 {/* Main Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl animate-pulse-glow"></div>
                
                {/* Rotating Rays */}
                <div className="absolute inset-[-100%] w-[300%] h-[300%] 
                             bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,#eab308_5%,transparent_10%)]
                             opacity-30 animate-spin-slow">
                </div>
            </div>
        )}
        
        {/* Shine effect for enabled, non-common cards */}
        {!disabled && (augment.rarity > Rarity.Common || isWish) && (
             <div className="absolute top-0 left-[-150%] h-full w-[100%] z-10 transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-[150%]" />
        )}
        <div className="relative z-20 flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm font-bold uppercase ${styles.text}`}>{isWish ? 'Wish' : rarityName}</p>
                    <div className={`bg-gray-900/50 rounded-full w-8 h-8 flex items-center justify-center font-mono font-bold text-lg border border-gray-600 ${isWish ? 'text-yellow-300' : 'text-cyan-300'}`}>
                        {index + 1}
                    </div>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${styles.title}`}>{augment.name}</h3>
                <p className="text-gray-300 mb-4 h-24">{augment.description}</p>
            </div>
            <button
              onClick={onSelect}
              disabled={disabled}
              className={`w-full px-6 py-3 mt-4 font-bold rounded-lg shadow-lg transition-colors text-white ${disabled ? 'bg-gray-600 cursor-not-allowed' : `bg-cyan-600 hover:bg-cyan-500`}`}
            >
              {disabled ? 'Waiting...' : (isWish ? 'Make a Wish' : 'Select')}
            </button>
        </div>
      </div>
    );
};


const AugmentSelection: React.FC<AugmentSelectionProps> = ({ augments, onSelect, onReroll, sounds, gameState }) => {
  const { localPlayerId } = useWebSocket();
  const [hasSelected, setHasSelected] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [keyboardNavActive, setKeyboardNavActive] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(false);

  const isWishSelection = useMemo(() => {
    return gameState.wishSelection?.playerId === localPlayerId;
  }, [gameState.wishSelection, localPlayerId]);

  useEffect(() => {
    // This effect runs when the component transitions into (or out of) wish selection mode.
    if (isWishSelection) {
      // 1. Reset the selection state from the previous augment choice to make wishes selectable.
      setHasSelected(false);
      
      // 2. Reset keyboard navigation to the first option for a clean experience.
      setSelectedIndex(0);
      setKeyboardNavActive(true);
  
      // 3. Temporarily disable input to prevent accidental selection from a held key/click.
      setIsInputDisabled(true);
      const timer = setTimeout(() => {
          setIsInputDisabled(false);
      }, 250); // A short delay is enough.
  
      return () => clearTimeout(timer);
    }
  }, [isWishSelection]);

  const currentAugments = useMemo(() => {
    return isWishSelection ? gameState.wishSelection!.wishes : augments;
  }, [isWishSelection, gameState.wishSelection, augments]);


  const rerollsLeft = useMemo(() => {
    if (!localPlayerId || !gameState.augmentSelectionData || isWishSelection) return 0;
    return localPlayerId === 'player1'
      ? gameState.augmentSelectionData.player1Rerolls
      : gameState.augmentSelectionData.player2Rerolls;
  }, [gameState.augmentSelectionData, localPlayerId, isWishSelection]);

  const handleSelect = useCallback((augmentId: AugmentID) => {
    if (hasSelected || !localPlayerId || isInputDisabled) return;
    setHasSelected(true);
    sounds.augmentConfirm();
    onSelect(augmentId);
  }, [hasSelected, sounds, onSelect, localPlayerId, isInputDisabled]);
  
  const handleReroll = useCallback((slotIndex: number) => {
    if (hasSelected || !localPlayerId || rerollsLeft <= 0) return;
    sounds.augmentReroll();
    onReroll(slotIndex);
  }, [hasSelected, localPlayerId, rerollsLeft, sounds, onReroll]);


  useEffect(() => {
    const safeAugments = currentAugments || [];
    const handleKeyDown = (e: KeyboardEvent) => {
        if (hasSelected || isInputDisabled) return;

        switch (e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                e.preventDefault();
                if (!keyboardNavActive) setKeyboardNavActive(true);
                if (safeAugments.length > 0) {
                  setSelectedIndex(prev => (prev - 1 + safeAugments.length) % safeAugments.length);
                }
                break;
            case 'd':
            case 'arrowright':
                e.preventDefault();
                if (!keyboardNavActive) setKeyboardNavActive(true);
                if (safeAugments.length > 0) {
                  setSelectedIndex(prev => (prev + 1) % safeAugments.length);
                }
                break;
            case ' ':
            case 'enter':
                e.preventDefault();
                if (keyboardNavActive && safeAugments[selectedIndex]) {
                    handleSelect(safeAugments[selectedIndex].id);
                }
                break;
            case '1':
                if (safeAugments[0]) handleSelect(safeAugments[0].id);
                break;
            case '2':
                if (safeAugments[1]) handleSelect(safeAugments[1].id);
                break;
            case '3':
                if (safeAugments[2]) handleSelect(safeAugments[2].id);
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasSelected, currentAugments, handleSelect, selectedIndex, keyboardNavActive, isInputDisabled]);
  
  if (gameState.wishSelection && gameState.wishSelection.playerId !== localPlayerId) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 text-white p-8 backdrop-blur-sm" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <div className="text-center mb-8">
            <h2 className="text-5xl font-extrabold mb-2 text-yellow-300 animate-pulse tracking-wider">A WISH IS BEING MADE!</h2>
            <p className="text-2xl font-bold text-yellow-400 animate-pulse">Waiting for your opponent...</p>
        </div>
      </div>
    );
  }

  if (isWishSelection) {
    return (
        <div className="flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 text-white p-8 backdrop-blur-sm" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <div className="text-center mb-8">
                <h2 className="text-5xl font-extrabold mb-2 text-yellow-300 animate-pulse tracking-wider">MAKE A WISH</h2>
                {hasSelected ? (
                    <p className="text-2xl font-bold text-yellow-400 animate-pulse">Waiting for opponent...</p>
                ) : (
                    <p className="text-2xl font-bold text-orange-200">The Eternal Dragon has been summoned!</p>
                )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                {(currentAugments || []).map((augment, index) => (
                    <AugmentCard 
                        key={`${augment.id}-${index}`}
                        augment={augment}
                        onSelect={() => handleSelect(augment.id)}
                        disabled={hasSelected}
                        index={index}
                        isSelected={!hasSelected && keyboardNavActive && index === selectedIndex}
                        localPlayerId={localPlayerId}
                        isWish={true}
                    />
                ))}
            </div>
        </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 text-white p-8 backdrop-blur-sm"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
        <div className="text-center mb-8">
            <h2 className="text-5xl font-extrabold mb-2 text-cyan-300">Choose Your Augment</h2>
            {hasSelected ? (
                 <p className="text-2xl font-bold text-yellow-400 animate-pulse">Waiting for opponent...</p>
            ) : (
                <p className="text-2xl font-bold text-gray-300">Select an augment for the next round!</p>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {(currentAugments || []).map((augment, index) => (
                <div key={`${augment.id}-${index}`} className="flex flex-col">
                  <div className="flex-grow">
                      <AugmentCard 
                          augment={augment}
                          onSelect={() => handleSelect(augment.id)}
                          disabled={hasSelected}
                          index={index}
                          isSelected={!hasSelected && keyboardNavActive && index === selectedIndex}
                          localPlayerId={localPlayerId}
                      />
                  </div>
                   <div className="mt-4 flex flex-col items-center justify-start h-16">
                      {rerollsLeft > 0 && !hasSelected && (
                          <button
                              onClick={() => handleReroll(index)}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg shadow-md transition-colors text-sm flex items-center gap-2"
                              aria-label={`Reroll augment ${index + 1}`}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10.5M20 20l-1.5-1.5A9 9 0 013.5 13.5" />
                              </svg>
                              Reroll
                          </button>
                      )}
                      {index === 1 && rerollsLeft > 0 && !hasSelected && (
                          <p className="text-sm mt-2 text-yellow-300">
                              You have {rerollsLeft} reroll{rerollsLeft !== 1 ? 's' : ''} available.
                          </p>
                      )}
                  </div>
              </div>
            ))}
        </div>

        {!hasSelected && (
            <div className="text-center mt-8">
                <p className="text-lg text-gray-400">
                    Use <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">←</kbd> <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">→</kbd> to navigate, <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd> to confirm.
                    <br/>
                    Or press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">1</kbd>, <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">2</kbd>, or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">3</kbd> to select directly.
                </p>
            </div>
        )}
    </div>
  );
};

export default AugmentSelection;