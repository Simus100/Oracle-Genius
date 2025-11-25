
import React, { useState, useEffect, useRef } from 'react';
import type { Hexagram } from './types';
import HexagramVisual from './components/HexagramVisual';
import InfoDisplay from './components/InfoDisplay';
import BreathingExercise from './components/BreathingExercise';
import { performSemanticAnalysis, SemanticAnalysisResult } from './utils/semanticEngine';
import { audioManager } from './utils/audioEngine';

// --- DEFINIZIONE ARCHETIPI/TAG PER L'UTENTE ---

interface TagOption {
    id: string;
    label: string;
    category: 'emotion' | 'context' | 'action';
}

const SITUATION_TAGS: TagOption[] = [
    { id: 'confusione', label: 'Confusione', category: 'emotion' },
    { id: 'ansia', label: 'Ansia', category: 'emotion' },
    { id: 'blocco', label: 'Blocco', category: 'context' },
    { id: 'tristezza', label: 'Tristezza', category: 'emotion' },
    { id: 'rabbia', label: 'Rabbia', category: 'emotion' },
    { id: 'conflitto', label: 'Conflitto', category: 'context' },
    { id: 'solitudine', label: 'Solitudine', category: 'emotion' },
    { id: 'apatia', label: 'Apatia', category: 'emotion' },
    { id: 'colpa', label: 'Senso di Colpa', category: 'emotion' },
    { id: 'tradimento', label: 'Tradimento', category: 'context' },
    { id: 'vuoto', label: 'Vuoto Interiore', category: 'emotion' },
    { id: 'crisi', label: 'Crisi', category: 'context' },
    { id: 'gelosia', label: 'Gelosia', category: 'emotion' },
    { id: 'nostalgia', label: 'Nostalgia', category: 'emotion' },
    { id: 'urgenza', label: 'Urgenza', category: 'action' },
    { id: 'attesa', label: 'Attesa', category: 'action' },
    { id: 'lavoro', label: 'Problemi di Lavoro', category: 'context' },
    { id: 'relazione', label: 'Crisi Relazionale', category: 'context' },
    { id: 'stanchezza', label: 'Esaurimento', category: 'emotion' },
    { id: 'paura', label: 'Paura', category: 'emotion' },
];

const GOAL_TAGS: TagOption[] = [
    { id: 'pace', label: 'Pace Interiore', category: 'emotion' },
    { id: 'equilibrio', label: 'Equilibrio', category: 'emotion' },
    { id: 'chiarezza', label: 'Chiarezza', category: 'emotion' },
    { id: 'coraggio', label: 'Coraggio', category: 'emotion' },
    { id: 'successo', label: 'Successo', category: 'action' },
    { id: 'verita', label: 'Verità', category: 'context' },
    { id: 'guarigione', label: 'Guarigione', category: 'action' },
    { id: 'perdono', label: 'Perdono', category: 'action' },
    { id: 'indipendenza', label: 'Indipendenza', category: 'action' },
    { id: 'abbondanza', label: 'Abbondanza', category: 'context' },
    { id: 'gioia', label: 'Gioia di Vivere', category: 'emotion' },
    { id: 'saggezza', label: 'Saggezza', category: 'emotion' },
    { id: 'semplicita', label: 'Semplicità', category: 'emotion' },
    { id: 'unione', label: 'Unione', category: 'context' },
    { id: 'sicurezza', label: 'Sicurezza', category: 'context' },
    { id: 'cambiamento', label: 'Cambiamento', category: 'action' },
];

// --- HELPER COMPONENTS ---

const TagSelector: React.FC<{ 
    options: TagOption[], 
    selected: string[], 
    toggle: (id: string) => void,
    max?: number
}> = ({ options, selected, toggle, max = 5 }) => (
    <div className="grid grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
        {options.map(opt => {
            const isSelected = selected.includes(opt.id);
            const isDisabled = !isSelected && selected.length >= max;
            return (
                <button
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    disabled={isDisabled}
                    className={`py-2 px-3 md:py-3 md:px-4 rounded-lg text-xs md:text-sm font-medium tracking-wide transition-all duration-300 border backdrop-blur-sm truncate
                        ${isSelected 
                            ? 'bg-amber-900/40 border-amber-500/60 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)] transform scale-[1.02]' 
                            : isDisabled 
                                ? 'opacity-20 cursor-not-allowed bg-transparent border-slate-800' 
                                : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200 hover:bg-white/10'}
                    `}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

const LineAdviceCard: React.FC<{ lineIndex: number, text: string }> = ({ lineIndex, text }) => (
    <div className="relative group overflow-hidden bg-[#0c0c0e] border border-amber-900/20 p-6 md:p-8 rounded-xl mb-6 transition-all hover:border-amber-700/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)]">
        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-amber-600 to-transparent opacity-40 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">Mutamento</span>
            <div className="h-px w-8 bg-amber-900/30"></div>
            <span className="text-amber-200 font-serif text-xl italic">Linea {lineIndex + 1}</span>
        </div>
        <div className="text-slate-300 text-lg font-serif leading-8 opacity-90 group-hover:opacity-100 transition-opacity text-justify">
            {text}
        </div>
    </div>
);

// --- COMPONENTE SCHEDA ESAGRAMMA ---

const HexagramCard: React.FC<{ 
    hex: Hexagram, 
    type: 'START' | 'GOAL',
    defaultTab: 'GENERAL' | 'LOVE' | 'WORK' | 'GROWTH'
}> = ({ hex, type, defaultTab }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'LOVE' | 'WORK' | 'GROWTH'>(defaultTab);
    const contentRef = useRef<HTMLDivElement>(null);

    const isStart = type === 'START';
    
    // Reset scroll when tab changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeTab]);
    
    // Stili dinamici
    const containerClass = "bg-[#0a0a0c]/80 backdrop-blur-xl h-[85vh] p-0 rounded-2xl flex flex-col relative overflow-hidden transition-all duration-500 border border-white/5 shadow-2xl";
    
    return (
        <div className={containerClass}>
            {/* Ambient Glow */}
            <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-40 ${isStart ? 'bg-indigo-900' : 'bg-amber-900'}`}></div>

            {/* Header Fixed */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6 relative z-10 border-b border-white/5 shrink-0 bg-[#0a0a0c]/50">
                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 ${isStart ? 'text-indigo-400' : 'text-amber-500'}`}>
                    {isStart ? "Situazione Attuale" : "Prospettiva Futura"}
                </span>
                
                <div className="transform scale-75 mb-2">
                    <HexagramVisual lines={hex.lines} highlight={!isStart} />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-serif text-center mt-2 mb-1 text-slate-100 font-medium">
                    {hex.italianName}
                </h3>
                
                <div className="flex items-center gap-2 text-slate-500 font-serif italic text-sm md:text-base">
                    <span>Esagramma {hex.number}</span>
                    <span className="hidden md:inline">&bull;</span>
                    <span className="hidden md:inline opacity-70">{hex.name}</span>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center py-4 relative z-10 border-b border-white/5 bg-[#0a0a0c]/30 shrink-0">
                <div className="flex space-x-6">
                    {[
                        { id: 'GENERAL', label: 'Generale' },
                        { id: 'LOVE', label: 'Amore' },
                        { id: 'WORK', label: 'Lavoro' },
                        { id: 'GROWTH', label: 'Spirito' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 relative
                                ${activeTab === tab.id 
                                    ? 'text-amber-400' 
                                    : 'text-slate-600 hover:text-slate-400'}
                            `}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div ref={contentRef} className="relative z-10 flex-grow overflow-y-auto custom-scrollbar p-6 md:p-8 scroll-smooth">
                <div className="animate-fade-in max-w-prose mx-auto pb-10">
                    {activeTab === 'GENERAL' && (
                        <div className="space-y-8">
                            {hex.traditionalImage && (
                                <div className="bg-white/5 p-5 rounded-lg border border-white/5 italic font-serif text-slate-400 text-center text-lg leading-relaxed">
                                    "{hex.traditionalImage}"
                                </div>
                            )}
                            
                            {hex.judgement && (
                                <div className="border-l-2 border-amber-500/30 pl-6 py-2">
                                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">La Sentenza</h4>
                                    <blockquote className="text-slate-300 text-xl font-serif italic leading-relaxed">
                                        {hex.judgement}
                                    </blockquote>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">L'Analisi Profonda</h4>
                                <p className="text-lg md:text-xl leading-8 font-serif text-slate-200 text-justify">
                                    {isStart ? hex.situationalDescription : hex.goalDescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'LOVE' && (
                        <div className="bg-gradient-to-b from-pink-900/5 to-transparent p-6 rounded-xl border border-pink-500/10">
                            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-4">La Via del Cuore</h4>
                            <p className="text-slate-200 font-serif text-lg md:text-xl leading-8 text-justify">{hex.loveAdvice}</p>
                        </div>
                    )}

                    {activeTab === 'WORK' && (
                        <div className="bg-gradient-to-b from-blue-900/5 to-transparent p-6 rounded-xl border border-blue-500/10">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">La Via dell'Opera</h4>
                            <p className="text-slate-200 font-serif text-lg md:text-xl leading-8 text-justify">{hex.workAdvice}</p>
                        </div>
                    )}

                    {activeTab === 'GROWTH' && (
                        <div className="bg-gradient-to-b from-emerald-900/5 to-transparent p-6 rounded-xl border border-emerald-500/10">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">La Via dello Spirito</h4>
                            <p className="text-slate-200 font-serif text-lg md:text-xl leading-8 text-justify">{hex.growthAdvice}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// --- COMPONENTE PRINCIPALE ---

const App: React.FC = () => {
    // State del Wizard
    // 0 = Landing (Start Ritual)
    // 1 = Breathing (Centering)
    // 2 = Situation Input
    // 3 = Goal Input
    // 4 = Results
    const [step, setStep] = useState<number>(0);
    const [isMuted, setIsMuted] = useState(false);
    
    // Dati Input Utente
    const [situationText, setSituationText] = useState('');
    const [situationTags, setSituationTags] = useState<string[]>([]);
    
    const [goalText, setGoalText] = useState('');
    const [goalTags, setGoalTags] = useState<string[]>([]);

    // Risultati
    const [analysisResult, setAnalysisResult] = useState<SemanticAnalysisResult | null>(null);
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Audio Control Logic
    const toggleAudio = () => {
        setIsMuted(!isMuted);
        audioManager.toggleMute(!isMuted);
    };

    const startRitual = () => {
        // Initialize audio engine on user interaction
        audioManager.init();
        audioManager.startDrone();
        setStep(1); // Go to breathing
    };

    // Handlers
    const toggleSituationTag = (id: string) => {
        setSituationTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleGoalTag = (id: string) => {
        setGoalTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleNext = () => {
        if (step === 2 && (situationText.length > 2 || situationTags.length > 0)) {
            setStep(3);
            window.scrollTo(0,0);
        } else if (step === 3 && (goalTags.length > 0 || goalText.length > 2)) {
            analyze();
        }
    };

    const analyze = () => {
        setIsAnalyzing(true);
        window.scrollTo(0,0);
        setTimeout(() => {
            const result = performSemanticAnalysis(situationText, situationTags, goalText, goalTags);
            if (result) {
                setAnalysisResult(result);
                setStep(4);
                window.scrollTo(0,0);
            }
            setIsAnalyzing(false);
        }, 3000); 
    };

    const reset = () => {
        setStep(0); // Torniamo alla landing page
        setSituationText('');
        setSituationTags([]);
        setGoalText('');
        setGoalTags([]);
        setAnalysisResult(null);
        audioManager.stop(); // Fermiamo l'audio quando si resetta
        window.scrollTo(0,0);
    };

    // --- LANDING PAGE (STEP 0) ---
    const renderLanding = () => (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center px-4">
            <div className="mb-10 relative">
                <div className="absolute inset-0 bg-amber-500 blur-[80px] opacity-20 rounded-full animate-pulse"></div>
                <div className="w-32 h-32 rounded-full border border-amber-500/30 flex items-center justify-center bg-[#0a0a0c] relative z-10 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                    <span className="text-5xl">🔮</span>
                </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif text-gold-gradient mb-6 tracking-tight">Oracle Genius</h1>
            <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-12">
                Un antico specchio digitale per l'anima moderna.<br/>
                Prima di chiedere, fermati. Prima di sapere, respira.
            </p>
            
            <button 
                onClick={startRitual}
                className="group relative bg-transparent border border-amber-600/50 text-amber-100 hover:bg-amber-900/20 px-12 py-5 rounded-full font-medium text-lg transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] tracking-widest uppercase text-xs"
            >
                <span className="relative z-10">Inizia il Rituale</span>
                <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <p className="mt-8 text-xs text-slate-600 uppercase tracking-widest opacity-60">
                Audio Consigliato per l'immersione
            </p>
        </div>
    );

    // --- INPUT WIZARD COMMON UI ---
    const renderWizardStep = (
        title: string, 
        subtitle: string, 
        placeholder: string,
        textValue: string,
        setText: (s: string) => void,
        tags: TagOption[],
        selectedTags: string[],
        toggleTag: (id: string) => void,
        onNext: () => void,
        isLastStep: boolean,
        isValid: boolean
    ) => (
        <div className="animate-fade-in w-full max-w-4xl mx-auto py-10">
            <div className="text-center mb-12">
                <div className="inline-block px-3 py-1 mb-4 rounded-full border border-white/10 bg-white/5">
                    <span className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em] block">Fase {step - 1} di 2</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-serif text-gold-gradient mb-6 leading-tight">{title}</h2>
                <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto">{subtitle}</p>
            </div>

            <div className="bg-[#0a0a0c] p-1 rounded-2xl mb-10 shadow-2xl border border-white/10 relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                <textarea 
                    value={textValue}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-[#0e0e11] text-slate-200 placeholder-slate-700 rounded-xl p-8 text-xl font-serif leading-relaxed border border-transparent focus:border-amber-900/50 outline-none transition-all min-h-[200px] resize-none shadow-inner"
                />
            </div>

            <div className="mb-14">
                <div className="flex items-center justify-center gap-4 mb-8">
                     <div className="h-px bg-gradient-to-r from-transparent to-slate-800 w-16"></div>
                     <label className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Risonanze Emotive (Max 5)
                    </label>
                    <div className="h-px bg-gradient-to-l from-transparent to-slate-800 w-16"></div>
                </div>
                
                <TagSelector options={tags} selected={selectedTags} toggle={toggleTag} max={5} />
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-white/5">
                {step > 2 ? (
                    <button onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-300 transition-colors text-xs uppercase tracking-widest font-bold px-6 py-3 flex items-center gap-2 group">
                        <span>&larr;</span> <span className="group-hover:translate-x-1 transition-transform">Indietro</span>
                    </button>
                ) : (
                    <div></div> 
                )}
                
                <button 
                    onClick={onNext}
                    disabled={!isValid || isAnalyzing}
                    className="relative group bg-slate-100 hover:bg-white text-black px-10 py-4 rounded-full font-medium text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:hover:shadow-none"
                >
                    {isAnalyzing ? (
                        <span className="flex items-center gap-3 animate-pulse">
                           Consultazione in corso...
                        </span>
                    ) : (
                       isLastStep ? "Rivela il Responso" : "Continua il Viaggio"
                    )}
                </button>
            </div>
        </div>
    );

    // --- RENDER STEP 4: RISULTATO ---
    const renderResult = () => {
        if (!analysisResult) return null;
        
        const { startHexagram, goalHexagram, movingLines, detectedContext } = analysisResult;

        return (
            <div className="animate-fade-in w-full max-w-[1400px] mx-auto px-4 pb-24">
                <header className="text-center mb-20 pt-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-amber-900/20 border border-amber-500/20 text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        Responso Dell'Oracolo
                    </span>
                    <h2 className="text-5xl md:text-8xl font-serif text-gold-gradient mb-8 tracking-tight">Il Sentiero del Mutamento</h2>
                    
                    <div className="flex justify-center items-center gap-3 text-sm font-medium uppercase tracking-wide">
                         <span className={`px-4 py-1 rounded-full border ${detectedContext === 'LOVE' ? 'border-pink-500/50 text-pink-400 bg-pink-900/10' : 'border-transparent text-slate-600'}`}>
                            Amore
                         </span>
                         <span className={`px-4 py-1 rounded-full border ${detectedContext === 'WORK' ? 'border-blue-500/50 text-blue-400 bg-blue-900/10' : 'border-transparent text-slate-600'}`}>
                            Lavoro
                         </span>
                         <span className={`px-4 py-1 rounded-full border ${detectedContext === 'GROWTH' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-900/10' : 'border-transparent text-slate-600'}`}>
                            Spirito
                         </span>
                    </div>
                </header>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-16 items-start">
                    <HexagramCard 
                        hex={startHexagram} 
                        type="START" 
                        defaultTab={detectedContext} 
                    />
                    <HexagramCard 
                        hex={goalHexagram} 
                        type="GOAL" 
                        defaultTab={detectedContext} 
                    />
                </div>

                {/* ADVICE SECTION */}
                <div className="max-w-4xl mx-auto mt-24 relative">
                    {/* Decorative vertical line connecting visual flow */}
                    <div className="absolute -top-24 left-1/2 w-px h-24 bg-gradient-to-b from-transparent to-amber-900/50 hidden lg:block"></div>
                    
                    <div className="bg-[#08080a] border border-amber-900/20 p-8 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent opacity-60"></div>
                        
                        <div className="text-center mb-12">
                            <h4 className="text-4xl md:text-5xl font-serif text-slate-100 mb-4">Le Chiavi del Mutamento</h4>
                            <p className="text-slate-500 font-light italic text-lg">"Ciò che muta, insegna. Ciò che resta, fonda."</p>
                        </div>
                        
                        {movingLines.length > 0 ? (
                            <div className="space-y-6">
                                {movingLines.map(idx => (
                                    <LineAdviceCard key={idx} lineIndex={idx} text={startHexagram.lines_advice[idx]} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-10 bg-[#0c0c0e] rounded-2xl border border-white/5">
                                <span className="text-5xl mb-6 block opacity-50 grayscale">🏔️</span>
                                <p className="text-amber-200 text-2xl font-serif italic mb-6">"Il Tempo della Stabilità"</p>
                                <p className="text-slate-400 leading-8 font-light text-lg">
                                    Nessuna linea si sta muovendo. Questo è un evento raro e significativo. 
                                    Indica che la situazione ha raggiunto una forma stabile e compiuta per il momento. 
                                    L'archetipo che hai ricevuto non è solo un punto di partenza, ma contiene già in sé la risposta completa. 
                                    Non cercare di agire all'esterno o di forzare un cambiamento; il lavoro richiesto ora è di approfondimento verticale, non di espansione orizzontale.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PSYCHOMAGIC TASK SECTION - NEW POINT 3 */}
                {startHexagram.psychomagicTask && (
                    <div className="max-w-4xl mx-auto mt-12 mb-20 animate-fade-in">
                        <div className="bg-[#0c0c0e] border border-indigo-900/30 p-8 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-900/20 blur-[50px] rounded-full group-hover:bg-indigo-600/20 transition-all"></div>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="shrink-0 w-20 h-20 rounded-full bg-[#111] border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                                    <span className="text-3xl">✨</span>
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">Il Rituale di Azione</h4>
                                    <h3 className="text-2xl font-serif text-slate-200 mb-4">L'Atto Psicomagico</h3>
                                    <p className="text-slate-300 font-serif italic text-lg leading-relaxed">
                                        "{startHexagram.psychomagicTask}"
                                    </p>
                                    <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest font-medium">
                                        Esegui questo compito per sbloccare l'energia
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center mt-32">
                    <button 
                        onClick={reset}
                        className="text-slate-600 hover:text-amber-400 text-xs font-bold uppercase tracking-[0.3em] transition-colors py-4 px-8 border-b border-transparent hover:border-amber-900/50"
                    >
                        Nuova Consultazione
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#15151a] via-[#050505] to-[#000000] text-slate-200 font-sans selection:bg-amber-900 selection:text-white overflow-x-hidden">
                
                {/* Navbar Minimal */}
                <nav className="w-full py-8 px-6 flex justify-between items-center max-w-[1400px] mx-auto z-50 relative">
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={reset}>
                        <div className="w-10 h-10 rounded-full border border-amber-500/20 flex items-center justify-center group-hover:border-amber-500/50 transition-colors bg-black/50 backdrop-blur-md">
                            <div className="w-2 h-2 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:scale-125 transition-transform"></div>
                        </div>
                        <span className="font-serif text-2xl text-slate-300 tracking-wide">Oracle <span className="text-amber-600">Genius</span></span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {step > 0 && (
                             <button onClick={toggleAudio} className="text-slate-600 hover:text-amber-400 transition-colors p-2">
                                {isMuted ? '🔇' : '🔊'}
                            </button>
                        )}
                        <button onClick={() => setShowInfo(true)} className="text-[10px] font-bold text-slate-600 hover:text-slate-200 uppercase tracking-[0.2em] transition-colors border border-transparent hover:border-white/10 px-4 py-2 rounded-full">
                            Info
                        </button>
                    </div>
                </nav>

                <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[85vh]">
                    
                    {step === 0 && renderLanding()}

                    {step === 1 && (
                        <BreathingExercise onComplete={() => setStep(2)} />
                    )}
                    
                    {step === 2 && renderWizardStep(
                        "Lo Stato Presente",
                        "Chiudi gli occhi per un istante. Respira. Qual è l'energia che senti vibrare nella tua vita adesso? Descrivila senza giudizio.",
                        "In questo momento sento...",
                        situationText,
                        setSituationText,
                        SITUATION_TAGS,
                        situationTags,
                        (id) => toggleSituationTag(id),
                        handleNext,
                        false,
                        situationText.length > 2 || situationTags.length > 0
                    )}

                    {step === 3 && renderWizardStep(
                        "L'Orizzonte",
                        "Se tutto fosse possibile, dove vorresti che questa energia fluisse? Qual è la trasformazione che la tua anima sta chiedendo?",
                        "Il mio cuore cerca...",
                        goalText,
                        setGoalText,
                        GOAL_TAGS,
                        goalTags,
                        (id) => toggleGoalTag(id),
                        handleNext,
                        true,
                        goalTags.length > 0 || goalText.length > 2
                    )}

                    {step === 4 && renderResult()}

                </main>

                <footer className="text-center text-slate-800 text-[10px] uppercase tracking-widest py-10 opacity-40">
                    Oracle Genius &bull; Motore Semantico I Ching &bull; v2.2
                </footer>
            </div>
            <InfoDisplay show={showInfo} onClose={() => setShowInfo(false)} />
        </>
    );
};

export default App;
