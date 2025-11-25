
import React, { useEffect, useState } from 'react';

interface BreathingExerciseProps {
  onComplete: () => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [timeLeft, setTimeLeft] = useState(15); // Durata totale esercizio
  const [instruction, setInstruction] = useState("Inspira...");

  useEffect(() => {
    // Ciclo di respirazione 4-4-4 (semplificato per UX)
    // Inspira 4s, Trattieni 2s, Espira 4s
    
    const cycleDuration = 10000; // 10 secondi a ciclo
    
    const breatheInterval = setInterval(() => {
      setPhase('INHALE');
      setInstruction("Inspira profondamente...");
      
      setTimeout(() => {
        setPhase('HOLD');
        setInstruction("Trattieni...");
      }, 4000);

      setTimeout(() => {
        setPhase('EXHALE');
        setInstruction("Espira lentamente...");
      }, 6000);

    }, cycleDuration);

    // Initial setup for first cycle
    setTimeout(() => {
        setPhase('HOLD');
        setInstruction("Trattieni...");
    }, 4000);
    setTimeout(() => {
        setPhase('EXHALE');
        setInstruction("Espira lentamente...");
    }, 6000);

    // Countdown generale per finire l'esercizio
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(breatheInterval);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(breatheInterval);
      clearInterval(countdown);
    };
  }, []);

  // Calcolo delle classi dinamiche per l'animazione
  const getCircleClasses = () => {
      if (phase === 'INHALE') return 'scale-125 border-amber-100 bg-amber-500/10 duration-[4000ms]';
      if (phase === 'HOLD') return 'scale-125 border-amber-300/50 bg-amber-500/20 duration-[1000ms]'; // Mantiene la scala massima, cambia leggermente colore
      if (phase === 'EXHALE') return 'scale-90 border-amber-900/50 bg-transparent duration-[4000ms]';
      return '';
  };

  const getGlowClasses = () => {
      if (phase === 'INHALE') return 'scale-150 opacity-40 duration-[4000ms]';
      if (phase === 'HOLD') return 'scale-150 opacity-30 duration-[1000ms]'; // Mantiene scala massima
      if (phase === 'EXHALE') return 'scale-75 opacity-10 duration-[4000ms]';
      return '';
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in text-center px-6">
      <h2 className="text-3xl font-serif text-amber-100 mb-12">Centratura</h2>
      
      {/* Visual Circle Animation */}
      <div className="relative mb-16">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-amber-500 rounded-full blur-[60px] transition-all ease-in-out
            ${getGlowClasses()}
        `}></div>
        
        {/* Breathing Circle */}
        <div className={`w-48 h-48 rounded-full border-2 border-amber-200/50 flex items-center justify-center backdrop-blur-sm transition-all ease-in-out shadow-[0_0_30px_rgba(251,191,36,0.2)]
            ${getCircleClasses()}
        `}>
          <span className="text-xl font-serif italic text-amber-100 transition-opacity duration-1000">
            {instruction}
          </span>
        </div>
      </div>

      <p className="text-slate-400 font-light max-w-md text-lg leading-relaxed mb-8">
        Lascia che i pensieri del giorno si dissolvano.<br/>
        Preparati a ricevere.
      </p>

      {timeLeft === 0 ? (
         <button 
            onClick={onComplete}
            className="animate-fade-in bg-transparent border border-amber-500/50 text-amber-100 px-8 py-3 rounded-full hover:bg-amber-500/10 transition-all uppercase tracking-widest text-xs font-bold"
         >
            Sono Pronto
         </button>
      ) : (
         <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-amber-600 transition-all duration-1000 ease-linear"
               style={{ width: `${(15 - timeLeft) / 15 * 100}%` }}
             ></div>
         </div>
      )}
    </div>
  );
};

export default BreathingExercise;
