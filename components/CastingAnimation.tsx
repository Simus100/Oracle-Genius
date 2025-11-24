import React, { useState, useEffect } from 'react';

interface CastingAnimationProps {
  onCastComplete: (value: 6 | 7 | 8 | 9) => void;
  lineNumber: number;
}

const Coin: React.FC<{ isHeads: boolean; spinning: boolean }> = ({ isHeads, spinning }) => (
  <div className={`w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-500 ${spinning ? 'animate-spin' : ''} ${isHeads ? 'bg-amber-100 text-amber-900' : 'bg-amber-700 text-amber-100'}`}>
    {isHeads ? 'YANG' : 'YIN'}
  </div>
);

const CastingAnimation: React.FC<CastingAnimationProps> = ({ onCastComplete, lineNumber }) => {
  const [spinning, setSpinning] = useState(false);
  const [coins, setCoins] = useState([true, true, true]); // true = heads (3), false = tails (2)
  const [resultValue, setResultValue] = useState<number | null>(null);

  const cast = () => {
    if (spinning) return;
    setSpinning(true);
    setResultValue(null);

    // Simulate spin duration
    setTimeout(() => {
      const newCoins = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5];
      setCoins(newCoins);
      setSpinning(false);

      // Calculation: Heads (Yang face) = 3, Tails (Yin face) = 2.
      // Note: Traditionally in I Ching coin method:
      // 3 Tails (2+2+2) = 6 (Old Yin - Changing)
      // 2 Tails, 1 Head (2+2+3) = 7 (Young Yang - Static)
      // 2 Heads, 1 Tail (3+3+2) = 8 (Young Yin - Static)
      // 3 Heads (3+3+3) = 9 (Old Yang - Changing)
      
      // Let's assume for visual simplicity: true = Heads (val 3), false = Tails (val 2)
      const sum = newCoins.reduce((acc, isHead) => acc + (isHead ? 3 : 2), 0);
      setResultValue(sum);
      
      // Small delay before notifying parent to let user see coins
      setTimeout(() => onCastComplete(sum as 6 | 7 | 8 | 9), 800);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
      <h3 className="text-xl text-amber-300 mb-6">Lancio per la Linea {lineNumber}</h3>
      
      <div className="flex gap-4 mb-8">
        {coins.map((c, i) => (
          <Coin key={i} isHeads={c} spinning={spinning} />
        ))}
      </div>

      <div className="h-8 mb-4">
        {!spinning && resultValue && (
            <span className="text-2xl font-bold text-slate-200 fade-in">
                {resultValue === 6 && "6 - Vecchio Yin (Muta in Yang)"}
                {resultValue === 7 && "7 - Giovane Yang (Stabile)"}
                {resultValue === 8 && "8 - Giovane Yin (Stabile)"}
                {resultValue === 9 && "9 - Vecchio Yang (Muta in Yin)"}
            </span>
        )}
      </div>

      <button
        onClick={cast}
        disabled={spinning}
        className="bg-amber-600 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      >
        {spinning ? 'Lancio in corso...' : 'Lancia le Monete'}
      </button>
      
      <p className="mt-4 text-slate-400 text-sm">
        Concentrati sulla tua domanda mentre lanci.
      </p>
    </div>
  );
};

export default CastingAnimation;
