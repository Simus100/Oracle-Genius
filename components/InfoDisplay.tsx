import React from 'react';

interface InfoDisplayProps {
  show: boolean;
  onClose: () => void;
}

const InfoDisplay: React.FC<InfoDisplayProps> = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 selection:bg-amber-500 selection:text-slate-900"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-amber-300">La Saggezza dell'Oracolo</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-2xl">&times;</button>
        </div>
        
        <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-amber-300 max-w-none">
            <p className="text-lg">
                Questo Oracolo si basa sull'antica saggezza dell'I Ching (o "Libro dei Mutamenti"). Non è uno strumento per predire il futuro, ma uno specchio per riflettere sul sentiero che intercorre tra la tua situazione attuale e l'obiettivo che desideri raggiungere.
            </p>

            <h3 className="text-2xl font-semibold text-amber-300 mt-6 mb-3">La Filosofia del Mutamento</h3>
            <p>
                Il principio fondamentale dell'I Ching è che tutto è in costante cambiamento. Ogni situazione contiene in sé il seme della sua trasformazione. Selezionando un archetipo per il tuo presente e uno per il tuo futuro desiderato, definisci un "sentiero del mutamento". L'oracolo illumina questo percorso.
            </p>

            <h3 className="text-2xl font-semibold text-amber-300 mt-6 mb-3">Come Interpretare la Risposta</h3>
            <p>
                L'Oracolo ti offre una guida specifica per la tua trasformazione:
            </p>
            <ol className="list-decimal pl-5 text-slate-300 space-y-3">
                <li className="mb-2"><strong>Situazione Attuale e Obiettivo Desiderato:</strong> I due esagrammi che hai scelto definiscono il punto di partenza e il punto di arrivo del tuo viaggio interiore. Le loro descrizioni ti aiutano a inquadrare le energie in gioco.</li>
                <li className="mb-2"><strong>Le Linee del Cambiamento:</strong> Questo è il cuore del messaggio. L'Oracolo analizza le differenze tra i due esagrammi e ti mostra consigli specifici solo per le "linee" che devono cambiare. Questo consiglio mirato ti indica esattamente su quali aspetti devi lavorare per passare dalla tua condizione attuale a quella desiderata.</li>
            </ol>

             <p className="mt-4">
                Medita su questi consigli specifici. Non sono generici, ma sono la chiave per la tua personale evoluzione in questo momento. La vera saggezza risiede nell'applicare questa comprensione alla tua vita.
            </p>

            <div className="text-center mt-8">
                <button 
                  onClick={onClose} 
                  className="bg-amber-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-amber-500 transition-all duration-300"
                >
                    Chiudi
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InfoDisplay;
