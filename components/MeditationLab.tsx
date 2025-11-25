
import React, { useState, useEffect } from 'react';
import { audioManager } from '../utils/audioEngine';
import SacredGeometry from './SacredGeometry';

interface MeditationLabProps {
  onExit: () => void;
}

const MeditationLab: React.FC<MeditationLabProps> = ({ onExit }) => {
  const [duration, setDuration] = useState(10); // Minuti
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [element, setElement] = useState('EARTH');
  const [density, setDensity] = useState(1.0); // Chime density
  
  // Stato per la modalità tutto schermo (Immersiva)
  const [isImmersive, setIsImmersive] = useState(false);

  // Formattazione tempo mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Inizializza audio
    audioManager.init();
    audioManager.startDrone();
    audioManager.updateTexture('EARTH'); // Default start
    
    return () => {
      audioManager.stop();
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleElementChange = (el: string) => {
      setElement(el);
      audioManager.setAtmosphere(el);
  };

  const handleDensityChange = (val: number) => {
      setDensity(val);
      audioManager.setChimeDensity(val);
  };

  const toggleTimer = () => {
      setIsActive(!isActive);
  };

  const adjustTime = (deltaMin: number) => {
      const newDur = Math.max(1, Math.min(60, duration + deltaMin));
      setDuration(newDur);
      setTimeLeft(newDur * 60);
      setIsActive(false);
  };

  // UI Helpers
  const elements = [
      { id: 'EARTH', label: 'Terra', icon: '⛰️', color: 'text-amber-700 border-amber-800' },
      { id: 'WATER', label: 'Acqua', icon: '💧', color: 'text-cyan-600 border-cyan-800' },
      { id: 'FIRE', label: 'Fuoco', icon: '🔥', color: 'text-red-600 border-red-800' },
      { id: 'WIND', label: 'Vento', icon: '🍃', color: 'text-emerald-600 border-emerald-800' },
      { id: 'ETHER', label: 'Etere', icon: '✨', color: 'text-indigo-400 border-indigo-800' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-fade-in w-full max-w-4xl mx-auto px-6 relative overflow-hidden">
      
      {/* BACKGROUND VISUAL ENGINE */}
      <SacredGeometry element={element} isActive={isActive} />

      {/* OVERLAY IMMERSIVO (CLICCA PER USCIRE) */}
      {isImmersive && (
          <div 
            className="absolute inset-0 z-50 cursor-pointer flex items-end justify-center pb-12"
            onClick={() => setIsImmersive(false)}
          >
              <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold animate-pulse">
                  Tocca lo schermo per mostrare i controlli
              </p>
          </div>
      )}

      {/* UI ELEMENTS (nascosti se immersive è true) */}
      {!isImmersive && (
        <>
            {/* Header Minimal */}
            <div className="absolute top-0 w-full flex justify-between items-center py-6 border-b border-white/5 z-20 animate-fade-in">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Sala di Meditazione</span>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setIsImmersive(true)}
                        className="text-amber-500 hover:text-amber-300 transition-colors text-[10px] uppercase tracking-widest font-bold border border-amber-900/50 rounded-full px-3 py-1 bg-black/40 hover:bg-amber-900/20 flex items-center gap-2"
                    >
                        <span>⛶</span> Immersione
                    </button>
                    <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Esce</button>
                </div>
            </div>

            {/* Main Visual: Pulsing Circle & Timer */}
            <div className="relative mb-16 mt-20 group z-10 animate-fade-in">
                <div className={`w-64 h-64 rounded-full border-2 flex items-center justify-center transition-all duration-1000 relative z-10 backdrop-blur-sm
                    ${isActive ? 'scale-110 border-amber-500/30 bg-black/20' : 'border-slate-800 bg-black/40'}
                    ${isActive ? 'shadow-[0_0_50px_rgba(245,158,11,0.1)]' : ''}
                `}>
                    <div className="text-center">
                        <div className="text-6xl font-serif text-slate-200 tabular-nums font-light tracking-wider drop-shadow-lg">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="flex justify-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => adjustTime(-5)} className="text-slate-500 hover:text-amber-400 text-xl font-bold">-</button>
                            <button onClick={toggleTimer} className="text-amber-500 text-xs font-bold uppercase tracking-widest border border-amber-900/50 px-3 py-1 rounded-full hover:bg-amber-900/20 bg-black/50">
                                {isActive ? 'Pausa' : 'Avvia'}
                            </button>
                            <button onClick={() => adjustTime(5)} className="text-slate-500 hover:text-amber-400 text-xl font-bold">+</button>
                        </div>
                    </div>
                </div>
                
                {/* Ambient Glow based on Element */}
                <div className={`absolute inset-0 rounded-full blur-[100px] opacity-20 transition-colors duration-1000 pointer-events-none
                    ${element === 'FIRE' ? 'bg-red-600' : ''}
                    ${element === 'WATER' ? 'bg-cyan-600' : ''}
                    ${element === 'EARTH' ? 'bg-amber-800' : ''}
                    ${element === 'WIND' ? 'bg-emerald-600' : ''}
                    ${element === 'ETHER' ? 'bg-indigo-600' : ''}
                `}></div>
            </div>

            {/* Controls Container */}
            <div className="w-full max-w-2xl bg-[#0a0a0c]/80 border border-white/5 rounded-2xl p-8 backdrop-blur-xl z-20 shadow-2xl animate-fade-in">
                
                {/* Element Selector */}
                <div className="mb-8">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4 text-center">Atmosfera Elementale</label>
                    <div className="flex justify-center gap-3 flex-wrap">
                        {elements.map((el) => (
                            <button
                                key={el.id}
                                onClick={() => handleElementChange(el.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-300
                                    ${element === el.id 
                                        ? `${el.color} bg-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-105` 
                                        : 'border-transparent text-slate-600 hover:text-slate-400 hover:bg-white/5'}
                                `}
                            >
                                <span>{el.icon}</span>
                                <span className="text-sm font-serif">{el.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-white/5 w-full my-6"></div>

                {/* Density Slider */}
                <div className="px-4">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Attività Sonora</label>
                        <span className="text-xs text-amber-500 font-mono">{density < 0.8 ? 'ZEN' : density > 1.5 ? 'ATTIVA' : 'BILANCIATA'}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" 
                        max="3.0" 
                        step="0.1" 
                        value={density}
                        onChange={(e) => handleDensityChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600 hover:accent-amber-500"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-slate-600 uppercase tracking-widest">
                        <span>Silenzio</span>
                        <span>Flusso</span>
                    </div>
                </div>

            </div>
        </>
      )}

    </div>
  );
};

export default MeditationLab;
