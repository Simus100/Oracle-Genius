
// Motore Audio Procedurale per Oracle Genius
// Genera un drone meditativo binaurale usando Web Audio API puro.
// Nessun file esterno richiesto.

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;

  constructor() {
    // Inizializzazione pigra per rispettare le policy del browser
  }

  public init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.3; // Volume iniziale basso
    }
  }

  public startDrone() {
    if (this.isPlaying || !this.context || !this.masterGain) return;

    // Frequenze per un accordo mistico (es. 432Hz base e armonici)
    // Usiamo frequenze basse per effetto "Om" profondo + binaural beats leggeri
    const frequencies = [
        55.00, // La1 (Basso profondo)
        55.25, // La1 scordato (Binaural beat lento 0.25Hz)
        110.00, // La2 (Ottava)
        164.81, // Mi3 (Quinta giusta)
        220.00  // La3
    ];

    frequencies.forEach((freq, index) => {
      if (!this.context || !this.masterGain) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      // Tipo di onda: Sine per purezza, Triangle per un po' di calore
      osc.type = index < 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      // LFO per modulare leggermente il volume e creare movimento "vivo"
      const lfo = this.context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + (Math.random() * 0.1); // Molto lento
      const lfoGain = this.context.createGain();
      lfoGain.gain.value = 0.05; // Modulazione sottile
      
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      // Volume base decrescente per le frequenze più alte
      gain.gain.value = 0.1 / (index + 1);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      this.oscillators.push(osc);
      this.oscillators.push(lfo); // Teniamo traccia anche degli LFO per fermarli
    });

    // Filtro Passa Basso per ammorbidire tutto (suono ovattato/subacqueo)
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    this.masterGain.disconnect();
    this.masterGain.connect(filter);
    filter.connect(this.context.destination);

    this.isPlaying = true;
    this.fadeIn();
  }

  public stop() {
    if (!this.isPlaying) return;
    this.fadeOut(() => {
        this.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
    });
  }

  public toggleMute(muted: boolean) {
    if (!this.masterGain || !this.context) return;
    
    if (muted) {
        this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.5);
    } else {
        this.masterGain.gain.setTargetAtTime(0.3, this.context.currentTime, 0.5);
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }
  }

  private fadeIn() {
    if (!this.masterGain || !this.context) return;
    this.masterGain.gain.setValueAtTime(0, this.context.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 3); // 3 sec fade in
  }

  private fadeOut(callback: () => void) {
    if (!this.masterGain || !this.context) return;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.context.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 2); // 2 sec fade out
    setTimeout(callback, 2000);
  }
}

export const audioManager = new AudioEngine();
