
import React, { useState } from 'react';

interface InfoDisplayProps {
  show: boolean;
  onClose: () => void;
}

const InfoDisplay: React.FC<InfoDisplayProps> = ({ show, onClose }) => {
  const [activeTab, setActiveTab] = useState<'PROGETTO' | 'ORACOLO' | 'MEDITAZIONE' | 'AUDIO'>('PROGETTO');

  if (!show) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-white/5 bg-black/20 shrink-0">
            <h2 className="text-xl md:text-2xl font-serif text-amber-500 flex items-center gap-3">
                <span className="text-2xl md:text-3xl">✦</span> Oracle Genius
            </h2>
            <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                &times;
            </button>
        </div>

        {/* Tab Navigation Responsive */}
        <div className="flex border-b border-white/5 bg-black/10 overflow-x-auto shrink-0 w-full no-scrollbar">
            {[
                { id: 'PROGETTO', labelShort: 'Progetto', labelLong: 'Il Progetto' },
                { id: 'ORACOLO', labelShort: 'Oracolo', labelLong: 'Saggezza I Ching' },
                { id: 'MEDITAZIONE', labelShort: 'Sala', labelLong: 'Sala Immersiva' },
                { id: 'AUDIO', labelShort: 'Audio', labelLong: 'Ingegneria Sonora' },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 md:px-6 md:py-4 text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative flex-shrink-0
                        ${activeTab === tab.id 
                            ? 'text-amber-400 bg-white/5' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                    `}
                >
                    <span className="md:hidden">{tab.labelShort}</span>
                    <span className="hidden md:inline">{tab.labelLong}</span>
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-amber-500"></div>
                    )}
                </button>
            ))}
        </div>
        
        {/* Content Area */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow bg-[#0e0e11]">
            
            {/* TAB PROGETTO */}
            {activeTab === 'PROGETTO' && (
                <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif text-slate-100 mb-4">Tecnologia e Spiritualità</h3>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                            Oracle Genius non è una semplice app, ma un esperimento di design che unisce l'antica saggezza orientale con le moderne tecnologie web. L'obiettivo è creare uno spazio digitale sacro, privo di distrazioni, dove l'utente può riconnettersi con se stesso attraverso archetipi universali e suoni procedurali.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-3">Privacy Assoluta</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Tutta l'intelligenza dell'applicazione risiede nel tuo dispositivo. Il motore semantico e il generatore audio funzionano <strong>in locale</strong> nel tuo browser. Nessun dato personale, nessuna domanda e nessuna riflessione viene mai inviata a server esterni. I tuoi pensieri rimangono tuoi.
                            </p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-3">Determinismo</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                A differenza delle comuni intelligenze artificiali che inventano risposte, questo sistema è <strong>deterministico</strong>. Usa un algoritmo complesso per mappare le tue parole e le tue emozioni agli esagrammi dell'I Ching, garantendo che a parità di stato interiore corrisponda sempre lo stesso archetipo.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB ORACOLO */}
            {activeTab === 'ORACOLO' && (
                <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif text-slate-100 mb-4">Il Libro dei Mutamenti</h3>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg mb-6">
                            L'I Ching (o Yi Jing) è uno dei testi più antichi dell'umanità, risalente a oltre 3000 anni fa. Nato come manuale di divinazione alla corte dei re Zhou, è evoluto in un profondo sistema filosofico ammirato da pensatori come Confucio e Carl Jung.
                        </p>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                            Alla base c'è il concetto che l'universo è un flusso costante di energia tra due polarità: <strong>Yin</strong> (ricettivo, terra, buio) e <strong>Yang</strong> (creativo, cielo, luce).
                        </p>
                    </div>

                    <div className="border-l-2 border-amber-900/50 pl-6 py-2">
                        <h4 className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2">I 64 Esagrammi</h4>
                        <p className="text-slate-300 italic font-serif text-lg md:text-xl">
                            "Ogni situazione umana possibile è rappresentata da uno dei 64 esagrammi, composti da sei linee che possono essere spezzate (Yin) o intere (Yang)."
                        </p>
                    </div>

                    <div>
                        <h4 className="text-slate-200 font-bold mb-3">Come Funziona la Lettura?</h4>
                        <ul className="space-y-4 text-slate-400 text-sm md:text-base">
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">1.</span>
                                <span><strong>Analisi Semantica:</strong> Il sistema analizza il testo che scrivi e i tag emotivi che selezioni per identificare l'archetipo dominante della tua situazione attuale (Esagramma di Partenza).</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">2.</span>
                                <span><strong>La Proiezione:</strong> Analizzando i tuoi desideri futuri, il sistema calcola l'Esagramma di Arrivo (il potenziale).</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-amber-500 font-bold">3.</span>
                                <span><strong>Le Linee Mobili:</strong> La vera magia risiede nella differenza tra i due esagrammi. Le linee che "mutano" sono i punti di attrito o di opportunità su cui devi agire per trasformare la realtà.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* TAB MEDITAZIONE */}
            {activeTab === 'MEDITAZIONE' && (
                <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
                    <div className="relative h-32 md:h-48 w-full bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-2xl border border-white/5 overflow-hidden mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                        <span className="text-4xl">🧘</span>
                    </div>

                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif text-slate-100 mb-4">Il Laboratorio Immersivo</h3>
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                            La Sala di Meditazione è uno spazio progettato per isolarti dal caos digitale. Non c'è nulla da leggere o da fare, solo da "essere". L'esperienza è costruita su due pilastri:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-amber-900/20 flex items-center justify-center text-2xl shrink-0 border border-amber-500/20">👁️</div>
                            <div>
                                <h4 className="text-slate-200 font-bold mb-1">Geometria Sacra Procedurale</h4>
                                <p className="text-slate-400 text-sm">
                                    Le forme che vedi pulsare sullo schermo non sono video registrati. Sono equazioni matematiche (Spirografi, Curve di Lissajous, Campi Vettoriali) generate in tempo reale dal codice. Reagiscono al respiro della musica e non si ripetono mai uguali, simboleggiando l'ordine perfetto della natura.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-indigo-900/20 flex items-center justify-center text-2xl shrink-0 border border-indigo-500/20">🎛️</div>
                            <div>
                                <h4 className="text-slate-200 font-bold mb-1">Controllo Totale</h4>
                                <p className="text-slate-400 text-sm">
                                    Puoi personalizzare l'atmosfera scegliendo tra 5 Elementi (Terra, Acqua, Fuoco, Vento, Etere) e regolando l'intensità sonora ("Zen" vs "Attiva"). Il timer ti aiuta a mantenere la disciplina della pratica.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB AUDIO (TECHNICAL DEEP DIVE) */}
            {activeTab === 'AUDIO' && (
                <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
                     <div>
                        <h3 className="text-2xl md:text-3xl font-serif text-slate-100 mb-2">Ingegneria Sonora: Deep Dive</h3>
                        <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-6">A=432Hz Tuning &bull; Theta Induction &bull; Isochronic Tones</p>
                        
                        <p className="text-slate-400 leading-relaxed text-base md:text-lg mb-8">
                            Il paesaggio sonoro che ascolti è generato in tempo reale dal tuo processore (DSP). Abbiamo recentemente implementato un protocollo di livello clinico per massimizzare l'efficacia meditativa.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0a0a0c] border border-amber-900/30 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🎼</div>
                            <h4 className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-2">1. Accordatura Aurea (432Hz)</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Tutte le frequenze del sistema (dai droni alle melodie) sono state ricalcolate basandosi su <strong>LA = 432Hz</strong> (Verdi Tuning) invece dello standard moderno 440Hz. Questa intonazione è considerata matematicamente più coerente con i cicli biologici naturali, risultando in un suono più "morbido", caldo e meno affaticante per il sistema nervoso.
                            </p>
                        </div>

                        <div className="bg-[#0a0a0c] border border-indigo-900/30 p-6 rounded-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🧠</div>
                            <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-2">2. Rampa di Induzione (Alpha &rarr; Theta)</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Il cervello non può passare istantaneamente dallo stress alla trance. Per questo, la sessione utilizza una "Rampa di Induzione": i battimenti binaurali iniziano a <strong>12Hz</strong> (Onde Alpha - Veglia Rilassata) e scendono progressivamente fino a <strong>4Hz</strong> (Onde Theta - Meditazione Profonda) nel corso dei primi 60 secondi, accompagnando la tua mente dolcemente verso lo stato alterato.
                            </p>
                        </div>

                        <div className="bg-[#0a0a0c] border border-emerald-900/30 p-6 rounded-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🔊</div>
                            <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">3. Ibrido Binaurale / Isocronico</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                I classici toni binaurali funzionano solo con le cuffie. Per garantire l'efficacia anche tramite speaker, abbiamo sovrapposto un layer di <strong>Toni Isocronici</strong>: una modulazione ritmica del volume delle texture naturali (come il fruscio del vento) sincronizzata a 4Hz. Questo permette al corpo di "sentire" la pulsazione meditativa anche senza auricolari.
                            </p>
                        </div>

                         <div className="bg-[#0a0a0c] border border-slate-800 p-6 rounded-xl">
                            <h4 className="text-pink-400 font-bold uppercase tracking-widest text-xs mb-2">4. Sintesi Fisica & Walker</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                I suoni della natura (Fuoco, Acqua) sono sintetizzati fisicamente tramite filtraggio del rumore stocastico. Le melodie sono composte da un'IA procedurale ("Musical Walker") che sceglie le note in base a scale modali specifiche per ogni elemento, evitando ripetizioni e favorendo l'armonia.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-black/20 flex justify-end shrink-0">
            <button 
                onClick={onClose} 
                className="bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-amber-500 transition-all duration-300 text-xs uppercase tracking-widest hover:scale-105"
            >
                Chiudi Guida
            </button>
        </div>
      </div>
    </div>
  );
};

export default InfoDisplay;
