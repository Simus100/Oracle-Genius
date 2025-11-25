
import React, { useState, useEffect, useRef } from 'react';
import type { Hexagram } from './types';
import HexagramVisual from './components/HexagramVisual';
import InfoDisplay from './components/InfoDisplay';
import BreathingExercise from './components/BreathingExercise';
import MeditationLab from './components/MeditationLab';
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

    // Mappatura Elementale per Stili Dinamici
    const getElementStyles = (element: string) => {
        switch (element) {
            case 'HEAVEN':
                return {
                    bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0a0a0c]', // Indigo profondo
                    glow: 'bg-indigo-400',
                    border: 'border-indigo-500/20',
                    accentText: 'text-indigo-200',
                    tabActive: 'text-indigo-400 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
                    icon: '☁️'
                };
            case 'EARTH':
                return {
                    bg: 'bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#0a0a0c]', // Pietra calda / Ambra scuro
                    glow: 'bg-amber-700',
                    border: 'border-amber-700/20',
                    accentText: 'text-amber-200',
                    tabActive: 'text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
                    icon: '🌍'
                };
            case 'FIRE':
                return {
                    bg: 'bg-gradient-to-br from-[#2a0a0a] via-[#450a0a] to-[#0a0a0c]', // Rosso profondo
                    glow: 'bg-red-500',
                    border: 'border-red-500/20',
                    accentText: 'text-red-200',
                    tabActive: 'text-red-400 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
                    icon: '🔥'
                };
            case 'WATER':
                return {
                    bg: 'bg-gradient-to-br from-[#020617] via-[#172554] to-[#0a0a0c]', // Blu abisso
                    glow: 'bg-cyan-500',
                    border: 'border-cyan-500/20',
                    accentText: 'text-cyan-200',
                    tabActive: 'text-cyan-400 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
                    icon: '💧'
                };
            case 'THUNDER':
                return {
                    bg: 'bg-gradient-to-br from-[#101510] via-[#0f3020] to-[#0a0a0c]', // Verde elettrico scuro / Viola scuro
                    glow: 'bg-emerald-400',
                    border: 'border-emerald-500/20',
                    accentText: 'text-emerald-200',
                    tabActive: 'text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
                    icon: '⚡'
                };
            case 'WIND':
                return {
                    bg: 'bg-gradient-to-br from-[#101715] via-[#1a2e26] to-[#0a0a0c]', // Verde vento / Teal
                    glow: 'bg-teal-400',
                    border: 'border-teal-500/20',
                    accentText: 'text-teal-200',
                    tabActive: 'text-teal-400 border-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]',
                    icon: '🍃'
                };
            case 'MOUNTAIN':
                return {
                    bg: 'bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#0a0a0c]', // Grigio solido
                    glow: 'bg-slate-400',
                    border: 'border-slate-500/20',
                    accentText: 'text-slate-300',
                    tabActive: 'text-slate-200 border-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]',
                    icon: '🏔️'
                };
            case 'LAKE':
                return {
                    bg: 'bg-gradient-to-br from-[#1a1016] via-[#381a28] to-[#0a0a0c]', // Viola/Rosa metallico
                    glow: 'bg-pink-400',
                    border: 'border-pink-500/20',
                    accentText: 'text-pink-200',
                    tabActive: 'text-pink-400 border-pink-500 shadow-[0_0_10px_rgba(244,114,182,0.5)]',
                    icon: '🌊'
                };
            default:
                return {
                    bg: 'bg-[#0a0a0c]/80',
                    glow: 'bg-amber-900',
                    border: 'border-white/5',
                    accentText: 'text-slate-200',
                    tabActive: 'text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
                    icon: '🔮'
                };
        }
    };

    const styles = getElementStyles(hex.element);
    
    // Stili dinamici container
    const containerClass = `${styles.bg} backdrop-blur-xl h-[85vh] p-0 rounded-2xl flex flex-col relative overflow-hidden transition-all duration-700 border ${styles.border} shadow-2xl group`;
    
    return (
        <div className={containerClass}>
            {/* Ambient Glow Dinamico */}
            <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 ${styles.glow}`}></div>
            <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-1000 ${styles.glow}`}></div>

            {/* Header Fixed */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6 relative z-10 border-b border-white/5 shrink-0 bg-black/20 backdrop-blur-md">
                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 ${styles.accentText} opacity-80`}>
                    {isStart ? "Situazione Attuale" : "Prospettiva Futura"}
                </span>
                
                <div className="transform scale-75 mb-2 filter drop-shadow-2xl">
                    <HexagramVisual lines={hex.lines} highlight={!isStart} />
                </div>
                
                <h3 className={`text-3xl md:text-4xl font-serif text-center mt-2 mb-1 font-medium text-white drop-shadow-sm`}>
                    {hex.italianName}
                </h3>
                
                <div className={`flex items-center gap-2 font-serif italic text-sm md:text-base ${styles.accentText} opacity-70`}>
                    <span>{styles.icon} Esagramma {hex.number}</span>
                    <span className="hidden md:inline">&bull;</span>
                    <span className="hidden md:inline">{hex.name}</span>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center py-4 relative z-10 border-b border-white/5 bg-black/10 shrink-0">
                <div className="flex space-x-4 md:space-x-6">
                    {[
                        { id: 'GENERAL', label: 'Generale' },
                        { id: 'LOVE', label: 'Amore' },
                        { id: 'WORK', label: 'Lavoro' },
                        { id: 'GROWTH', label: 'Spirito' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 relative px-2
                                ${activeTab === tab.id 
                                    ? 'text-white' 
                                    : 'text-slate-500 hover:text-slate-300'}
                            `}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className={`absolute bottom-0 left-0 w-full h-[2px] ${styles.tabActive.split(' ')[1]} ${styles.tabActive.split(' ')[2]}`}></span>
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
                                <div className={`bg-white/5 p-5 rounded-lg border ${styles.border} italic font-serif ${styles.accentText} text-center text-lg leading-relaxed shadow-inner`}>
                                    "{hex.traditionalImage}"
                                </div>
                            )}
                            
                            {hex.judgement && (
                                <div className={`border-l-2 pl-6 py-2 ${styles.border.replace('/20', '/50')}`}>
                                    <h4 className={`text-xs font-bold ${styles.accentText} uppercase tracking-widest mb-2 opacity-80`}>La Sentenza</h4>
                                    <blockquote className="text-slate-200 text-xl font-serif italic leading-relaxed">
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
                        <div className="bg-gradient-to-b from-pink-500/10 to-transparent p-6 rounded-xl border border-pink-500/10">
                            <h4 className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-4">La Via del Cuore</h4>
                            <p className="text-slate-200 font-serif text-lg md:text-xl leading-8 text-justify">{hex.loveAdvice}</p>
                        </div>
                    )}

                    {activeTab === 'WORK' && (
                        <div className="bg-gradient-to-b from-blue-500/10 to-transparent p-6 rounded-xl border border-blue-500/10">
                            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-4">La Via dell'Opera</h4>
                            <p className="text-slate-200 font-serif text-lg md:text-xl leading-8 text-justify">{hex.workAdvice}</p>
                        </div>
                    )}

                    {activeTab === 'GROWTH' && (
                        <div className="bg-gradient-to-b from-emerald-500/10 to-transparent p-6 rounded-xl border border-emerald-500/10">
                            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-4">La Via dello Spirito</h4>
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
    // Mode State: PORTAL (Landing) | ORACLE (App Classica) | MEDITATION (New Mode)
    const [appMode, setAppMode] = useState<'PORTAL' | 'ORACLE' | 'MEDITATION'>('PORTAL');

    // State del Wizard Oracolo
    const [step, setStep] = useState<number>(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1.0); // Default impostato a 1.0 (ex massimo)
    
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

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioManager.setVolume(val);
        if (val > 0 && isMuted) {
            setIsMuted(false);
            audioManager.toggleMute(false);
        }
    };

    // VISIBILITY CHANGE HANDLER (Per risparmiare batteria e non infastidire)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                audioManager.setSystemSuspended(true);
            } else {
                audioManager.setSystemSuspended(false);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const enterOracleMode = () => {
        setAppMode('ORACLE');
        // Initialize audio engine
        audioManager.init();
        audioManager.setMode('ORACLE'); // Set to quieter, sparse mode
        audioManager.startDrone();
        audioManager.updateTexture('NEUTRAL'); // Assicura texture standard per Oracolo
        setStep(1); // Go to breathing
    };

    const enterMeditationMode = () => {
        setAppMode('MEDITATION');
        audioManager.setMode('MEDITATION'); // Set to full immersive mode
        // Audio will be handled by MeditationLab component
    };

    const returnToPortal = () => {
        setAppMode('PORTAL');
        setStep(0);
        reset(); // Reset Oracle state
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
                // Aggiorniamo la texture sonora in base all'esagramma di partenza
                audioManager.updateTexture(result.startHexagram.element);
                window.scrollTo(0,0);
            }
            setIsAnalyzing(false);
        }, 3000); 
    };

    const reset = () => {
        setStep(0); 
        setSituationText('');
        setSituationTags([]);
        setGoalText('');
        setGoalTags([]);
        setAnalysisResult(null);
        audioManager.stop(); // Fermiamo l'audio quando si resetta
        audioManager.updateTexture('NEUTRAL'); // Reset texture
        window.scrollTo(0,0);
    };

    // --- NUOVO PORTALE (MODE SELECTION) ---
    const renderPortal = () => (
        <div className="flex flex-col items-center justify-center min-h-[85vh] animate-fade-in text-center px-4">
             <div className="mb-10 relative">
                <div className="absolute inset-0 bg-amber-500 blur-[100px] opacity-10 rounded-full animate-pulse"></div>
                <h1 className="text-6xl md:text-8xl font-serif text-gold-gradient mb-4 tracking-tight relative z-10">Oracle Genius</h1>
                <p className="text-slate-500 uppercase tracking-[0.4em] text-xs font-bold">Suite Spirituale</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mt-12">
                
                {/* CARD ORACOLO */}
                <button 
                    onClick={enterOracleMode}
                    className="group relative bg-[#0a0a0c] border border-white/5 hover:border-amber-500/30 rounded-2xl p-10 transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)] text-left flex flex-col items-center md:items-start"
                >
                    <div className="w-16 h-16 rounded-full bg-amber-900/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-3xl">🔮</span>
                    </div>
                    <h2 className="text-3xl font-serif text-slate-200 mb-3 group-hover:text-amber-200 transition-colors">L'Oracolo</h2>
                    <p className="text-slate-500 font-light leading-relaxed mb-6">
                        Consulta l'antica saggezza dell'I Ching per illuminare il tuo cammino. Analisi semantica e psicologica della tua situazione.
                    </p>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest group-hover:underline decoration-amber-600/50 underline-offset-4">Inizia Consulto &rarr;</span>
                </button>

                {/* CARD MEDITAZIONE */}
                <button 
                    onClick={enterMeditationMode}
                    className="group relative bg-[#0a0a0c] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-10 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)] text-left flex flex-col items-center md:items-start"
                >
                    <div className="w-16 h-16 rounded-full bg-indigo-900/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="text-3xl">🧘</span>
                    </div>
                    <h2 className="text-3xl font-serif text-slate-200 mb-3 group-hover:text-indigo-200 transition-colors">Sala di Meditazione</h2>
                    <p className="text-slate-500 font-light leading-relaxed mb-6">
                        Immergiti in un paesaggio sonoro procedurale. Personalizza gli elementi e il timer per la tua pratica quotidiana.
                    </p>
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest group-hover:underline decoration-indigo-500/50 underline-offset-4">Entra nel Laboratorio &rarr;</span>
                </button>

            </div>
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

                {/* PSYCHOMAGIC TASK SECTION */}
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
                        onClick={returnToPortal}
                        className="text-slate-600 hover:text-amber-400 text-xs font-bold uppercase tracking-[0.3em] transition-colors py-4 px-8 border-b border-transparent hover:border-amber-900/50"
                    >
                        Torna al Portale
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#15151a] via-[#050505] to-[#000000] text-slate-200 font-sans selection:bg-amber-900 selection:text-white overflow-x-hidden">
                
                {/* Navbar Minimal Responsive */}
                <nav className="w-full py-4 md:py-8 px-4 md:px-6 flex justify-between items-center max-w-[1400px] mx-auto z-50 relative">
                    <div className="flex items-center gap-2 md:gap-4 cursor-pointer group" onClick={returnToPortal}>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-amber-500/20 flex items-center justify-center group-hover:border-amber-500/50 transition-colors bg-black/50 backdrop-blur-md">
                            <div className="w-2 h-2 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] group-hover:scale-125 transition-transform"></div>
                        </div>
                        <span className="font-serif text-lg md:text-2xl text-slate-300 tracking-wide">Oracle <span className="text-amber-600">Genius</span></span>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-6">
                        {/* Audio Controls visible in active modes */}
                        {(appMode !== 'PORTAL') && (
                            <div className="flex items-center gap-2 md:gap-3 bg-white/5 px-2 md:px-3 py-1 rounded-full border border-white/5 hover:border-white/10 transition-colors animate-fade-in">
                                <button onClick={toggleAudio} className="text-slate-400 hover:text-amber-400 transition-colors p-1 text-sm md:text-base">
                                    {isMuted ? '🔇' : '🔊'}
                                </button>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="2" 
                                    step="0.01" 
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-16 md:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                                />
                            </div>
                        )}
                        <button 
                            onClick={() => setShowInfo(true)} 
                            className="bg-amber-600/90 hover:bg-amber-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] px-3 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-2 transform hover:-translate-y-0.5 whitespace-nowrap"
                        >
                            <span className="text-sm md:text-base">ℹ</span> 
                            <span className="hidden min-[380px]:inline">Guida</span>
                        </button>
                    </div>
                </nav>

                <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[85vh]">
                    
                    {appMode === 'PORTAL' && renderPortal()}

                    {/* ORACLE MODE RENDER */}
                    {appMode === 'ORACLE' && (
                        <>
                            {step === 1 && <BreathingExercise onComplete={() => setStep(2)} />}
                            
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
                        </>
                    )}

                    {/* MEDITATION MODE RENDER */}
                    {appMode === 'MEDITATION' && (
                        <MeditationLab onExit={returnToPortal} />
                    )}

                </main>

                <footer className="text-center text-slate-800 text-[10px] uppercase tracking-widest py-10 opacity-40">
                    Oracle Genius &bull; Motore Semantico I Ching &bull; v3.0
                </footer>
            </div>
            <InfoDisplay show={showInfo} onClose={() => setShowInfo(false)} />
        </>
    );
};

export default App;
