
import React, { useEffect, useState } from 'react';

interface BreathingExerciseProps {
  onComplete: () => void;
}

type BreathingPhase = 'PREPARE' | 'INHALE' | 'HOLD' | 'EXHALE';

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<BreathingPhase>('PREPARE');
  const [timeLeft, setTimeLeft] = useState(20); // Tempo totale aumentato per godersi l'esercizio
  const [instruction, setInstruction] = useState("Preparati alla respirazione profonda...");

  // Gestione del Ciclo di Respirazione (State Machine)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const runPhase = () => {
        switch (phase) {
            case 'PREPARE':
                setInstruction("Preparati alla respirazione profonda...");
                timeout = setTimeout(() => setPhase('INHALE'), 3000); // 3 sec intro
                break;
            case 'INHALE':
                setInstruction("Inspira profondamente...");
                timeout = setTimeout(() => setPhase('HOLD'), 4000); // 4 sec
                break;
            case 'HOLD':
                setInstruction("Trattieni il respiro...");
                timeout = setTimeout(() => setPhase('EXHALE'), 4000); // 4 sec
                break;
            case 'EXHALE':
                setInstruction("Espira lentamente...");
                timeout = setTimeout(() => setPhase('INHALE'), 4000); // 4 sec (Loop back)
                break;
        }
    };

    runPhase();

    return () => clearTimeout(timeout);
  }, [phase]);

  // Gestione Countdown Totale
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  // Calcolo classi CSS dinamiche
  const getCircleClasses = () => {
      switch (phase) {
          case 'PREPARE':
              return 'scale-100 border-amber-200/30 bg-transparent duration-[3000ms]';
          case 'INHALE':
              return 'scale-150 border-amber-100 bg-amber-500/20 duration-[4000ms] ease-out'; // Espansione
          case 'HOLD':
              return 'scale-150 border-amber-300 bg-amber-500/30 duration-[500ms]'; // Mantiene scala massima, leggero cambio colore
          case 'EXHALE':
              return 'scale-90 border-amber-900/40 bg-transparent duration-[4000ms] ease-in-out'; // Contrazione
          default:
              return '';
      }
  };

  const getGlowClasses = () => {
      switch (phase) {
          case 'PREPARE': return 'opacity-0 scale-90 duration-[3000ms]';
          case 'INHALE': return 'opacity-50 scale-150 duration-[4000ms]';
          case 'HOLD': return 'opacity-40 scale-150 duration-[1000ms]';
          case 'EXHALE': return 'opacity-10 scale-75 duration-[4000ms]';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in text-center px-6">
      <h2 className="text-3xl font-serif text-amber-100 mb-12">Centratura</h2>
      
      {/* Visual Circle Animation */}
      <div className="relative mb-16">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-amber-500 rounded-full blur-[60px] transition-all ease-in-out will-change-transform
            ${getGlowClasses()}
        `}></div>
        
        {/* Breathing Circle */}
        <div className={`w-40 h-40 md:w-48 md:h-48 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)] will-change-transform
            ${getCircleClasses()}
        `}>
          <span className={`text-xl font-serif italic text-amber-100 transition-opacity duration-500 absolute w-64 text-center
              ${phase === 'HOLD' ? 'opacity-100' : 'opacity-90'}
          `}>
            {/* Testo vuoto dentro il cerchio per pulizia visiva, istruzioni sotto */}
          </span>
        </div>
      </div>

      <div className="h-12 mb-8">
          <p className="text-2xl font-serif text-amber-100 transition-all duration-500 animate-fade-in">
            {instruction}
          </p>
      </div>

      <p className="text-slate-500 font-light text-sm uppercase tracking-widest mb-8">
        Rilassa la mente
      </p>

      {timeLeft === 0 ? (
         <button 
            onClick={onComplete}
            className="animate-fade-in bg-amber-900/30 border border-amber-500/50 text-amber-100 px-10 py-4 rounded-full hover:bg-amber-500/20 hover:scale-105 transition-all uppercase tracking-widest text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)]"
         >
            Sono Pronto
         </button>
      ) : (
         <div className="flex flex-col items-center gap-2">
             <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-amber-700 transition-all duration-1000 ease-linear"
                   style={{ width: `${(20 - timeLeft) / 20 * 100}%` }}
                 ></div>
             </div>
             <span className="text-[10px] text-slate-600 font-mono">{timeLeft}s</span>
         </div>
      )}
    </div>
  );
};

export default BreathingExercise;
