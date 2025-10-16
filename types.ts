
export interface Hexagram {
  number: number;
  name: string;
  italianName: string;
  chineseName: string;
  lines: boolean[]; // true for solid (yang), false for broken (yin)
  situationalDescription: string; // Descrizione dell'archetipo come sfida o condizione attuale
  goalDescription: string; // Descrizione dell'archetipo come aspirazione o qualità da raggiungere
  situationalKeywords: string[]; // Parole chiave per la descrizione situazionale
  goalKeywords: string[]; // Parole chiave per la descrizione dell'obiettivo
  lines_advice: string[]; // Array di 6 stringhe, una per ogni linea, per un consiglio mirato
}
