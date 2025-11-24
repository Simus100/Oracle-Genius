
export interface Hexagram {
  number: number;
  name: string;
  italianName: string;
  chineseName: string;
  lines: boolean[]; // true for solid (yang), false for broken (yin)
  
  // Metadati per il Motore Semantico
  keywords: string[]; // Parole chiave specifiche che attivano questo esagramma
  archetype: 'CREATION' | 'RECEPTION' | 'DANGER' | 'CLARITY' | 'OBSTACLE' | 'GROWTH' | 'CONFLICT' | 'PEACE' | 'TRANSITION' | 'WAITING' | 'SUCCESS';
  element: 'HEAVEN' | 'EARTH' | 'THUNDER' | 'WATER' | 'MOUNTAIN' | 'WIND' | 'FIRE' | 'LAKE';

  // Contenuti Tradizionali e Filosofici
  traditionalImage: string; // Es: "Il Cielo sopra, il Cielo sotto"
  judgement: string; // La Sentenza classica rielaborata

  // Descrizioni Psicologiche Estese
  situationalDescription: string; // Analisi psicologica della situazione presente
  goalDescription: string; // La visione dell'obiettivo evoluto
  
  // Approfondimenti Settoriali
  loveAdvice: string; // Consiglio specifico per relazioni/affetti
  workAdvice: string; // Consiglio specifico per carriera/affari
  growthAdvice: string; // Consiglio per evoluzione spirituale/interiore

  lines_advice: string[]; // 6 stringhe dettagliate per le linee mobili
}
