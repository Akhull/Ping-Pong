

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initAudio } from '../utils/audio';

const songs = ['thememusic/song1.mp3', 'thememusic/song2.mp3'];

export const useAudio = () => {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [lastVolume, setLastVolume] = useState(0.5);
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isMuted = volume === 0;

  const handleInitAudio = useCallback(() => {
    if (!audioInitialized) {
      initAudio();
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  useEffect(() => {
    if (!audioInitialized || !audioRef.current) return;

    const audioEl = audioRef.current;
    const songPath = songs[currentSongIndex];

    const playSong = async () => {
      try {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        const response = await fetch(songPath);
        if (!response.ok) throw new Error(`Failed to load song: ${response.statusText}`);
        const blob = await response.blob();
        
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        audioEl.src = objectUrl;
        audioEl.volume = volume * 0.125;
        await audioEl.play();

      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    };

    playSong();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [currentSongIndex, audioInitialized]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * 0.125;
    }
  }, [volume]);

  const handleSongEnd = () => {
    setCurrentSongIndex(prevIndex => (prevIndex + 1) % songs.length);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setLastVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
    } else {
      setVolume(lastVolume > 0 ? lastVolume : 0.5);
    }
  };

  // FIX: Rewrote JSX to use React.createElement to be valid in a .ts file.
  const getVolumeIcon = () => {
    if (isMuted) {
      return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l2 2" })
      );
    }
    if (volume < 0.5) {
      return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" })
      );
    }
    return React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" })
    );
  };

  // FIX: Rewrote JSX to use React.createElement to be valid in a .ts file.
  const VolumeControl = React.createElement('div', {
      className: "absolute top-4 right-4 z-50 flex items-center",
      onMouseEnter: () => setIsVolumeSliderVisible(true),
      onMouseLeave: () => setIsVolumeSliderVisible(false)
    },
    React.createElement('div', { className: `transition-all duration-300 ease-in-out overflow-hidden ${isVolumeSliderVisible ? 'w-24 mr-2' : 'w-0 opacity-0'}` },
      React.createElement('input', {
        type: "range",
        min: "0",
        max: "1",
        step: "0.01",
        value: volume,
        onChange: handleVolumeChange,
        className: "w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      })
    ),
    React.createElement('button', {
      onClick: toggleMute,
      className: "p-2 bg-gray-700/50 rounded-full text-white hover:bg-gray-600/50 transition-colors",
      'aria-label': isMuted ? "Unmute music" : "Mute music"
    },
      getVolumeIcon()
    )
  );

  return {
    audioRef,
    handleInitAudio,
    handleSongEnd,
    VolumeControl,
  };
};
