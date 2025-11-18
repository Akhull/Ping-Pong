import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { AugmentID } from '../types';
import { ALL_AUGMENTS } from '../data/augments';

interface DebugContextType {
  isDebugPanelVisible: boolean;
  setIsDebugPanelVisible: (visible: boolean) => void;
  allowedAugments: Set<AugmentID>;
  toggleAugment: (id: AugmentID) => void;
  selectAllAugments: () => void;
  deselectAllAugments: () => void;
  isAllSelected: boolean;
  startWithManyAugments: boolean;
  setStartWithManyAugments: (value: boolean) => void;
  devAimbot: boolean;
  setDevAimbot: (value: boolean) => void;
}

const DebugContext = createContext<DebugContextType | null>(null);

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

interface DebugProviderProps {
  children: ReactNode;
}

const allAugmentIds = ALL_AUGMENTS.map(a => a.id);

export const DebugProvider: React.FC<DebugProviderProps> = ({ children }) => {
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState<boolean>(false);
  const [allowedAugments, setAllowedAugments] = useState<Set<AugmentID>>(new Set(allAugmentIds));
  const [startWithManyAugments, setStartWithManyAugments] = useState<boolean>(false);
  const [devAimbot, setDevAimbot] = useState<boolean>(false);

  const toggleAugment = useCallback((id: AugmentID) => {
    setAllowedAugments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllAugments = useCallback(() => {
    setAllowedAugments(new Set(allAugmentIds));
  }, []);

  const deselectAllAugments = useCallback(() => {
    setAllowedAugments(new Set());
  }, []);

  const isAllSelected = useMemo(() => allowedAugments.size === allAugmentIds.length, [allowedAugments]);

  const value = {
    isDebugPanelVisible,
    setIsDebugPanelVisible,
    allowedAugments,
    toggleAugment,
    selectAllAugments,
    deselectAllAugments,
    isAllSelected,
    startWithManyAugments,
    setStartWithManyAugments,
    devAimbot,
    setDevAimbot,
  };

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
};