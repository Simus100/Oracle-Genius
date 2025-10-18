import type { Hexagram } from '../types';
import { HEXAGRAM_CONCEPTS, conceptMap } from '../constants/concepts';

// Funzione di normalizzazione del testo. Ora si limita a pulire e tokenizzare,
// preservando parole come "non" che sono cruciali per il contesto.
const normalizeText = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"")
    .split(/\s+/)
    .filter(word => word.length > 0);
};

// --- Motore di Attribuzione Semantica di Livello Superiore ---

// Per efficienza, creiamo una mappa inversa da parola chiave a concetto una sola volta.
const keywordToConceptMap = new Map<string, string>();
for (const [concept, keywords] of Object.entries(conceptMap)) {
    keywords.forEach(keyword => {
        keywordToConceptMap.set(keyword, concept);
    });
}

// **Innovazione: Rilevamento delle Negazioni**
// La funzione ora analizza il contesto per evitare di attivare concetti negati.
const getUserConcepts = (userWords: string[]): Set<string> => {
    const activatedConcepts = new Set<string>();
    const negationWords = new Set(['non', 'senza', 'mai', 'nessuna', 'nessun', 'niente']);

    userWords.forEach((word, index) => {
        if (keywordToConceptMap.has(word)) {
            const concept = keywordToConceptMap.get(word)!;
            const previousWord = userWords[index - 1];

            // Attiva il concetto solo se la parola precedente NON è una negazione.
            if (!previousWord || !negationWords.has(previousWord)) {
                activatedConcepts.add(concept);
            }
        }
    });
    return activatedConcepts;
};


const calculateScores = (userInput: string, hexagrams: Hexagram[]): { hexagram: Hexagram; situationalScore: number; goalScore: number }[] => {
  const userWords = normalizeText(userInput);
  if (userWords.length === 0) return [];
  
  const userConcepts = getUserConcepts(userWords);
  if (userConcepts.size === 0) return [];

  // Pesi differenziati per concetti primari e secondari
  const PRIMARY_CONCEPT_WEIGHT = 10;
  const SECONDARY_CONCEPT_WEIGHT = 3;
  const JOURNEY_RESONANCE_BONUS = 15; // Bonus potenziato per percorsi completi.

  return hexagrams.map(hexagram => {
    const hexagramData = HEXAGRAM_CONCEPTS[hexagram.number];
    if (!hexagramData) return { hexagram, situationalScore: 0, goalScore: 0 };

    let situationalScore = 0;
    hexagramData.situational.primary.forEach(concept => {
      if (userConcepts.has(concept)) {
        situationalScore += PRIMARY_CONCEPT_WEIGHT;
      }
    });
     hexagramData.situational.secondary.forEach(concept => {
      if (userConcepts.has(concept)) {
        situationalScore += SECONDARY_CONCEPT_WEIGHT;
      }
    });

    let goalScore = 0;
    hexagramData.goal.primary.forEach(concept => {
      if (userConcepts.has(concept)) {
        goalScore += PRIMARY_CONCEPT_WEIGHT;
      }
    });
    hexagramData.goal.secondary.forEach(concept => {
      if (userConcepts.has(concept)) {
        goalScore += SECONDARY_CONCEPT_WEIGHT;
      }
    });
    
    // **Innovazione: Bonus di Risonanza del Percorso**
    // Se l'input dell'utente attiva concetti sia per la situazione che per l'obiettivo
    // dello stesso esagramma, significa che l'utente sta descrivendo un percorso di trasformazione
    // completo che l'Oracolo può illuminare.
    if (situationalScore > 0 && goalScore > 0) {
        situationalScore += JOURNEY_RESONANCE_BONUS;
        goalScore += JOURNEY_RESONANCE_BONUS;
    }

    return { hexagram, situationalScore, goalScore };
  });
};

export const getSuggestions = (userInput: string, hexagrams: Hexagram[]): { start: Hexagram[]; goal: Hexagram[] } => {
  const scoredHexagrams = calculateScores(userInput, hexagrams);

  // Filtra gli esagrammi con punteggio 0 per mostrare solo risultati pertinenti.
  const relevantStart = scoredHexagrams.filter(h => h.situationalScore > 0);
  const relevantGoal = scoredHexagrams.filter(h => h.goalScore > 0);

  // Ordina per punteggio decrescente
  const sortedForStart = relevantStart.sort((a, b) => b.situationalScore - a.situationalScore);
  const sortedForGoal = relevantGoal.sort((a, b) => b.goalScore - a.goalScore);

  return {
    start: sortedForStart.slice(0, 3).map(item => item.hexagram),
    goal: sortedForGoal.slice(0, 3).map(item => item.hexagram),
  };
};