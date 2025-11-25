
import { Hexagram } from '../types';
import { HEXAGRAMS } from '../constants/hexagrams';

// --- TIPI E INTERFACCE ---

interface SentimentScore {
    energy: 'HIGH' | 'LOW' | 'NEUTRAL'; // Yang vs Yin
    tone: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface SemanticAnalysisResult {
    startHexagram: Hexagram;
    goalHexagram: Hexagram;
    movingLines: number[];
    detectedContext: 'GENERAL' | 'LOVE' | 'WORK' | 'GROWTH';
}

// --- COSTANTI LINGUISTICHE ---

// Parole che indicano un desiderio di "avere" (Goal) vs "essere" (Situation)
const GOAL_INDICATORS = [
    'voglio', 'vorrei', 'desider', 'spero', 'obiettiv', 'ottenere', 'raggiung', 'diventare', 
    'futuro', 'domani', 'cambiare', 'cerc', 'sogn', 'meta', 'destin', 'trasform'
];

const SITUATION_INDICATORS = [
    'sono', 'sento', 'trovo', 'c\'è', 'adesso', 'ora', 'presente', 'situazion', 
    'moment', 'oggi', 'stato', 'vivo', 'prov', 'sentire'
];

// --- DIZIONARIO DELLE RADICI (ROOT_MAP) ---
// Key: Radice della parola (stem) -> Value: Concetto/Archetipo
// Questo dizionario mappa il linguaggio naturale umano ai concetti archetipici dell'I Ching.

const ROOT_MAP: Record<string, string> = {
    // --- EMOZIONI NEGATIVE (YIN / LOW ENERGY) ---
    // Tristezza e Dolore
    'trist': 'SADNESS', 'piang': 'SADNESS', 'depres': 'SADNESS', 'malincon': 'SADNESS', 
    'lacrim': 'SADNESS', 'dolor': 'SADNESS', 'soffr': 'SADNESS', 'ferit': 'SADNESS',
    'delus': 'SADNESS', 'amarezz': 'SADNESS', 'buio': 'SADNESS', 'notte': 'SADNESS',
    'lutt': 'SADNESS', 'pers': 'SADNESS', 'manc': 'SADNESS', 'sol': 'ISOLATION',
    
    // Paura e Ansia
    'paur': 'FEAR', 'ans': 'FEAR', 'tèm': 'FEAR', 'terror': 'FEAR', 'panic': 'FEAR', 
    'trem': 'FEAR', 'spaven': 'FEAR', 'incub': 'FEAR', 'minacc': 'FEAR', 'rischi': 'FEAR',
    'preoccup': 'FEAR', 'agit': 'FEAR', 'teso': 'FEAR', 'stress': 'FEAR',

    // Blocco e Apatia
    'blocc': 'STUCK', 'ferm': 'STUCK', 'ostacol': 'STUCK', 'imped': 'STUCK', 
    'chius': 'STUCK', 'muro': 'STUCK', 'trappol': 'STUCK', 'catene': 'STUCK',
    'apat': 'APATHY', 'noia': 'APATHY', 'indiff': 'APATHY', 'svogli': 'APATHY', 
    'stanc': 'TIRED', 'esaur': 'TIRED', 'pesant': 'TIRED', 'fatic': 'TIRED',
    'vuoto': 'EMPTY', 'nulla': 'EMPTY', 'inutil': 'EMPTY', 'sens': 'EMPTY',

    // Confusione
    'confus': 'CONFUSION', 'dubb': 'CONFUSION', 'non so': 'CONFUSION', 'incert': 'CONFUSION', 
    'nebbia': 'CONFUSION', 'caos': 'CONFUSION', 'disord': 'CONFUSION', 'bivio': 'CONFUSION',
    'scelt': 'CONFUSION', 'scegl': 'CONFUSION',

    // Colpa e Vergogna
    'colp': 'GUILT', 'rimors': 'GUILT', 'vergon': 'GUILT', 'sbagli': 'GUILT', 
    'error': 'GUILT', 'pentit': 'GUILT', 'peccat': 'GUILT',

    // --- EMOZIONI ATTIVE / NEGATIVE (YANG / HIGH ENERGY) ---
    // Rabbia e Conflitto
    'rabbi': 'ANGER', 'ir': 'ANGER', 'odi': 'ANGER', 'furi': 'ANGER', 'nervos': 'ANGER', 
    'url': 'ANGER', 'grida': 'ANGER', 'spacc': 'ANGER', 'vendet': 'ANGER',
    'litig': 'CONFLICT', 'scontr': 'CONFLICT', 'combatt': 'CONFLICT', 'guerr': 'CONFLICT', 
    'nemic': 'CONFLICT', 'accus': 'CONFLICT', 'discut': 'CONFLICT', 'legal': 'CONFLICT',
    'caus': 'CONFLICT', 'avvocat': 'CONFLICT', 'tribunal': 'CONFLICT',
    
    // Gelosia e Tradimento
    'gelos': 'JEALOUSY', 'invid': 'JEALOUSY', 'possess': 'JEALOUSY', 'rival': 'JEALOUSY',
    'trad': 'BETRAYAL', 'ingann': 'BETRAYAL', 'fals': 'BETRAYAL', 'ment': 'BETRAYAL', 
    'bugi': 'BETRAYAL', 'infedel': 'BETRAYAL', 'corn': 'BETRAYAL',

    // Urgenza e Crisi
    'urgen': 'URGENCY', 'frett': 'URGENCY', 'pres': 'URGENCY', 'subito': 'URGENCY', 
    'corr': 'URGENCY', 'scapp': 'URGENCY', 'temp': 'URGENCY',
    'crisi': 'DANGER', 'croll': 'DANGER', 'pericolo': 'DANGER', 'disastr': 'DANGER', 
    'emerg': 'DANGER', 'aiut': 'DANGER', 'sos': 'DANGER', 'precip': 'DANGER',

    // --- EMOZIONI POSITIVE / OBIETTIVI ---
    // Gioia e Speranza
    'felic': 'JOY', 'gioi': 'JOY', 'content': 'JOY', 'seren': 'JOY', 'entusi': 'JOY', 
    'ridere': 'JOY', 'sorris': 'JOY', 'luce': 'JOY',
    'speran': 'HOPE', 'fiduc': 'HOPE', 'cred': 'HOPE', 'fede': 'HOPE', 
    'pregh': 'HOPE', 'miracol': 'HOPE', 'sogn': 'HOPE',

    // Potere e Coraggio
    'fort': 'POWER', 'potent': 'POWER', 'energi': 'POWER', 'vinc': 'POWER', 
    'success': 'POWER', 'indip': 'POWER', 'autonom': 'POWER', 'capace': 'POWER',
    'leader': 'POWER', 'comand': 'POWER', 'vittor': 'POWER', 'trionf': 'POWER',
    'coragg': 'COURAGE', 'osare': 'COURAGE', 'avanti': 'COURAGE', 'buttars': 'COURAGE',
    
    // Equilibrio e Pace
    'calm': 'PEACE', 'pac': 'PEACE', 'tranquill': 'PEACE', 'armoni': 'PEACE', 
    'semplic': 'PEACE', 'silenz': 'PEACE', 'ripos': 'PEACE', 'zen': 'PEACE',
    'equilibr': 'BALANCE', 'stabil': 'BALANCE', 'sicur': 'BALANCE', 'solid': 'BALANCE', 
    'fermez': 'BALANCE', 'centr': 'BALANCE',

    // Verità e Guarigione
    'verit': 'TRUTH', 'realt': 'TRUTH', 'sincer': 'TRUTH', 'onest': 'TRUTH', 
    'chiar': 'CLARITY', 'veder': 'CLARITY', 'capir': 'CLARITY', 'lucid': 'CLARITY',
    'guari': 'HEALING', 'salut': 'HEALING', 'benesser': 'HEALING', 'curar': 'HEALING', 
    'medic': 'HEALING', 'sanar': 'HEALING', 'rinasc': 'HEALING',
    'perdon': 'FORGIVENESS', 'scusa': 'FORGIVENESS', 'pace': 'FORGIVENESS',

    // Abbondanza
    'abbond': 'ABUNDANCE', 'ricch': 'ABUNDANCE', 'prosper': 'ABUNDANCE', 
    'fortun': 'ABUNDANCE', 'guadagn': 'ABUNDANCE',

    // --- DOMINI E CONTESTI ---
    // Amore e Relazioni
    'amor': 'LOVE', 'cuor': 'LOVE', 'partne': 'LOVE', 'amare': 'LOVE', 'relazion': 'LOVE', 
    'moglie': 'LOVE', 'marit': 'LOVE', 'amant': 'LOVE', 'fidanz': 'LOVE', 'ragazz': 'LOVE',
    'innamor': 'LOVE', 'sentiment': 'LOVE', 'sess': 'LOVE', 'baci': 'LOVE', 'affett': 'LOVE',
    'ex': 'LOVE', 'ritorn': 'LOVE', 'storia': 'LOVE', 'coppia': 'LOVE',

    // Famiglia
    'famigl': 'FAMILY', 'padr': 'FAMILY', 'madr': 'FAMILY', 'figl': 'FAMILY', 
    'casa': 'FAMILY', 'genitor': 'FAMILY', 'parent': 'FAMILY', 'fratell': 'FAMILY', 'sorell': 'FAMILY',

    // Lavoro e Denaro
    'lavor': 'WORK', 'uffic': 'WORK', 'capo': 'WORK', 'colleg': 'WORK', 'carrier': 'WORK', 
    'business': 'WORK', 'progett': 'WORK', 'contratt': 'WORK', 'aziend': 'WORK', 
    'mestier': 'WORK', 'profession': 'WORK', 'impieg': 'WORK',
    'denar': 'MONEY', 'sold': 'MONEY', 'econom': 'MONEY', 'spes': 'MONEY', 
    'debit': 'MONEY', 'pagar': 'MONEY', 'finanz': 'MONEY',

    // Crescita e Cambiamento
    'camb': 'CHANGE', 'nuov': 'CHANGE', 'trasform': 'CHANGE', 'divers': 'CHANGE', 
    'trasloc': 'CHANGE', 'viagg': 'CHANGE', 'partir': 'CHANGE', 'rivoluz': 'CHANGE',
    'sapere': 'KNOWLEDGE', 'studi': 'KNOWLEDGE', 'conosc': 'KNOWLEDGE', 
    'sagg': 'KNOWLEDGE', 'impar': 'KNOWLEDGE', 'lezion': 'KNOWLEDGE', 'libr': 'KNOWLEDGE',
    'scuol': 'KNOWLEDGE', 'esam': 'KNOWLEDGE', 'univers': 'KNOWLEDGE'
};

// --- FUNZIONI DI UTILITÀ ---

// 1. Pulizia e Stemming
const analyzeText = (text: string, tags: string[]): { roots: string[], originalWords: string[] } => {
    // Aggiungi spazi intorno a punteggiatura per evitare fusioni
    const cleanText = text.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
        .replace(/\s+/g, " ");

    const rawWords = cleanText.split(" ").filter(w => w.length > 2);

    // Aggiungiamo i tag come parole forti
    const allWords = [...rawWords, ...tags.map(t => t.toLowerCase())];

    const roots = allWords.map(word => {
        // Tenta di trovare una radice nel dizionario
        // Es: "Lavorare", "Lavoro", "Lavoratore" -> Match con "lavor" -> Restituisce "WORK"
        const match = Object.keys(ROOT_MAP).find(root => word.startsWith(root));
        return match ? ROOT_MAP[match] : word; 
    });

    return { roots, originalWords: allWords };
};

// 2. Analisi Sentiment e Energia
const analyzeSentiment = (concepts: string[]): SentimentScore => {
    let energyScore = 0; // > 0 High (Yang), < 0 Low (Yin)
    let toneScore = 0;   // > 0 Positive, < 0 Negative

    concepts.forEach(c => {
        // High Energy (Yang)
        if (['ANGER', 'CONFLICT', 'POWER', 'JOY', 'CHANGE', 'WORK', 'JEALOUSY', 'URGENCY', 'BETRAYAL', 'COURAGE', 'HOPE', 'DANGER'].includes(c)) {
            energyScore += 2;
        }
        // Low Energy (Yin)
        if (['SADNESS', 'FEAR', 'STUCK', 'CONFUSION', 'TIRED', 'WAITING', 'APATHY', 'ISOLATION', 'EMPTY', 'GUILT', 'PEACE', 'HEALING', 'RECEPTION'].includes(c)) {
            energyScore -= 2;
        }

        // Positive Tone
        if (['JOY', 'PEACE', 'POWER', 'SUCCESS', 'CLARITY', 'HOPE', 'COURAGE', 'BALANCE', 'HEALING', 'ABUNDANCE', 'TRUTH', 'LOVE', 'KNOWLEDGE'].includes(c)) {
            toneScore += 2;
        }
        // Negative Tone
        if (['SADNESS', 'FEAR', 'ANGER', 'CONFLICT', 'CONFUSION', 'STUCK', 'APATHY', 'JEALOUSY', 'BETRAYAL', 'GUILT', 'CRISIS', 'ISOLATION', 'EMPTY'].includes(c)) {
            toneScore -= 2;
        }
    });

    return {
        energy: energyScore > 1 ? 'HIGH' : energyScore < -1 ? 'LOW' : 'NEUTRAL',
        tone: toneScore > 0 ? 'POSITIVE' : toneScore < 0 ? 'NEGATIVE' : 'NEUTRAL'
    };
};

// 3. Rilevamento Dominio
const detectDomain = (concepts: string[]): 'LOVE' | 'WORK' | 'GROWTH' | 'GENERAL' => {
    const counts = { LOVE: 0, WORK: 0, GROWTH: 0 };
    concepts.forEach(c => {
        if (['LOVE', 'FAMILY', 'JEALOUSY', 'BETRAYAL'].includes(c)) counts.LOVE++;
        if (['WORK', 'POWER', 'MONEY', 'SUCCESS', 'ABUNDANCE', 'URGENCY'].includes(c)) counts.WORK++;
        if (['KNOWLEDGE', 'CHANGE', 'CONFUSION', 'WISDOM', 'TRUTH', 'HEALING', 'HOPE'].includes(c)) counts.GROWTH++;
    });

    // Logica di prevalenza
    if (counts.LOVE > counts.WORK && counts.LOVE > 0) return 'LOVE';
    if (counts.WORK > counts.LOVE && counts.WORK > 0) return 'WORK';
    if (counts.GROWTH > counts.LOVE && counts.GROWTH > counts.WORK) return 'GROWTH';
    
    // Fallback: se c'è "ANGER" o "CONFLICT" senza contesto specifico, spesso è lavoro o amore.
    // Usiamo il contesto generale per default.
    return 'GENERAL';
};

// 4. Calcolo Punteggio Esagramma
const scoreHexagram = (
    hex: Hexagram, 
    userInput: { roots: string[], originalWords: string[] }, 
    sentiment: SentimentScore,
    domain: 'LOVE' | 'WORK' | 'GROWTH' | 'GENERAL',
    isGoal: boolean
): number => {
    let score = 0;

    // A. Keyword Matching (Il più potente: match diretto con le keywords dell'esagramma)
    hex.keywords.forEach(k => {
        const keywordRoot = k.substring(0, 4).toLowerCase(); 
        userInput.originalWords.forEach(userWord => {
            if (userWord.includes(keywordRoot)) {
                score += 15; // Massimo punteggio per match lessicale diretto
            }
        });
    });

    // B. Archetype Matching (Mappatura concettuale)
    userInput.roots.forEach(concept => {
        // High Conflict / Anger -> Hex 6 (Conflitto), 30 (Fuoco)
        if ((concept === 'ANGER' || concept === 'JEALOUSY' || concept === 'BETRAYAL' || concept === 'CONFLICT') && hex.archetype === 'CONFLICT') score += 12;
        
        // Deep Fear / Crisis / Guilt -> Hex 29 (Abisso), 3 (Difficoltà)
        if ((concept === 'SADNESS' || concept === 'FEAR' || concept === 'GUILT' || concept === 'CRISIS' || concept === 'DANGER') && hex.archetype === 'DANGER') score += 12;
        
        // Stuck / Apathy / Isolation -> Hex 12 (Ristagno)
        if ((concept === 'STUCK' || concept === 'APATHY' || concept === 'ISOLATION' || concept === 'EMPTY') && hex.archetype === 'OBSTACLE') score += 12;
        
        // Waiting / Patience / Hope (Passive) -> Hex 5 (Attesa)
        if ((concept === 'WAITING' || concept === 'HOPE' || concept === 'PEACE') && hex.archetype === 'WAITING') score += 10;
        
        // Confusion / Learning / Wisdom -> Hex 4 (Follia Giovanile)
        if ((concept === 'CONFUSION' || concept === 'WISDOM' || concept === 'KNOWLEDGE') && hex.archetype === 'GROWTH') score += 8;
        
        // Power / Courage / Independence -> Hex 1 (Creativo)
        if ((concept === 'POWER' || concept === 'COURAGE' || concept === 'INDEPENDENCE') && hex.archetype === 'CREATION') score += 10;
        
        // Reception / Support / Healing -> Hex 2 (Ricettivo)
        if ((concept === 'RECEPTION' || concept === 'HEALING' || concept === 'SIMPLICITY' || concept === 'FAMILY') && hex.archetype === 'RECEPTION') score += 10;
        
        // Truth / Clarity -> Hex 30 (Fuoco)
        if ((concept === 'TRUTH' || concept === 'CLARITY' || concept === 'URGENCY') && hex.archetype === 'CLARITY') score += 10;
        
        // Success / Completion -> Hex 63
        if ((concept === 'SUCCESS' || concept === 'ABUNDANCE') && hex.archetype === 'SUCCESS') score += 10;
        
        // Transition / Future -> Hex 64
        if ((concept === 'CHANGE' || concept === 'FUTURE') && hex.archetype === 'TRANSITION') score += 10;
    });

    // C. Sentiment Alignment (Risonanza Energetica)
    const hexIsYang = hex.element === 'HEAVEN' || hex.element === 'FIRE' || hex.element === 'THUNDER';
    const hexIsYin = hex.element === 'EARTH' || hex.element === 'WATER' || hex.element === 'MOUNTAIN';

    if (sentiment.energy === 'HIGH' && hexIsYang) score += 5;
    if (sentiment.energy === 'LOW' && hexIsYin) score += 5;

    // D. Goal vs Situation Context
    if (isGoal) {
        if (['CREATION', 'SUCCESS', 'CLARITY', 'PEACE', 'SUCCESS', 'TRANSITION'].includes(hex.archetype)) score += 3;
    } else {
        if (['OBSTACLE', 'DANGER', 'CONFUSION', 'WAITING', 'CONFLICT', 'GROWTH'].includes(hex.archetype)) score += 3;
    }

    // E. Domain Boost
    if (domain === 'LOVE') {
        if (hex.number === 2 || hex.number === 30 || hex.number === 63 || hex.number === 5) score += 3;
    }
    if (domain === 'WORK') {
        if (hex.number === 1 || hex.number === 6 || hex.number === 12 || hex.number === 64) score += 3;
    }
    if (domain === 'GROWTH') {
        if (hex.number === 4 || hex.number === 3 || hex.number === 29) score += 3;
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
    const sitSentiment = analyzeSentiment(situationData.roots);
    const goalSentiment = analyzeSentiment(goalData.roots);
    
    // Il dominio è calcolato su tutto l'input
    const globalDomain = detectDomain([...situationData.roots, ...goalData.roots]);

    // 3. Scoring Esagrammi
    
    // Start Hexagram
    let bestStart = HEXAGRAMS[0];
    let maxStartScore = -Infinity;

    HEXAGRAMS.forEach(hex => {
        const score = scoreHexagram(hex, situationData, sitSentiment, globalDomain, false);
        // Dust: un valore casuale ma deterministico basato sulla somma dei codici ASCII dei caratteri
        const asciiSum = situationText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const dust = (asciiSum % 100) / 1000; 
        
        if ((score + dust) > maxStartScore) {
            maxStartScore = score + dust;
            bestStart = hex;
        }
    });

    // Goal Hexagram
    let bestGoal = HEXAGRAMS[0];
    let maxGoalScore = -Infinity;

    HEXAGRAMS.forEach(hex => {
        // Penalità per identità (evita che Start == Goal a meno che sia inevitabile)
        let penalty = (hex.number === bestStart.number) ? -8 : 0;
        
        const score = scoreHexagram(hex, goalData, goalSentiment, globalDomain, true);
        const asciiSum = goalText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const dust = (asciiSum % 100) / 1000;

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

    // Fallback se nessun mutamento (raro ma possibile con input povero)
    if (movingLines.length === 0) {
        if (sitSentiment.tone === 'NEGATIVE') movingLines.push(0); // Linea 1: Inizio dal basso
        else if (globalDomain === 'LOVE') movingLines.push(1); // Linea 2: Relazione
        else movingLines.push(4); // Linea 5: Leadership/Cuore
    }

    return {
        startHexagram: bestStart,
        goalHexagram: bestGoal,
        movingLines: movingLines,
        detectedContext: globalDomain
    };
};
