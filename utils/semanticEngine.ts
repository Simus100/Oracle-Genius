
import { Hexagram } from '../types';
import { HEXAGRAMS } from '../constants/hexagrams';

// --- TIPI E INTERFACCE AVANZATE ---

interface SentimentScore {
    energy: 'HIGH' | 'LOW' | 'NEUTRAL'; // Yang vs Yin
    tone: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

interface RootDef {
    concept: string;
    weight: number; // 1 = standard, 2 = forte, 3 = critico
}

interface DetectedConcept {
    name: string;
    weight: number;
    sourceWord: string;
}

export interface SemanticAnalysisResult {
    startHexagram: Hexagram;
    goalHexagram: Hexagram;
    movingLines: number[];
    detectedContext: 'GENERAL' | 'LOVE' | 'WORK' | 'GROWTH';
}

// --- COSTANTI LINGUISTICHE ---

const NEGATIONS = ['non', 'mai', 'nessun', 'senza', 'neanche', 'manco', 'no', 'smesso', 'stop', 'evitare'];

// Frasi Idiomatiche (Bi-grams/Tri-grams)
const IDIOMS: Record<string, RootDef> = {
    'voltare pagina': { concept: 'CHANGE', weight: 3 },
    'cambiare vita': { concept: 'CHANGE', weight: 3 },
    'toccare il fondo': { concept: 'CRISIS', weight: 3 },
    'non ce la faccio': { concept: 'TIRED', weight: 3 },
    'non ne posso piu': { concept: 'TIRED', weight: 3 },
    'mollare tutto': { concept: 'CHANGE', weight: 3 },
    'farla finita': { concept: 'DANGER', weight: 5 }, // High alert
    'sentirsi soli': { concept: 'ISOLATION', weight: 2 },
    'stare meglio': { concept: 'HEALING', weight: 2 },
    'andare via': { concept: 'CHANGE', weight: 2 },
    'scappare via': { concept: 'CHANGE', weight: 2 },
    'pieno di energie': { concept: 'POWER', weight: 2 },
    'senso di colpa': { concept: 'GUILT', weight: 3 },
    'passi avanti': { concept: 'GROWTH', weight: 2 },
    'sentirsi in trappola': { concept: 'STUCK', weight: 3 },
    'cuore spezzato': { concept: 'SADNESS', weight: 3 },
    'perdere tempo': { concept: 'WAITING', weight: 2 }
};

// --- DIZIONARIO DELLE RADICI (ROOT_MAP V2.0) ---
// Radici più lunghe per evitare falsi positivi (es: 'part' -> 'partir', 'partenz')

const ROOT_MAP: Record<string, RootDef> = {
    // --- EMOZIONI NEGATIVE (YIN) ---
    // Tristezza
    'trist': { concept: 'SADNESS', weight: 1 },
    'malincon': { concept: 'SADNESS', weight: 2 },
    'depres': { concept: 'SADNESS', weight: 3 },
    'piang': { concept: 'SADNESS', weight: 2 },
    'lacrim': { concept: 'SADNESS', weight: 2 },
    'buio': { concept: 'SADNESS', weight: 2 },
    'dolor': { concept: 'SADNESS', weight: 2 },
    'soffr': { concept: 'SADNESS', weight: 2 },
    'disper': { concept: 'SADNESS', weight: 3 },
    'lutt': { concept: 'SADNESS', weight: 3 },
    'infelic': { concept: 'SADNESS', weight: 2 },
    
    // Paura
    'paur': { concept: 'FEAR', weight: 2 },
    'ansi': { concept: 'FEAR', weight: 2 },
    'panico': { concept: 'FEAR', weight: 3 },
    'terror': { concept: 'FEAR', weight: 3 },
    'spaven': { concept: 'FEAR', weight: 2 },
    'temere': { concept: 'FEAR', weight: 1 },
    'incubo': { concept: 'FEAR', weight: 2 },
    'minacc': { concept: 'FEAR', weight: 2 },
    'paraliz': { concept: 'FEAR', weight: 3 },
    'insicur': { concept: 'FEAR', weight: 2 },

    // Blocco/Apatia
    'blocc': { concept: 'STUCK', weight: 2 },
    'ferm': { concept: 'STUCK', weight: 2 },
    'immobi': { concept: 'STUCK', weight: 2 },
    'incastr': { concept: 'STUCK', weight: 2 },
    'intrappol': { concept: 'STUCK', weight: 3 },
    'caten': { concept: 'STUCK', weight: 3 },
    'prigion': { concept: 'STUCK', weight: 3 },
    'limite': { concept: 'STUCK', weight: 1 },
    'apat': { concept: 'APATHY', weight: 2 },
    'noia': { concept: 'APATHY', weight: 1 },
    'svogli': { concept: 'APATHY', weight: 1 },
    'indiff': { concept: 'APATHY', weight: 2 },
    'stanc': { concept: 'TIRED', weight: 1 },
    'esaur': { concept: 'TIRED', weight: 3 },
    'fatic': { concept: 'TIRED', weight: 1 },
    'vuoto': { concept: 'EMPTY', weight: 3 },
    'solitud': { concept: 'ISOLATION', weight: 2 },
    'isolat': { concept: 'ISOLATION', weight: 2 },
    'esclus': { concept: 'ISOLATION', weight: 2 },
    
    // Confusione
    'confus': { concept: 'CONFUSION', weight: 2 },
    'dubb': { concept: 'CONFUSION', weight: 1 },
    'incert': { concept: 'CONFUSION', weight: 2 },
    'nebbia': { concept: 'CONFUSION', weight: 2 },
    'caos': { concept: 'CONFUSION', weight: 2 },
    'perso': { concept: 'CONFUSION', weight: 2 },
    'smarri': { concept: 'CONFUSION', weight: 2 },
    'disorient': { concept: 'CONFUSION', weight: 2 },

    // Colpa/Vergogna
    'colp': { concept: 'GUILT', weight: 2 },
    'vergogn': { concept: 'GUILT', weight: 2 },
    'rimors': { concept: 'GUILT', weight: 2 },
    'sbagli': { concept: 'GUILT', weight: 1 },
    'error': { concept: 'GUILT', weight: 1 },
    'peccat': { concept: 'GUILT', weight: 2 },
    'indegn': { concept: 'GUILT', weight: 3 },
    'fallit': { concept: 'GUILT', weight: 3 },

    // --- EMOZIONI ATTIVE (YANG) ---
    // Rabbia
    'rabbi': { concept: 'ANGER', weight: 2 },
    'arrab': { concept: 'ANGER', weight: 2 },
    'furios': { concept: 'ANGER', weight: 3 },
    'ira': { concept: 'ANGER', weight: 2 }, 
    'odio': { concept: 'ANGER', weight: 3 },
    'nervos': { concept: 'ANGER', weight: 1 },
    'esplod': { concept: 'ANGER', weight: 2 },
    'url': { concept: 'ANGER', weight: 2 },
    'grid': { concept: 'ANGER', weight: 2 },
    'spacc': { concept: 'ANGER', weight: 2 },
    'vendet': { concept: 'ANGER', weight: 3 },
    'aggress': { concept: 'ANGER', weight: 2 },

    // Conflitto
    'litig': { concept: 'CONFLICT', weight: 2 },
    'scontr': { concept: 'CONFLICT', weight: 2 },
    'discut': { concept: 'CONFLICT', weight: 1 },
    'nemic': { concept: 'CONFLICT', weight: 2 },
    'battagl': { concept: 'CONFLICT', weight: 2 },
    'guerr': { concept: 'CONFLICT', weight: 3 },
    'rival': { concept: 'CONFLICT', weight: 2 },
    'oppost': { concept: 'CONFLICT', weight: 1 },
    'contro': { concept: 'CONFLICT', weight: 1 },
    'difend': { concept: 'CONFLICT', weight: 1 },

    // Tradimento/Gelosia
    'gelos': { concept: 'JEALOUSY', weight: 2 },
    'invid': { concept: 'JEALOUSY', weight: 2 },
    'possess': { concept: 'JEALOUSY', weight: 2 },
    'trad': { concept: 'BETRAYAL', weight: 3 },
    'ingann': { concept: 'BETRAYAL', weight: 2 },
    'bugi': { concept: 'BETRAYAL', weight: 2 },
    'fals': { concept: 'BETRAYAL', weight: 2 },
    'infedel': { concept: 'BETRAYAL', weight: 3 },
    'delus': { concept: 'BETRAYAL', weight: 2 },

    // Urgenza/Crisi
    'urgen': { concept: 'URGENCY', weight: 2 },
    'frett': { concept: 'URGENCY', weight: 1 },
    'subito': { concept: 'URGENCY', weight: 1 },
    'impazien': { concept: 'URGENCY', weight: 2 },
    'scadenz': { concept: 'URGENCY', weight: 2 },
    'crisi': { concept: 'CRISIS', weight: 3 },
    'croll': { concept: 'CRISIS', weight: 3 },
    'pericol': { concept: 'DANGER', weight: 3 },
    'disastr': { concept: 'DANGER', weight: 3 },
    'precipiz': { concept: 'DANGER', weight: 3 },
    'rischi': { concept: 'DANGER', weight: 2 },
    'aiut': { concept: 'DANGER', weight: 2 },

    // --- POSITIVI / OBIETTIVI ---
    // Gioia/Speranza
    'felic': { concept: 'JOY', weight: 2 },
    'gioi': { concept: 'JOY', weight: 2 },
    'seren': { concept: 'JOY', weight: 1 },
    'entusi': { concept: 'JOY', weight: 2 },
    'speran': { concept: 'HOPE', weight: 2 },
    'fede': { concept: 'HOPE', weight: 2 },
    'fiduc': { concept: 'HOPE', weight: 2 },
    'sogn': { concept: 'HOPE', weight: 2 },
    'desider': { concept: 'HOPE', weight: 1 },
    'ottim': { concept: 'HOPE', weight: 1 },
    'pregh': { concept: 'HOPE', weight: 2 },

    // Potere/Coraggio
    'poter': { concept: 'POWER', weight: 2 },
    'forz': { concept: 'POWER', weight: 2 },
    'energ': { concept: 'POWER', weight: 1 },
    'success': { concept: 'POWER', weight: 2 },
    'vittor': { concept: 'POWER', weight: 2 },
    'leader': { concept: 'POWER', weight: 2 },
    'comand': { concept: 'POWER', weight: 2 },
    'indipend': { concept: 'POWER', weight: 2 },
    'autonom': { concept: 'POWER', weight: 2 },
    'coragg': { concept: 'COURAGE', weight: 2 },
    'osare': { concept: 'COURAGE', weight: 2 },
    'intrapr': { concept: 'COURAGE', weight: 2 },
    'determin': { concept: 'COURAGE', weight: 2 },

    // Pace/Equilibrio
    'pace': { concept: 'PEACE', weight: 2 },
    'calm': { concept: 'PEACE', weight: 1 },
    'tranquill': { concept: 'PEACE', weight: 1 },
    'armoni': { concept: 'PEACE', weight: 2 },
    'silenz': { concept: 'PEACE', weight: 2 },
    'equilibr': { concept: 'BALANCE', weight: 2 },
    'stabil': { concept: 'BALANCE', weight: 2 },
    'centr': { concept: 'BALANCE', weight: 2 },
    'ordin': { concept: 'BALANCE', weight: 1 },

    // Verità/Chiarezza
    'verit': { concept: 'TRUTH', weight: 2 },
    'sincer': { concept: 'TRUTH', weight: 2 },
    'onest': { concept: 'TRUTH', weight: 2 },
    'chiar': { concept: 'CLARITY', weight: 2 },
    'capir': { concept: 'CLARITY', weight: 1 },
    'comprend': { concept: 'CLARITY', weight: 1 },
    'veder': { concept: 'CLARITY', weight: 1 },
    'consapev': { concept: 'CLARITY', weight: 2 },
    'lucid': { concept: 'CLARITY', weight: 2 },
    'svel': { concept: 'TRUTH', weight: 2 },

    // Guarigione
    'guari': { concept: 'HEALING', weight: 2 },
    'curar': { concept: 'HEALING', weight: 1 },
    'salut': { concept: 'HEALING', weight: 2 },
    'benesser': { concept: 'HEALING', weight: 1 },
    'rinasc': { concept: 'HEALING', weight: 3 },
    'rigener': { concept: 'HEALING', weight: 2 },
    'perdon': { concept: 'FORGIVENESS', weight: 3 },
    'scus': { concept: 'FORGIVENESS', weight: 1 },
    'accett': { concept: 'FORGIVENESS', weight: 2 },
    'lasciar': { concept: 'FORGIVENESS', weight: 2 }, // lasciar andare

    // --- SETTORIALI ---
    // Amore
    'amor': { concept: 'LOVE', weight: 2 },
    'amare': { concept: 'LOVE', weight: 2 },
    'amant': { concept: 'LOVE', weight: 2 },
    'cuor': { concept: 'LOVE', weight: 2 },
    'partner': { concept: 'LOVE', weight: 2 },
    'fidanz': { concept: 'LOVE', weight: 2 },
    'marit': { concept: 'LOVE', weight: 2 },
    'mogli': { concept: 'LOVE', weight: 2 },
    'baci': { concept: 'LOVE', weight: 1 },
    'sess': { concept: 'LOVE', weight: 1 },
    'intim': { concept: 'LOVE', weight: 2 },
    'passion': { concept: 'LOVE', weight: 2 },
    'ex': { concept: 'LOVE', weight: 2 },
    'relazion': { concept: 'LOVE', weight: 2 },
    'innamor': { concept: 'LOVE', weight: 2 },
    'sentiment': { concept: 'LOVE', weight: 1 },
    'coppi': { concept: 'LOVE', weight: 1 },
    
    // Famiglia
    'famigl': { concept: 'FAMILY', weight: 2 },
    'madr': { concept: 'FAMILY', weight: 2 }, // madre/i
    'padr': { concept: 'FAMILY', weight: 2 }, // padre/i
    'figl': { concept: 'FAMILY', weight: 2 }, // figlio/a/i
    'genitor': { concept: 'FAMILY', weight: 2 },
    'casa': { concept: 'FAMILY', weight: 2 },
    'domest': { concept: 'FAMILY', weight: 1 },
    'parent': { concept: 'FAMILY', weight: 1 },
    'fratell': { concept: 'FAMILY', weight: 2 },
    'sorell': { concept: 'FAMILY', weight: 2 },

    // Lavoro/Finanza
    'lavor': { concept: 'WORK', weight: 2 },
    'uffic': { concept: 'WORK', weight: 1 },
    'impieg': { concept: 'WORK', weight: 1 },
    'carrier': { concept: 'WORK', weight: 2 },
    'profession': { concept: 'WORK', weight: 2 },
    'business': { concept: 'WORK', weight: 2 },
    'aziend': { concept: 'WORK', weight: 2 },
    'colleg': { concept: 'WORK', weight: 1 },
    'proget': { concept: 'WORK', weight: 1 },
    'capo': { concept: 'WORK', weight: 2 },
    'manager': { concept: 'WORK', weight: 2 },
    'sold': { concept: 'MONEY', weight: 2 },
    'denar': { concept: 'MONEY', weight: 2 },
    'finanz': { concept: 'MONEY', weight: 2 },
    'econom': { concept: 'MONEY', weight: 2 },
    'pagar': { concept: 'MONEY', weight: 1 },
    'stipend': { concept: 'MONEY', weight: 2 },
    'debit': { concept: 'MONEY', weight: 3 },
    'spes': { concept: 'MONEY', weight: 1 },
    'guadagn': { concept: 'MONEY', weight: 2 },
    'ricch': { concept: 'ABUNDANCE', weight: 2 },
    'abbond': { concept: 'ABUNDANCE', weight: 2 },
    'prosper': { concept: 'ABUNDANCE', weight: 2 },
    'banca': { concept: 'MONEY', weight: 1 },

    // Legale
    'legal': { concept: 'CONFLICT', weight: 2 },
    'avvocat': { concept: 'CONFLICT', weight: 2 },
    'giudic': { concept: 'CONFLICT', weight: 2 },
    'tribunal': { concept: 'CONFLICT', weight: 3 },
    'legge': { concept: 'CONFLICT', weight: 2 },
    'divorz': { concept: 'CONFLICT', weight: 3 },
    'separaz': { concept: 'CONFLICT', weight: 2 },
    'causa': { concept: 'CONFLICT', weight: 2 },
    'contratt': { concept: 'WORK', weight: 2 },
    'firm': { concept: 'WORK', weight: 1 },

    // Creatività
    'creativ': { concept: 'CREATION', weight: 2 },
    'art': { concept: 'CREATION', weight: 2 },
    'ispir': { concept: 'CREATION', weight: 2 },
    'scriv': { concept: 'CREATION', weight: 1 },
    'dipin': { concept: 'CREATION', weight: 1 },
    'ide': { concept: 'CREATION', weight: 1 }, // idea
    'invent': { concept: 'CREATION', weight: 2 },
    'talen': { concept: 'CREATION', weight: 2 },
    'esprim': { concept: 'CREATION', weight: 1 },

    // Comunicazione (Nuovo)
    'comunic': { concept: 'CLARITY', weight: 2 },
    'parl': { concept: 'CLARITY', weight: 1 },
    'dire': { concept: 'CLARITY', weight: 1 },
    'ascolt': { concept: 'RECEPTION', weight: 2 },
    'messagg': { concept: 'CLARITY', weight: 1 },
    'rispost': { concept: 'CLARITY', weight: 1 },
    'telefon': { concept: 'CLARITY', weight: 1 },
    'scriver': { concept: 'CLARITY', weight: 1 },
    'spieg': { concept: 'CLARITY', weight: 1 },

    // Movimento / Tempo (Nuovo)
    'viagg': { concept: 'CHANGE', weight: 2 },
    'partir': { concept: 'CHANGE', weight: 2 },
    'andare': { concept: 'CHANGE', weight: 1 },
    'muover': { concept: 'CHANGE', weight: 1 },
    'torn': { concept: 'RECEPTION', weight: 1 }, // tornare
    'trasloc': { concept: 'CHANGE', weight: 3 },
    'trasfer': { concept: 'CHANGE', weight: 2 },
    'doman': { concept: 'HOPE', weight: 1 },
    'futur': { concept: 'HOPE', weight: 1 },
    'passat': { concept: 'SADNESS', weight: 1 },
    'temp': { concept: 'WAITING', weight: 1 },
    'aspett': { concept: 'WAITING', weight: 2 },
    'pazien': { concept: 'WAITING', weight: 2 },

    // Crescita/Sapere
    'impar': { concept: 'KNOWLEDGE', weight: 2 },
    'studi': { concept: 'KNOWLEDGE', weight: 2 },
    'scuol': { concept: 'KNOWLEDGE', weight: 1 },
    'univers': { concept: 'KNOWLEDGE', weight: 2 },
    'libr': { concept: 'KNOWLEDGE', weight: 1 },
    'legg': { concept: 'KNOWLEDGE', weight: 1 },
    'sagg': { concept: 'KNOWLEDGE', weight: 2 }, // saggio/saggezza
    'filosof': { concept: 'KNOWLEDGE', weight: 1 },
    'cresc': { concept: 'GROWTH', weight: 2 },
    'evoluz': { concept: 'GROWTH', weight: 2 },
    'miglior': { concept: 'GROWTH', weight: 2 },
    'cambia': { concept: 'CHANGE', weight: 2 }, // cambiament/o/i
    'nuov': { concept: 'CHANGE', weight: 2 },
    'trasform': { concept: 'CHANGE', weight: 3 },
    
    // Autostima (Nuovo)
    'merit': { concept: 'POWER', weight: 2 },
    'valor': { concept: 'POWER', weight: 2 },
    'dignit': { concept: 'POWER', weight: 2 },
    'rispett': { concept: 'POWER', weight: 2 },
    'autostim': { concept: 'POWER', weight: 2 }
};

// --- FUNZIONI DI UTILITÀ ---

// 1. Pulizia, Analisi Idiomi e Negazioni
const analyzeText = (text: string, tags: string[]): { concepts: DetectedConcept[], rawWords: string[] } => {
    let processText = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ");
    
    const detectedConcepts: DetectedConcept[] = [];
    
    // A. Rilevamento Idiomi (Bi-grams/Tri-grams)
    Object.keys(IDIOMS).forEach(idiom => {
        if (processText.includes(idiom)) {
            detectedConcepts.push({
                name: IDIOMS[idiom].concept,
                weight: IDIOMS[idiom].weight,
                sourceWord: idiom
            });
            // Rimuoviamo l'idioma per non processare le singole parole di nuovo
            processText = processText.replace(idiom, " ");
        }
    });

    // B. Analisi Parole Singole con Negazione
    const rawWords = processText.split(/\s+/).filter(w => w.length > 2);
    
    // Aggiungiamo i tag utente come concetti prioritari
    tags.forEach(tag => {
        const match = Object.keys(ROOT_MAP).find(root => tag.toLowerCase().startsWith(root));
        if (match) {
            detectedConcepts.push({
                name: ROOT_MAP[match].concept,
                weight: ROOT_MAP[match].weight + 1, // Bonus per i tag espliciti
                sourceWord: tag
            });
        } else {
            // Fallback: se il tag non è mappato, usa il tag stesso (utile per matching diretti su keywords esagramma)
            // Normalizziamo il tag per evitare duplicati
            detectedConcepts.push({ name: tag.toUpperCase(), weight: 2, sourceWord: tag });
        }
    });

    // C. Ciclo sulle parole
    for (let i = 0; i < rawWords.length; i++) {
        const word = rawWords[i];
        const prevWord = i > 0 ? rawWords[i-1] : "";
        
        // Cerca radice
        const rootMatch = Object.keys(ROOT_MAP).find(root => word.startsWith(root));
        
        if (rootMatch) {
            const def = ROOT_MAP[rootMatch];
            let finalWeight = def.weight;
            let finalConcept = def.concept;

            // Logica Negazione (Semplificata ma efficace)
            if (NEGATIONS.includes(prevWord)) {
                // Inversione Polare
                if (['FEAR', 'SADNESS', 'DANGER', 'STUCK'].includes(def.concept)) {
                    finalConcept = 'COURAGE'; // Non paura -> Coraggio
                    finalWeight = 1;
                } else if (['ANGER', 'CONFLICT'].includes(def.concept)) {
                    finalConcept = 'PEACE'; // Non rabbia -> Pace
                    finalWeight = 1;
                } else if (['LOVE'].includes(def.concept)) {
                     finalConcept = 'ISOLATION'; // Non amore -> Isolamento (o indifferenza)
                     finalWeight = 2;
                } else {
                    // Per altri concetti, la negazione annulla il peso
                    finalWeight = 0; 
                }
            }

            if (finalWeight > 0) {
                detectedConcepts.push({
                    name: finalConcept,
                    weight: finalWeight,
                    sourceWord: word
                });
            }
        }
    }

    return { concepts: detectedConcepts, rawWords };
};

// 2. Analisi Sentiment (Ponderata)
const analyzeSentiment = (concepts: DetectedConcept[]): SentimentScore => {
    let energyScore = 0; 
    let toneScore = 0;   

    concepts.forEach(c => {
        const w = c.weight;
        const name = c.name;

        // High Energy (Yang)
        if (['ANGER', 'CONFLICT', 'POWER', 'JOY', 'CHANGE', 'WORK', 'JEALOUSY', 'URGENCY', 'BETRAYAL', 'COURAGE', 'HOPE', 'DANGER', 'CREATION', 'CRISIS'].includes(name)) {
            energyScore += (1 * w);
        }
        // Low Energy (Yin)
        if (['SADNESS', 'FEAR', 'STUCK', 'CONFUSION', 'TIRED', 'WAITING', 'APATHY', 'ISOLATION', 'EMPTY', 'GUILT', 'PEACE', 'HEALING', 'RECEPTION', 'FAMILY'].includes(name)) {
            energyScore -= (1 * w);
        }

        // Positive Tone
        if (['JOY', 'PEACE', 'POWER', 'SUCCESS', 'CLARITY', 'HOPE', 'COURAGE', 'BALANCE', 'HEALING', 'ABUNDANCE', 'TRUTH', 'LOVE', 'KNOWLEDGE', 'CREATION', 'FAMILY'].includes(name)) {
            toneScore += (1 * w);
        }
        // Negative Tone
        if (['SADNESS', 'FEAR', 'ANGER', 'CONFLICT', 'CONFUSION', 'STUCK', 'APATHY', 'JEALOUSY', 'BETRAYAL', 'GUILT', 'CRISIS', 'ISOLATION', 'EMPTY', 'DANGER', 'TIRED'].includes(name)) {
            toneScore -= (1 * w);
        }
    });

    return {
        energy: energyScore > 2 ? 'HIGH' : energyScore < -2 ? 'LOW' : 'NEUTRAL',
        tone: toneScore > 1 ? 'POSITIVE' : toneScore < -1 ? 'NEGATIVE' : 'NEUTRAL'
    };
};

// 3. Rilevamento Dominio
const detectDomain = (concepts: DetectedConcept[]): 'LOVE' | 'WORK' | 'GROWTH' | 'GENERAL' => {
    const counts = { LOVE: 0, WORK: 0, GROWTH: 0 };
    
    concepts.forEach(c => {
        const w = c.weight;
        const name = c.name;

        if (['LOVE', 'FAMILY', 'JEALOUSY', 'BETRAYAL'].includes(name)) counts.LOVE += w;
        if (['WORK', 'POWER', 'MONEY', 'SUCCESS', 'ABUNDANCE', 'URGENCY'].includes(name)) counts.WORK += w;
        if (['KNOWLEDGE', 'CHANGE', 'CONFUSION', 'WISDOM', 'TRUTH', 'HEALING', 'HOPE', 'GROWTH', 'CREATION', 'ISOLATION'].includes(name)) counts.GROWTH += w;
    });

    if (counts.LOVE > counts.WORK && counts.LOVE > 0) return 'LOVE';
    if (counts.WORK > counts.LOVE && counts.WORK > 0) return 'WORK';
    if (counts.GROWTH > counts.LOVE && counts.GROWTH > counts.WORK) return 'GROWTH';
    
    return 'GENERAL';
};

// 4. Calcolo Punteggio Esagramma
const scoreHexagram = (
    hex: Hexagram, 
    userInput: { concepts: DetectedConcept[], rawWords: string[] }, 
    sentiment: SentimentScore,
    domain: 'LOVE' | 'WORK' | 'GROWTH' | 'GENERAL',
    isGoal: boolean
): number => {
    let score = 0;

    // A. Keyword Matching (Testuale diretto - più preciso)
    // Usiamo le parole grezze per trovare match diretti con le keywords dell'esagramma
    hex.keywords.forEach(k => {
        // Normalizziamo la keyword dell'esagramma
        const keywordRoot = k.toLowerCase().substring(0, k.length - 1); 
        userInput.rawWords.forEach(userWord => {
            if (userWord.includes(keywordRoot)) {
                score += 15; 
            }
        });
    });

    // B. Archetype Matching (Concettuale Ponderato)
    userInput.concepts.forEach(c => {
        const w = c.weight; 
        const concept = c.name;
        const multiplier = w; 

        if ((concept === 'ANGER' || concept === 'JEALOUSY' || concept === 'BETRAYAL' || concept === 'CONFLICT') && hex.archetype === 'CONFLICT') score += (10 * multiplier);
        if ((concept === 'SADNESS' || concept === 'FEAR' || concept === 'GUILT' || concept === 'CRISIS' || concept === 'DANGER') && hex.archetype === 'DANGER') score += (10 * multiplier);
        if ((concept === 'STUCK' || concept === 'APATHY' || concept === 'ISOLATION' || concept === 'EMPTY') && hex.archetype === 'OBSTACLE') score += (10 * multiplier);
        if ((concept === 'WAITING' || concept === 'HOPE' || concept === 'PEACE') && hex.archetype === 'WAITING') score += (8 * multiplier);
        if ((concept === 'CONFUSION' || concept === 'WISDOM' || concept === 'KNOWLEDGE') && hex.archetype === 'GROWTH') score += (8 * multiplier);
        if ((concept === 'POWER' || concept === 'COURAGE' || concept === 'INDEPENDENCE') && hex.archetype === 'CREATION') score += (8 * multiplier);
        if ((concept === 'RECEPTION' || concept === 'HEALING' || concept === 'SIMPLICITY' || concept === 'FAMILY') && hex.archetype === 'RECEPTION') score += (8 * multiplier);
        if ((concept === 'TRUTH' || concept === 'CLARITY' || concept === 'URGENCY') && hex.archetype === 'CLARITY') score += (8 * multiplier);
        if ((concept === 'SUCCESS' || concept === 'ABUNDANCE') && hex.archetype === 'SUCCESS') score += (8 * multiplier);
        if ((concept === 'CHANGE' || concept === 'FUTURE') && hex.archetype === 'TRANSITION') score += (8 * multiplier);
    });

    // C. Sentiment Alignment
    const hexIsYang = hex.element === 'HEAVEN' || hex.element === 'FIRE' || hex.element === 'THUNDER';
    const hexIsYin = hex.element === 'EARTH' || hex.element === 'WATER' || hex.element === 'MOUNTAIN';

    if (sentiment.energy === 'HIGH' && hexIsYang) score += 5;
    if (sentiment.energy === 'LOW' && hexIsYin) score += 5;

    // D. Goal vs Situation Context
    if (isGoal) {
        if (['CREATION', 'SUCCESS', 'CLARITY', 'PEACE', 'SUCCESS', 'TRANSITION'].includes(hex.archetype)) score += 5;
    } else {
        if (['OBSTACLE', 'DANGER', 'CONFUSION', 'WAITING', 'CONFLICT', 'GROWTH'].includes(hex.archetype)) score += 5;
    }

    // E. Domain Boost
    if (domain === 'LOVE') {
        if (hex.number === 2 || hex.number === 30 || hex.number === 63 || hex.number === 5) score += 4;
    }
    if (domain === 'WORK') {
        if (hex.number === 1 || hex.number === 6 || hex.number === 12 || hex.number === 64) score += 4;
    }
    if (domain === 'GROWTH') {
        if (hex.number === 4 || hex.number === 3 || hex.number === 29) score += 4;
    }

    return score;
};

// --- FUNZIONE PRINCIPALE ---

export const performSemanticAnalysis = (
    situationText: string, 
    situationTags: string[], 
    goalText: string,
    goalTags: string[]
): SemanticAnalysisResult | null => {
    
    // 1. Analisi Testuale
    const situationData = analyzeText(situationText, situationTags);
    const goalData = analyzeText(goalText, goalTags);

    // 2. Analisi Contesto Psicologico
    const sitSentiment = analyzeSentiment(situationData.concepts);
    const goalSentiment = analyzeSentiment(goalData.concepts);
    
    // Il dominio è calcolato su tutto l'input combinato
    const globalDomain = detectDomain([...situationData.concepts, ...goalData.concepts]);

    // 3. Scoring Esagrammi
    
    // Start Hexagram
    let bestStart = HEXAGRAMS[0];
    let maxStartScore = -Infinity;

    HEXAGRAMS.forEach(hex => {
        const score = scoreHexagram(hex, situationData, sitSentiment, globalDomain, false);
        const asciiSum = situationText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Aggiungiamo un fattore temporale (minuti) per variare leggermente il risultato a parità di testo
        const timeFactor = new Date().getMinutes() / 100;
        const dust = ((asciiSum % 100) / 1000) + timeFactor; 
        
        if ((score + dust) > maxStartScore) {
            maxStartScore = score + dust;
            bestStart = hex;
        }
    });

    // Goal Hexagram
    let bestGoal = HEXAGRAMS[0];
    let maxGoalScore = -Infinity;

    HEXAGRAMS.forEach(hex => {
        let penalty = (hex.number === bestStart.number) ? -15 : 0; 
        
        const score = scoreHexagram(hex, goalData, goalSentiment, globalDomain, true);
        const asciiSum = goalText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const timeFactor = new Date().getMinutes() / 100;
        const dust = ((asciiSum % 100) / 1000) + timeFactor;

        if ((score + penalty + dust) > maxGoalScore) {
            maxGoalScore = score + penalty + dust;
            bestGoal = hex;
        }
    });

    // 4. Calcolo Linee Mobili
    const movingLines: number[] = [];
    for (let i = 0; i < 6; i++) {
        if (bestStart.lines[i] !== bestGoal.lines[i]) {
            movingLines.push(i);
        }
    }

    // Se non ci sono linee mobili, ne forziamo una significativa basata sul sentiment
    if (movingLines.length === 0) {
        if (sitSentiment.tone === 'NEGATIVE') movingLines.push(0); 
        else if (globalDomain === 'LOVE') movingLines.push(1); 
        else if (globalDomain === 'WORK') movingLines.push(2);
        else movingLines.push(4); 
    }

    return {
        startHexagram: bestStart,
        goalHexagram: bestGoal,
        movingLines: movingLines,
        detectedContext: globalDomain
    };
};
