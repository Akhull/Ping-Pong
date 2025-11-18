import React, { useState, useMemo } from 'react';
import { useDebug } from '../context/DebugProvider';
import { ALL_AUGMENTS } from '../data/augments';
import { Rarity } from '../types';

const RARITY_BORDER_COLORS: { [key in Rarity]: string } = {
    [Rarity.Common]: 'border-gray-500',
    [Rarity.Uncommon]: 'border-green-500',
    [Rarity.Rare]: 'border-blue-500',
    [Rarity.Epic]: 'border-purple-500',
    [Rarity.Legendary]: 'border-yellow-500',
};

const DebugPanel: React.FC = () => {
    const { 
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
    } = useDebug();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'rarity' | 'alphabetic'>('rarity');
    const [activeTab, setActiveTab] = useState<'pool' | 'setup'>('pool');
    const [p1Score, setP1Score] = useState(0);
    const [p2Score, setP2Score] = useState(0);

    const handleSetScore = () => {
        const event = new CustomEvent('manipulate-score', {
            detail: { p1Score: Number(p1Score), p2Score: Number(p2Score) }
        });
        window.dispatchEvent(event);
    };

    const sortedAndFilteredAugments = useMemo(() => {
        const filtered = ALL_AUGMENTS.filter(aug => 
            aug.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filtered.sort((a, b) => {
            if (sortOrder === 'rarity') {
                if (a.rarity !== b.rarity) {
                    return b.rarity - a.rarity; // Higher rarity first
                }
                return a.name.localeCompare(b.name); // Alphabetical within rarity
            } else { // 'alphabetic'
                return a.name.localeCompare(b.name);
            }
        });
    }, [searchTerm, sortOrder]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-cyan-500 rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col text-white">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-cyan-400">Debug Tool</h2>
                    <button onClick={() => setIsDebugPanelVisible(false)} className="text-2xl hover:text-red-500">&times;</button>
                </div>

                 {/* Tabs */}
                <div className="flex border-b border-gray-700 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('pool')}
                        className={`flex-1 py-2 px-4 text-center font-semibold transition-colors ${activeTab === 'pool' ? 'bg-gray-700 text-cyan-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Augment Pool
                    </button>
                    <button 
                        onClick={() => setActiveTab('setup')}
                        className={`flex-1 py-2 px-4 text-center font-semibold transition-colors ${activeTab === 'setup' ? 'bg-gray-700 text-cyan-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Game Setup
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'pool' && (
                    <>
                        <div className="p-4 flex flex-col gap-4 flex-shrink-0">
                            <input
                                type="text"
                                placeholder="Search augments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <div className="flex flex-wrap gap-2 justify-between">
                                <div className="flex gap-2">
                                    <button onClick={selectAllAugments} disabled={isAllSelected} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed text-sm">Select All</button>
                                    <button onClick={deselectAllAugments} disabled={allowedAugments.size === 0} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed text-sm">Deselect All</button>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSortOrder('rarity')} 
                                        className={`px-4 py-2 rounded-md text-sm transition-colors ${sortOrder === 'rarity' ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        By Rarity
                                    </button>
                                    <button 
                                        onClick={() => setSortOrder('alphabetic')}
                                        className={`px-4 py-2 rounded-md text-sm transition-colors ${sortOrder === 'alphabetic' ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        Alphabetic
                                    </button>
                                </div>
                            </div>
                        </div>


                        <div className="flex-grow overflow-y-auto p-4 space-y-2">
                            {sortedAndFilteredAugments.length > 0 ? sortedAndFilteredAugments.map(augment => (
                                <label key={augment.id} className={`flex items-center p-3 rounded-md border-l-4 transition-colors cursor-pointer ${RARITY_BORDER_COLORS[augment.rarity]} ${allowedAugments.has(augment.id) ? 'bg-gray-700/80' : 'bg-gray-900/50 hover:bg-gray-700/50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={allowedAugments.has(augment.id)}
                                        onChange={() => toggleAugment(augment.id)}
                                        className="w-5 h-5 mr-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600"
                                    />
                                    <span className="font-bold">{augment.name}</span>
                                </label>
                            )) : (
                                <p className="text-center text-gray-400">No augments found.</p>
                            )}
                        </div>
                    </>
                )}
                {activeTab === 'setup' && (
                    <div className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-200">Initial Game State</h3>
                        <p className="text-gray-400">These settings will apply when a new game is started by the host.</p>
                        <label className="flex items-center p-3 rounded-md transition-colors cursor-pointer bg-gray-700/80 hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={startWithManyAugments}
                                onChange={(e) => setStartWithManyAugments(e.target.checked)}
                                className="w-5 h-5 mr-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600"
                            />
                            <div className="flex-1">
                                <span className="font-bold">Start with Many Augments</span>
                                <p className="text-sm text-gray-400">Start the game with 20+ augments to test UI and balance.</p>
                            </div>
                        </label>
                         <label className="flex items-center p-3 rounded-md transition-colors cursor-pointer bg-gray-700/80 hover:bg-gray-700">
                            <input
                                type="checkbox"
                                checked={devAimbot}
                                onChange={(e) => setDevAimbot(e.target.checked)}
                                className="w-5 h-5 mr-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600"
                            />
                            <div className="flex-1">
                                <span className="font-bold">Dev Aimbot</span>
                                <p className="text-sm text-gray-400">Start with Aimbot augment. Toggle with SPACE, no charges or cooldown.</p>
                            </div>
                        </label>
                        <h3 className="text-xl font-bold text-gray-200 pt-4 border-t border-gray-700">Live Game State</h3>
                        <p className="text-gray-400">These settings will affect the current game in real-time. (Host only)</p>
                        <div className="flex items-center gap-4 p-3 rounded-md bg-gray-700/80">
                            <div className="flex-1">
                                <label htmlFor="p1Score" className="block text-sm font-medium text-gray-300">Player 1 Score</label>
                                <input
                                    type="number"
                                    id="p1Score"
                                    value={p1Score}
                                    onChange={(e) => setP1Score(parseInt(e.target.value, 10) || 0)}
                                    className="w-full mt-1 px-3 py-2 bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="p2Score" className="block text-sm font-medium text-gray-300">Player 2 Score</label>
                                <input
                                    type="number"
                                    id="p2Score"
                                    value={p2Score}
                                    onChange={(e) => setP2Score(parseInt(e.target.value, 10) || 0)}
                                    className="w-full mt-1 px-3 py-2 bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <button
                                onClick={handleSetScore}
                                className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md h-10"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugPanel;
