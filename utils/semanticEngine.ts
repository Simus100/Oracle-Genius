
import { Hexagram } from '../types';
import { HEXAGRAMS } from '../constants/hexagrams';

// --- TIPI E INTERFACCE ---

interface SentimentScore {
    energy: 'HIGH' | 'LOW' | 'NEUTRAL'; // Yang vs Yin
    tone: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

interface AnalysisContext {
    keywordsFound: string[];
    sentiment: SentimentScore;
    dominantArchetype: string | null;
    domain: 'LOVE' | 'WORK' | 'GROWTH' | 'GENERAL';
}

export interface SemanticAnalysisResult {
    startHexagram: Hexagram;
    goalHexagram: Hexagram;
    movingLines: number[];
    detectedContext: 'GENERAL' | 'LOVE' | 'WORK' | 'GROWTH';
}

// --- COSTANTI LINGUISTICHE ---

// Parole che indicano un desiderio di "avere" (Goal) vs "essere" (Situation)
const GOAL_INDICATORS = ['voglio', 'desiderio', 'spero', 'obiettivo', 'ottenere', 'raggiungere', 'diventare', 'futuro'];
const SITUATION_INDICATORS = ['sono', 'sento', 'trovo', 'c\'è', 'adesso', 'ora', 'presente', 'situazione'];

// Mappa concetti estesa con stemming rudimentale (radici)
// Key: Radice della parola -> Value: Concetto/Archetipo
const ROOT_MAP: Record<string, string> = {
    // Emozioni Negative (Yin/Low Energy)
    'trist': 'SADNESS', 'piang': 'SADNESS', 'depres': 'SADNESS', 'malincon': 'SADNESS', 'sol': 'ISOLATION',
    'paur': 'FEAR', 'ans': 'FEAR', 'tèm': 'FEAR', 'terror': 'FEAR', 'panico': 'FEAR',
    'confus': 'CONFUSION', 'dubb': 'CONFUSION', 'pers': 'CONFUSION', 'buio': 'CONFUSION', 'nebbia': 'CONFUSION',
    'stanc': 'TIRED', 'esaur': 'TIRED', 'pesant': 'TIRED', 'blocc': 'STUCK', 'ferm': 'STUCK',
    
    // Emozioni Attive/Negative (Yang/High Energy)
    'rabbi': 'ANGER', 'ir': 'ANGER', 'odi': 'ANGER', 'furi': 'ANGER', 'nervos': 'ANGER',
    'litig': 'CONFLICT', 'scontr': 'CONFLICT', 'combatt': 'CONFLICT', 'guerre': 'CONFLICT', 'nemic': 'CONFLICT',
    
    // Emozioni Positive (High/Low Energy)
    'felic': 'JOY', 'gioi': 'JOY', 'content': 'JOY', 'seren': 'JOY',
    'calm': 'PEACE', 'pac': 'PEACE', 'tranquill': 'PEACE', 'armoni': 'PEACE',
    'fort': 'POWER', 'potent': 'POWER', 'energi': 'POWER', 'vinc': 'POWER', 'success': 'POWER',
    
    // Contesti
    'amor': 'LOVE', 'cuor': 'LOVE', 'partne': 'LOVE', 'amare': 'LOVE', 'relazion': 'LOVE', 'moglie': 'LOVE', 'marit': 'LOVE',
    'lavor': 'WORK', 'uffic': 'WORK', 'capo': 'WORK', 'colleg': 'WORK', 'carrier': 'WORK', 'sold': 'WORK', 'denar': 'WORK',
    'famigl': 'FAMILY', 'padr': 'FAMILY', 'madr': 'FAMILY', 'figl': 'FAMILY', 'casa': 'FAMILY',
    'camb': 'CHANGE', 'nuov': 'CHANGE', 'trasform': 'CHANGE', 'divers': 'CHANGE',
    'sapere': 'KNOWLEDGE', 'capir': 'KNOWLEDGE', 'studi': 'KNOWLEDGE', 'conosc': 'KNOWLEDGE'
};

// --- FUNZIONI DI UTILITÀ ---

// 1. Pulizia e Stemming
const analyzeText = (text: string, tags: string[]): { roots: string[], originalWords: string[] } => {
    const rawWords = text.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ") // Rimuove punteggiatura
        .split(/\s+/)
        .filter(w => w.length > 2); // Rimuove congiunzioni brevi

    // Aggiungiamo i tag come parole forti
    const allWords = [...rawWords, ...tags.map(t => t.toLowerCase())];

    const roots = allWords.map(word => {
        // Stemming semplice: prende i primi 4-5 caratteri per intercettare variazioni
        // Es: "Amare", "Amavo", "Amante" -> "amar" (o similia)
        // Usiamo la mappa ROOT_MAP per vedere se la parola inizia con una radice nota
        const match = Object.keys(ROOT_MAP).find(root => word.startsWith(root));
        return match ? ROOT_MAP[match] : word; // Se trova concetto restituisce concetto, altrimenti parola originale
    });

    return { roots, originalWords: allWords };
};

// 2. Analisi Sentiment e Energia
const analyzeSentiment = (concepts: string[]): SentimentScore => {
    let energyScore = 0; // > 0 High (Yang), < 0 Low (Yin)
    let toneScore = 0;   // > 0 Positive, < 0 Negative

    concepts.forEach(c => {
        switch(c) {
            case 'ANGER': case 'CONFLICT': case 'POWER': case 'JOY': case 'CHANGE': case 'WORK':
                energyScore += 2; break;
            case 'SADNESS': case 'FEAR': case 'STUCK': case 'CONFUSION': case 'TIRED': case 'WAITING':
                energyScore -= 2; break;
            case 'PEACE':
                energyScore -= 1; toneScore += 2; break;
            case 'LOVE':
                toneScore += 2; break;
        }
        
        if (['JOY', 'PEACE', 'POWER', 'SUCCESS', 'CLARITY'].includes(c)) toneScore += 1;
        if (['SADNESS', 'FEAR', 'ANGER', 'CONFLICT', 'CONFUSION', 'STUCK'].includes(c)) toneScore -= 1;
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
        if (c === 'LOVE' || c === 'FAMILY') counts.LOVE++;
        if (c === 'WORK' || c === 'POWER' || c === 'MONEY') counts.WORK++;
        if (c === 'KNOWLEDGE' || c === 'CHANGE' || c === 'CONFUSION') counts.GROWTH++;
    });

    if (counts.LOVE > counts.WORK && counts.LOVE > 0) return 'LOVE';
    if (counts.WORK > counts.LOVE && counts.WORK > 0) return 'WORK';
    if (counts.GROWTH > counts.LOVE && counts.GROWTH > counts.WORK) return 'GROWTH';
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

    // A. Keyword Matching (Il più potente)
    // Controlliamo se le parole dell'utente sono contenute nelle keywords specifiche dell'esagramma
    hex.keywords.forEach(k => {
        const keywordRoot = k.substring(0, 4); // Stemming sulla keyword dell'esagramma
        userInput.originalWords.forEach(userWord => {
            if (userWord.includes(keywordRoot)) {
                score += 15; // Massimo punteggio per match diretto
            }
        });
    });

    // B. Archetype Matching
    userInput.roots.forEach(concept => {
        if (concept === 'ANGER' && hex.archetype === 'CONFLICT') score += 10;
        if (concept === 'SADNESS' && hex.archetype === 'DANGER') score += 10;
        if (concept === 'STUCK' && hex.archetype === 'OBSTACLE') score += 10;
        if (concept === 'WAITING' && hex.archetype === 'WAITING') score += 10;
        if (concept === 'CONFUSION' && hex.archetype === 'GROWTH') score += 8;
        if (concept === 'POWER' && hex.archetype === 'CREATION') score += 8;
        if (concept === 'PEACE' && hex.archetype === 'RECEPTION') score += 8;
        if (concept === 'SUCCESS' && hex.archetype === 'SUCCESS') score += 10;
    });

    // C. Sentiment Alignment
    // Se l'utente è "Active" (arrabbiato, energico), favoriamo esagrammi Yang (es. 1, 6, 30)
    // Se l'utente è "Passive" (triste, bloccato), favoriamo esagrammi Yin o di Acqua (es. 2, 29, 39)
    const hexIsYang = hex.element === 'HEAVEN' || hex.element === 'FIRE' || hex.element === 'THUNDER';
    const hexIsYin = hex.element === 'EARTH' || hex.element === 'WATER' || hex.element === 'MOUNTAIN';

    if (sentiment.energy === 'HIGH' && hexIsYang) score += 5;
    if (sentiment.energy === 'LOW' && hexIsYin) score += 5;

    // D. Goal vs Situation Context
    // Alcuni esagrammi sono ottimi "Goals" (es. 1 Il Creativo, 63 Dopo il Compimento)
    // Altri sono tipiche "Situations" (es. 3 Difficoltà, 4 Follia)
    if (isGoal) {
        if (['CREATION', 'SUCCESS', 'CLARITY', 'PEACE'].includes(hex.archetype)) score += 3;
    } else {
        if (['OBSTACLE', 'DANGER', 'CONFUSION', 'WAITING'].includes(hex.archetype)) score += 3;
    }

    // E. Domain Boost
    if (domain === 'LOVE' && hex.number === 2) score += 2; // Ricettivo è buono per relazioni
    if (domain === 'WORK' && hex.number === 1) score += 2; // Creativo è buono per lavoro
    if (domain === 'GROWTH' && (hex.number === 4 || hex.number === 3)) score += 2;

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
    // Troviamo il miglior esagramma di partenza
    let bestStart = HEXAGRAMS[0];
    let maxStartScore = -Infinity;

    HEXAGRAMS.forEach(hex => {
        const score = scoreHexagram(hex, situationData, sitSentiment, globalDomain, false);
        // Aggiungiamo un pizzico di determinismo basato sulla lunghezza del testo per rompere pareggi
        const dust = (situationText.length % 10) / 100; 
        
        if ((score + dust) > maxStartScore) {
            maxStartScore = score + dust;
            bestStart = hex;
        }
    });

    // Troviamo il miglior esagramma di arrivo
    let bestGoal = HEXAGRAMS[0];
    let maxGoalScore = -Infinity;

    HEXAGRAMS.forEach(hex => {
        // Evitiamo che Start e Goal siano identici se possibile, penalizzando leggermente l'identità
        let penalty = (hex.number === bestStart.number) ? -5 : 0;
        
        const score = scoreHexagram(hex, goalData, goalSentiment, globalDomain, true);
        const dust = (goalText.length % 10) / 100;

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

    // Se per assurdo (input molto scarso) sono uguali, forziamo un cambiamento sulla linea 1 o 2 basandoci sul sentiment
    if (movingLines.length === 0) {
        if (sitSentiment.tone === 'NEGATIVE') movingLines.push(0); // Linea 1: Inizio dal basso
        else movingLines.push(4); // Linea 5: Problema di leadership/cuore
    }

    return {
        startHexagram: bestStart,
        goalHexagram: bestGoal,
        movingLines: movingLines,
        detectedContext: globalDomain
    };
};
