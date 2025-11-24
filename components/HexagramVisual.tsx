
import React from 'react';

interface HexagramVisualProps {
  lines: boolean[];
  highlight?: boolean;
}

const YangLine: React.FC<{ highlight?: boolean }> = ({ highlight }) => (
  <div className={`h-3 md:h-4 w-full rounded-sm shadow-sm transition-all duration-500
    ${highlight 
      ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
      : 'bg-slate-700/80 border border-slate-600'
    }`}>
  </div>
);

const YinLine: React.FC<{ highlight?: boolean }> = ({ highlight }) => (
  <div className="flex justify-between items-center h-3 md:h-4 w-full">
    <div className={`w-[42%] h-full rounded-sm shadow-sm transition-all duration-500
      ${highlight 
        ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
        : 'bg-slate-700/80 border border-slate-600'
      }`}></div>
    <div className={`w-[42%] h-full rounded-sm shadow-sm transition-all duration-500
      ${highlight 
        ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
        : 'bg-slate-700/80 border border-slate-600'
      }`}></div>
  </div>
);

const HexagramVisual: React.FC<HexagramVisualProps> = ({ lines, highlight = false }) => {
  return (
    <div className={`w-28 md:w-36 space-y-2 md:space-y-3 p-5 rounded-lg backdrop-blur-sm transition-all duration-700 ${highlight ? 'bg-amber-900/10 border border-amber-500/20' : 'bg-transparent'}`}>
      {lines.slice().reverse().map((isYang, index) => (
        <div key={index} className="w-full">
          {isYang ? <YangLine highlight={highlight} /> : <YinLine highlight={highlight} />}
        </div>
      ))}
    </div>
  );
};

export default HexagramVisual;