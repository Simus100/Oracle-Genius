import React from 'react';

interface HexagramVisualProps {
  lines: boolean[];
  highlight?: boolean;
}

const YangLine: React.FC<{ highlight?: boolean }> = ({ highlight }) => (
  <div className={`h-3 rounded-full ${highlight ? 'bg-amber-300' : 'bg-slate-400'}`}></div>
);

const YinLine: React.FC<{ highlight?: boolean }> = ({ highlight }) => (
  <div className="flex justify-between items-center h-3">
    <div className={`w-[45%] h-full rounded-full ${highlight ? 'bg-amber-300' : 'bg-slate-400'}`}></div>
    <div className={`w-[45%] h-full rounded-full ${highlight ? 'bg-amber-300' : 'bg-slate-400'}`}></div>
  </div>
);

const HexagramVisual: React.FC<HexagramVisualProps> = ({ lines, highlight = false }) => {
  return (
    <div className="w-16 space-y-2">
      {lines.slice().reverse().map((isYang, index) => (
        <div key={index}>
          {isYang ? <YangLine highlight={highlight} /> : <YinLine highlight={highlight} />}
        </div>
      ))}
    </div>
  );
};

export default HexagramVisual;
