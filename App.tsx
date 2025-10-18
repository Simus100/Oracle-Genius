import React, { useState } from 'react';
import type { Hexagram } from './types';
import { HEXAGRAMS } from './constants/hexagrams';
import { getSuggestions } from './services/semanticService';
import InfoDisplay from './components/InfoDisplay';
import HexagramVisual from './components/HexagramVisual';

// --- Helper Functions & Components ---

const renderWithBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="text-amber-300/90 font-semibold">{part}</strong> : part
      )}
    </>
  );
};

const LineTransformationVisual: React.FC<{ fromYin: boolean }> = ({ fromYin }) => (
  <div className="flex items-center gap-2">
    <div className="w-8">
      {fromYin ? (
        <div className="space-y-1">
          <div className="h-1 bg-slate-500 rounded-full"></div>
          <div className="h-1 bg-slate-500 rounded-full"></div>
        </div>
      ) : (
        <div className="h-2.5 bg-slate-500 rounded-full"></div>
      )}
    </div>
    <span className="text-amber-500 font-mono text-xl">→</span>
    <div className="w-8">
      {fromYin ? (
        <div className="h-2.5 bg-amber-300 rounded-full"></div>
      ) : (
        <div className="space-y-1">
          <div className="h-1 bg-amber-300 rounded-full"></div>
          <div className="h-1 bg-amber-300 rounded-full"></div>
        </div>
      )}
    </div>
  </div>
);

// --- Interpretation Component (Largely Unchanged) ---
const InterpretationDisplay: React.FC<{ start: Hexagram; goal: Hexagram }> = ({ start, goal }) => {
    const changingIndices: number[] = [];
    for (let i = 0; i < start.lines.length; i++) {
        if (start.lines[i] !== goal.lines[i]) {
            changingIndices.push(i);
        }
    }

    if (changingIndices.length === 0) {
        return (
            <div className="mt-8 bg-slate-800/50 p-8 rounded-lg border border-slate-700 max-w-4xl mx-auto text-center animate-fade-in">
                <h3 className="text-3xl font-bold text-amber-300 mb-4">Il Seme e il Fiore sono la Stessa Essenza</h3>
                 <div className="flex justify-center mb-6">
                    <HexagramVisual lines={start.lines} highlight={true} />
                 </div>
                 <div className="text-left space-y-4 text-slate-300 leading-relaxed text-xl">
                    <p>
                        L'Oracolo rivela una verità profonda: la destinazione che cerchi è già il tuo punto di partenza. L'archetipo de <strong>{start.italianName}</strong> contiene in sé sia la sfida che la soluzione, sia il veleno che l'antidoto.
                    </p>
                    <p>
                        Non c'è un "altrove" da raggiungere, ma una profondità da esplorare nel "qui e ora". La tua trasformazione non consiste nel diventare qualcun altro, ma nel comprendere e incarnare pienamente la saggezza che già possiedi.
                    </p>
                     <p className="border-t border-slate-700 pt-4 mt-4">
                        Medita attentamente sulla descrizione completa di questo esagramma: <span className="italic text-amber-300/80">"{start.situationalDescription}"</span>. Quali suoi aspetti stai trascurando? Quale suo potenziale non hai ancora espresso? La risposta non è in un cambiamento esteriore, ma in un'immersione totale nel momento presente. La chiave è smettere di cercare e iniziare a 'essere'.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 animate-fade-in">
            <header className="text-center mb-10">
                <h3 className="text-5xl font-bold text-amber-300 mb-3">Il Tuo Sentiero del Mutamento</h3>
                <p className="text-slate-400 text-xl italic max-w-4xl mx-auto">
                    Dall'archetipo "{start.italianName}" alla piena realizzazione de "{goal.italianName}".
                    L'Oracolo illumina i passi per questa profonda alchimia interiore.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center flex flex-col h-full">
                    <h4 className="text-2xl font-semibold text-slate-200 mb-3">Punto di Partenza</h4>
                    <div className="flex justify-center mb-4">
                        <HexagramVisual lines={start.lines} />
                    </div>
                    <p className="font-bold text-xl text-amber-300">{start.number}. {start.italianName}</p>
                    <div className="text-left flex-grow mt-4">
                        <h5 className="text-amber-400/90 font-semibold text-lg">Interpretazione</h5>
                        <p className="text-slate-300 leading-relaxed text-base mt-2">
                           {renderWithBold(start.situationalDescription)}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-md">
                    <h4 className="text-2xl font-semibold text-amber-400 text-center mb-4">Le Chiavi della Trasformazione</h4>
                    <div className="space-y-5">
                        {changingIndices.map(index => {
                            const fromYin = !start.lines[index];
                            return (
                                <div key={index} className="p-4 bg-black/20 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-amber-300 text-lg">Chiave (Linea {index + 1})</p>
                                        <LineTransformationVisual fromYin={fromYin} />
                                    </div>
                                    <p className="text-slate-300 leading-relaxed text-base whitespace-pre-line border-t border-slate-700 pt-3">{start.lines_advice[index]}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center flex flex-col h-full">
                    <h4 className="text-2xl font-semibold text-slate-200 mb-3">Potenziale da Realizzare</h4>
                    <div className="flex justify-center mb-4">
                        <HexagramVisual lines={goal.lines} highlight={true} />
                    </div>
                     <p className="font-bold text-xl text-amber-300">{goal.number}. {goal.italianName}</p>
                     <div className="text-left flex-grow mt-4">
                        <h5 className="text-amber-400/90 font-semibold text-lg">Interpretazione</h5>
                        <p className="text-slate-300 leading-relaxed text-base mt-2">
                           {renderWithBold(goal.goalDescription)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- New Suggestion Components ---

const SuggestionCard: React.FC<{
  hexagram: Hexagram;
  description: string;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ hexagram, description, onSelect, isSelected }) => (
  <div
    onClick={onSelect}
    className={`bg-slate-800/50 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
      isSelected ? 'border-amber-500 scale-105 shadow-lg shadow-amber-900/50' : 'border-slate-700 hover:border-amber-500/50'
    }`}
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 pt-1"><HexagramVisual lines={hexagram.lines} highlight={isSelected} /></div>
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-slate-200">{hexagram.number}. {hexagram.italianName}</h3>
        <p className="text-slate-400 mt-1 text-sm leading-relaxed">
          {renderWithBold(description)}
        </p>
      </div>
    </div>
  </div>
);

// --- App Component (Refactored) ---

const App: React.FC = () => {
  const [view, setView] = useState<'INPUT' | 'SUGGESTION' | 'INTERPRETATION'>('INPUT');
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedStart, setSuggestedStart] = useState<Hexagram[]>([]);
  const [suggestedGoal, setSuggestedGoal] = useState<Hexagram[]>([]);
  const [startHexagram, setStartHexagram] = useState<Hexagram | null>(null);
  const [goalHexagram, setGoalHexagram] = useState<Hexagram | null>(null);
  const [error, setError] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);

  const handleAnalyze = () => {
    if (userInput.trim().length < 20) {
      setError('Per favore, descrivi la tua situazione con un po\' più di dettaglio per permettere un\'analisi profonda.');
      return;
    }
    setIsLoading(true);
    setError('');
    
    // Simulate a brief analysis period for better UX
    setTimeout(() => {
      const suggestions = getSuggestions(userInput, HEXAGRAMS);
      
      if (suggestions.start.length === 0 || suggestions.goal.length === 0) {
        setError("L'Oracolo non ha trovato una risonanza chiara con le tue parole. Prova a descrivere la tua situazione con termini diversi o con maggiore dettaglio, concentrandoti sulle sensazioni e sugli obiettivi.");
        setIsLoading(false);
        return;
      }

      setSuggestedStart(suggestions.start);
      setSuggestedGoal(suggestions.goal);
      setView('SUGGESTION');
      setIsLoading(false);
    }, 500);
  };
  
  const handleShowInterpretation = () => {
      if (!startHexagram || !goalHexagram) {
          setError('Seleziona un archetipo sia per la partenza che per l\'obiettivo per poter procedere.');
          return;
      }
      setError('');
      setView('INTERPRETATION');
  }

  const handleReset = () => {
    setUserInput('');
    setSuggestedStart([]);
    setSuggestedGoal([]);
    setStartHexagram(null);
    setGoalHexagram(null);
    setError('');
    setView('INPUT');
  };
  
  const placeholderText = `Descrivi il tuo percorso...
- Qual è la tua situazione iniziale?
- Quali sono le emozioni negative che vuoi cambiare?
- Quali sono le tue sensazioni che vuoi migliorare?
- Qual è il tuo obiettivo?`;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-800 text-gray-200 flex flex-col items-center p-4 selection:bg-amber-500 selection:text-slate-900">
        <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col justify-center">

          {view === 'INPUT' && (
            <div className="animate-fade-in">
              <header className="text-center mb-8">
                <h1 className="text-5xl md:text-7xl font-bold text-amber-300 tracking-wider">Oracolo del Mutamento</h1>
                <p className="text-slate-400 mt-3 text-xl">Uno specchio per la tua crescita interiore.</p>
                <button onClick={() => setShowInfo(true)} className="mt-4 text-amber-400 hover:text-amber-200 transition-colors underline text-lg">
                    Cos'è l'Oracolo?
                </button>
              </header>
              <main className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-black/30 p-6 md:p-10 border border-slate-700">
                <h2 className="text-3xl text-slate-300 mb-6 text-center">Interroga l'Oracolo.</h2>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full h-64 bg-slate-800 border border-slate-600 rounded-lg p-4 text-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-500"
                />
                {error && <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg mt-6 text-base">{error}</div>}
                <div className="text-center mt-6">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="bg-amber-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400/50 text-2xl disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {isLoading ? 'Analizzando...' : 'Interpreta la mia situazione'}
                  </button>
                </div>
              </main>
            </div>
          )}

          {view === 'SUGGESTION' && (
             <div className="animate-fade-in">
                 <header className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-amber-300">Scegli i Tuoi Archetipi</h1>
                    <p className="text-slate-400 mt-2 text-xl">L'Oracolo ha identificato questi percorsi. Quali risuonano di più con te?</p>
                </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <h2 className="text-3xl text-amber-300 mb-4 text-center">1. Punto di Partenza</h2>
                         <div className="space-y-4">
                             {suggestedStart.map(hex => (
                                 <SuggestionCard 
                                     key={`start-${hex.number}`}
                                     hexagram={hex}
                                     description={hex.situationalDescription}
                                     onSelect={() => setStartHexagram(hex)}
                                     isSelected={startHexagram?.number === hex.number}
                                 />
                             ))}
                         </div>
                     </div>
                     <div>
                         <h2 className="text-3xl text-amber-300 mb-4 text-center">2. Potenziale da Realizzare</h2>
                         <div className="space-y-4">
                             {suggestedGoal.map(hex => (
                                 <SuggestionCard 
                                     key={`goal-${hex.number}`}
                                     hexagram={hex}
                                     description={hex.goalDescription}
                                     onSelect={() => setGoalHexagram(hex)}
                                     isSelected={goalHexagram?.number === hex.number}
                                 />
                             ))}
                         </div>
                     </div>
                 </div>
                 {error && <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg mt-6 text-base">{error}</div>}
                 <div className="text-center mt-8">
                      <button
                        onClick={handleShowInterpretation}
                        disabled={!startHexagram || !goalHexagram}
                        className="bg-amber-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-amber-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400/50 text-2xl disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100"
                      >
                        Rivela il Sentiero
                      </button>
                  </div>
             </div>
          )}
          
          {view === 'INTERPRETATION' && startHexagram && goalHexagram && (
            <div className="animate-fade-in w-full">
               <InterpretationDisplay start={startHexagram} goal={goalHexagram} />
               <div className="text-center mt-12">
                  <button
                    onClick={handleReset}
                    className="bg-slate-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-500/50 text-xl"
                  >
                    Poni un'Altra Domanda
                  </button>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center text-slate-500 py-4 mt-8">
          Ispirato alla saggezza dell'I Ching
        </footer>
      </div>
      <InfoDisplay show={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
};

export default App;