
// Motore Audio Procedurale per Oracle Genius (Master Level)
// Features: Binaural Theta Waves, Algorithmic Melodic Walker, Modal Scales, Physical Texture Synthesis

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null; 
  private reverbNode: ConvolverNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Nodi attivi
  private oscillators: AudioNode[] = []; 
  
  // Trackers specifici per il Pitch Morphing
  private activeDroneOscillators: { left: OscillatorNode, right: OscillatorNode, baseIndex: number }[] = [];
  private activePadOscillators: { osc: OscillatorNode, baseIndex: number }[] = [];

  private noiseNode: AudioBufferSourceNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;
  private textureLFO: OscillatorNode | null = null; // LFO specifico per la texture
  private textureGain: GainNode | null = null;

  // Stato
  private isPlaying: boolean = false;
  private isSystemSuspended: boolean = false; 
  private chimeTimer: ReturnType<typeof setTimeout> | null = null;
  private userVolume: number = 1.0; 
  
  // Parametri Manuali
  private chimeDensity: number = 1.0; 
  private currentElement: string = 'EARTH';

  // Algorithmic Walker State
  private lastNoteIndex: number = 5; // Indice di partenza (centro scala)

  // --- TUNING DRONE PER ELEMENTO (Hertz) ---
  // Ogni elemento ha una fondamentale diversa per cambiare il "colore" armonico
  private droneTunings: Record<string, number[]> = {
      'EARTH': [55.00, 82.41], // A1, E2 (Quinta giusta, stabile)
      'WATER': [73.42, 110.00], // D2, A2 (Profondo, fluido)
      'FIRE': [65.41, 98.00],   // C2, G2 (Caldo, energetico)
      'WIND': [87.31, 130.81],  // F2, C3 (Aereo, Lidio)
      'ETHER': [61.74, 92.50],  // B1, F#2 (Mistico, Locrio)
  };

  // --- SCALE MODALI (Hertz) ---
  // Ogni elemento ha una "firma emotiva" musicale distinta
  private scales: Record<string, number[]> = {
      'EARTH': [ // A Minor Pentatonic (Radicamento, Stabilità, Antico)
          110.00, 130.81, 146.83, 164.81, 196.00, 
          220.00, 261.63, 293.66, 329.63, 392.00, 
          440.00, 523.25, 587.33, 659.25, 783.99,
          880.00
      ],
      'FIRE': [ // C Lydian (Luminoso, Magico, Ascendente) - Do, Re, Mi, Fa#, Sol, La, Si
          130.81, 146.83, 164.81, 185.00, 196.00, 220.00, 246.94,
          261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88,
          523.25, 587.33, 659.25, 739.99
      ],
      'WATER': [ // D Hirajoshi (Giapponese, Malinconico, Fluido)
          73.42, 82.41, 110.00, 116.54, 146.83,
          146.83, 164.81, 220.00, 233.08, 293.66,
          293.66, 329.63, 440.00, 466.16, 587.33
      ],
      'WIND': [ // F Lydian/Whole Tone mix (Sospeso, Onirico, Senza gravità)
          87.31, 110.00, 130.81, 146.83, 174.61, 196.00,
          174.61, 220.00, 261.63, 293.66, 349.23, 392.00,
          349.23, 440.00, 523.25, 587.33, 698.46
      ],
      'ETHER': [ // B Locrian/Just Intonation (Pitagorico, Armonia Matematica Pura)
          61.74, 73.42, 87.31, 98.00, 123.47, 146.83,
          123.47, 146.83, 174.61, 196.00, 246.94, 293.66,
          246.94, 293.66, 349.23, 392.00, 493.88, 587.33
      ]
  };

  constructor() {
    // Lazy init
  }

  public init() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.userVolume; 
      
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256; 
      this.analyser.smoothingTimeConstant = 0.7; 
      
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -24; 
      this.compressor.knee.value = 30; 
      this.compressor.ratio.value = 12; 
      this.compressor.attack.value = 0.003; 
      this.compressor.release.value = 0.25; 

      this.compressor.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      
      this.reverbNode = this.createProceduralReverb();
    }
  }

  public getAudioData(dataArray: Uint8Array) {
      if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);
      }
  }

  public setVolume(value: number) {
      this.userVolume = Math.max(0, value);
      if (this.masterGain) {
          this.masterGain.gain.setTargetAtTime(this.userVolume, this.context?.currentTime || 0, 0.1);
      }
  }

  public setChimeDensity(value: number) {
      this.chimeDensity = Math.max(0.1, Math.min(3.0, value));
  }

  public setAtmosphere(element: string) {
      // Se l'elemento è lo stesso, non fare nulla (evita reset inutili)
      if (this.currentElement === element) return;

      this.currentElement = element;
      this.updateTexture(element);
      this.morphDronePitch(element); // Cambia intonazione drone
      
      // RESET MELODICO & FEEDBACK ISTANTANEO
      // Quando cambi elemento, resetta l'indice melodico al centro per evitare salti fuori scala
      this.lastNoteIndex = 5;
      
      // Suona immediatamente un chime per dare feedback all'utente
      if (this.chimeTimer) clearTimeout(this.chimeTimer);
      this.playRandomChime();
  }

  // --- REVERB ---
  private createProceduralReverb(): ConvolverNode | null {
      if (!this.context) return null;
      const sampleRate = this.context.sampleRate;
      const length = 4.5; 
      const decay = 2.5;
      const impulse = this.context.createBuffer(2, sampleRate * length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);
      for (let i = 0; i < sampleRate * length; i++) {
          const n = i / (sampleRate * length);
          const alpha = Math.pow(1 - n, decay);
          left[i] = (Math.random() * 2 - 1) * alpha;
          right[i] = (Math.random() * 2 - 1) * alpha;
      }
      const convolver = this.context.createConvolver();
      convolver.buffer = impulse;
      return convolver;
  }

  // --- BROWN NOISE ---
  private createBrownNoise(): AudioBufferSourceNode | null {
    if (!this.context) return null;
    const bufferSize = this.context.sampleRate * 2; 
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; 
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  }

  private randomRange(min: number, max: number): number {
      return Math.random() * (max - min) + min;
  }

  // --- COMPOSITORE ALGORITMICO (WALKER) ---
  private playRandomChime() {
      if (!this.context || !this.isPlaying || !this.reverbNode || !this.compressor) return;
      const t = this.context.currentTime;
      
      // 1. Selezione Scala
      const currentScale = this.scales[this.currentElement] || this.scales['EARTH'];
      
      // 2. Walker Logic (Movimento melodico coerente)
      const maxStep = 2;
      const step = Math.floor(Math.random() * (maxStep * 2 + 1)) - maxStep; 
      let nextIndex = this.lastNoteIndex + step;
      
      // Rimbalzo ai bordi della scala
      if (nextIndex < 0) nextIndex = 1;
      if (nextIndex >= currentScale.length) nextIndex = currentScale.length - 2;
      
      this.lastNoteIndex = nextIndex;
      const freq = currentScale[nextIndex];

      // 3. Sintesi Materica (TIMBRE MAPPING SPECIFICO PER ELEMENTO)
      let material = 'GLASS';
      
      const r = Math.random();
      
      switch (this.currentElement) {
          case 'FIRE':
              // Fuoco: Metallo (brillante), Legno (crepitio)
              if (r < 0.6) material = 'METAL';
              else material = 'WOOD';
              break;
          case 'WATER':
              // Acqua: Vetro (Gocce), Gong (Profondità), Metal (Riflessi)
              if (r < 0.5) material = 'GLASS';
              else if (r < 0.8) material = 'GONG';
              else material = 'METAL';
              break;
          case 'EARTH':
              // Terra: Legno (Solido), Gong (Sismico)
              if (r < 0.7) material = 'WOOD';
              else material = 'GONG';
              break;
          case 'WIND':
              // Vento: Vetro (Campanelli a vento), Legno (Fruscio)
              if (r < 0.6) material = 'GLASS';
              else material = 'WOOD';
              break;
          case 'ETHER':
              // Etere: Vetro e Metallo puro
              if (r < 0.5) material = 'GLASS';
              else material = 'METAL';
              break;
          default:
              material = ['GLASS', 'WOOD', 'METAL'][Math.floor(r * 3)];
      }

      // Boost volume texture per rendere evidente il materiale
      const panner = this.context.createStereoPanner();
      panner.pan.value = this.randomRange(-0.4, 0.4);
      const velocity = this.randomRange(0.7, 1.2); // Aumentato min velocity

      const gain = this.context.createGain();
      gain.connect(panner);
      
      panner.connect(this.reverbNode); 
      if (material !== 'GONG') {
          const dryGain = this.context.createGain();
          dryGain.gain.value = 0.3 * velocity; // Aumentato dry mix
          panner.connect(dryGain);
          dryGain.connect(this.compressor); 
      }

      if (material === 'GLASS') {
          // Sinusoidale pura con vibrato
          const osc = this.context.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          const vibrato = this.context.createOscillator();
          vibrato.frequency.value = 5;
          const vibGain = this.context.createGain();
          vibGain.gain.value = 8;
          vibrato.connect(vibGain);
          vibGain.connect(osc.frequency);
          vibrato.start(t);

          const attack = 0.05;
          const decay = this.randomRange(3.0, 5.0);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2 * velocity, t + attack); 
          gain.gain.exponentialRampToValueAtTime(0.001, t + decay); 

          osc.connect(gain);
          osc.start(t);
          osc.stop(t + decay + 0.5);
          this.oscillators.push(vibrato);

      } else if (material === 'WOOD') {
          // Triangolare filtrata (suono secco)
          const osc = this.context.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = freq;

          const filter = this.context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = freq * 3;
          filter.Q.value = 1;

          const decay = this.randomRange(0.2, 0.4);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.25 * velocity, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

          osc.connect(filter);
          filter.connect(gain);
          osc.start(t);
          osc.stop(t + decay + 0.1);

      } else if (material === 'METAL') {
          // FM Bell-like synthesis
          const fund = this.context.createOscillator();
          fund.type = 'sine';
          fund.frequency.value = freq;
          
          const mod = this.context.createOscillator();
          mod.type = 'square';
          mod.frequency.value = freq * 1.58; // Rapporto inarmonico
          const modGain = this.context.createGain();
          modGain.gain.value = freq * 0.5;

          mod.connect(modGain);
          modGain.connect(fund.frequency);

          const decay = this.randomRange(4.0, 6.0);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15 * velocity, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

          fund.connect(gain);
          mod.start(t);
          fund.start(t);
          fund.stop(t + decay + 0.5);
          mod.stop(t + decay + 0.5);

      } else if (material === 'GONG') {
          // Suono complesso profondo
          const osc1 = this.context.createOscillator();
          osc1.frequency.value = freq;
          const osc2 = this.context.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.value = freq * 1.005; // Battimento
          
          const filter = this.context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, t);
          filter.frequency.linearRampToValueAtTime(600, t + 2); // Swell

          const decay = 10.0;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.35 * velocity, t + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + decay);
          osc2.stop(t + decay);
      }

      // Prossimo chime
      const baseMin = 1500;
      const baseMax = 5000;
      const nextInterval = this.randomRange(baseMin / this.chimeDensity, baseMax / this.chimeDensity); 
      this.chimeTimer = setTimeout(() => this.playRandomChime(), nextInterval);
  }

  // --- BINAURAL DRONE ENGINE ---
  public startDrone() {
    if (this.isPlaying || !this.context || !this.compressor || !this.reverbNode) return;
    if (this.context.state === 'suspended') this.context.resume();

    this.activeDroneOscillators = [];
    this.activePadOscillators = [];

    // Ottieni le frequenze base per l'elemento corrente
    const baseFreqs = this.droneTunings[this.currentElement] || this.droneTunings['EARTH'];

    // 1. DRONE BINAURALE STEREO (THETA WAVES)
    const droneLevels = [
        { freqIdx: 0, vol: 0.15 }, 
        { freqIdx: 1, vol: 0.10 }
    ];

    droneLevels.forEach(d => {
        if (!this.context || !this.reverbNode) return;

        const baseFreq = baseFreqs[d.freqIdx];

        // LEFT EAR
        const oscL = this.context.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.value = baseFreq;
        const panL = this.context.createStereoPanner();
        panL.pan.value = -1; // Hard Left
        const gainL = this.context.createGain();
        gainL.gain.value = d.vol;

        // RIGHT EAR (Binaural Shift)
        const oscR = this.context.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.value = baseFreq + 4; // +4Hz per Theta Waves
        const panR = this.context.createStereoPanner();
        panR.pan.value = 1; // Hard Right
        const gainR = this.context.createGain();
        gainR.gain.value = d.vol;

        oscL.connect(gainL);
        gainL.connect(panL);
        panL.connect(this.compressor!); 

        oscR.connect(gainR);
        gainR.connect(panR);
        panR.connect(this.compressor!);

        oscL.start();
        oscR.start();

        this.oscillators.push(oscL, oscR);
        this.activeDroneOscillators.push({
            left: oscL,
            right: oscR,
            baseIndex: d.freqIdx
        });
    });

    // 2. PAD ETEREO
    this.createPadLayer();

    // 3. TEXTURE FISICA (Noise Synthesis)
    this.noiseNode = this.createBrownNoise();
    if (this.noiseNode && this.reverbNode) {
        this.textureGain = this.context.createGain();
        this.textureGain.gain.value = 0.08; 
        
        this.textureFilter = this.context.createBiquadFilter();
        this.textureFilter.type = 'lowpass';
        this.textureFilter.frequency.value = 200; 

        this.noiseNode.connect(this.textureFilter);
        this.textureFilter.connect(this.textureGain);
        this.textureGain.connect(this.reverbNode);
        
        this.noiseNode.start();
    }

    this.isPlaying = true;
    this.fadeIn();
    
    // Start chiming
    this.chimeTimer = setTimeout(() => this.playRandomChime(), 1000);
  }

  // --- PITCH MORPHING (Realtime Drone Update) ---
  private morphDronePitch(element: string) {
      if (!this.context) return;
      const targetFreqs = this.droneTunings[element] || this.droneTunings['EARTH'];
      const t = this.context.currentTime;
      const duration = 2.0; // Glissando lento di 2 secondi

      // Aggiorna Drone Binaurale
      this.activeDroneOscillators.forEach(d => {
          if (targetFreqs[d.baseIndex]) {
              const target = targetFreqs[d.baseIndex];
              d.left.frequency.exponentialRampToValueAtTime(target, t + duration);
              d.right.frequency.exponentialRampToValueAtTime(target + 4, t + duration); // Mantieni scarto binaurale
          }
      });

      // Aggiorna Pad (Armonizzato al drone)
      this.activePadOscillators.forEach(p => {
         // Calcola rapporto armonico semplice (Ottava + Quinta) basato sulla nuova fondamentale
         const base = targetFreqs[0];
         let target = base * 2; // Ottava
         if (p.baseIndex === 1) target = base * 3; // Quinta sopra ottava
         
         p.osc.frequency.exponentialRampToValueAtTime(target, t + duration);
      });
  }

  private createPadLayer() {
      if (!this.context || !this.reverbNode) return;
      
      const baseFreqs = this.droneTunings[this.currentElement] || this.droneTunings['EARTH'];
      // Armonizza il pad sulla fondamentale dell'elemento: Ottava sopra e Quinta sopra
      const padNotes = [baseFreqs[0] * 2, baseFreqs[0] * 3]; 
      
      padNotes.forEach((freq, idx) => {
         const osc = this.context!.createOscillator();
         osc.type = 'triangle';
         osc.frequency.value = freq;
         
         const lfo = this.context!.createOscillator();
         lfo.frequency.value = 0.1;
         const lfoGain = this.context!.createGain();
         lfoGain.gain.value = 2; 
         lfo.connect(lfoGain);
         lfoGain.connect(osc.frequency);
         
         const filter = this.context!.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.value = 300; 

         const gain = this.context!.createGain();
         gain.gain.value = 0.03; 

         osc.connect(filter);
         filter.connect(gain);
         gain.connect(this.reverbNode!); 

         osc.start();
         lfo.start();
         this.oscillators.push(osc, lfo);
         
         this.activePadOscillators.push({ osc: osc, baseIndex: idx });
      });
  }

  // --- SINTESI FISICA DEGLI ELEMENTI (Update in Realtime) ---
  public updateTexture(element: string) {
      if (!this.context || !this.textureFilter || !this.textureGain) return;

      const t = this.context.currentTime;
      const duration = 1.0; 

      // Reset volume texture base
      let targetGain = 0.08;

      if (this.textureLFO) {
          try { this.textureLFO.stop(); } catch(e) {}
          this.textureLFO = null;
      }

      switch (element) {
          case 'FIRE': 
              targetGain = 0.15; 
              this.textureFilter.type = 'highpass';
              this.textureFilter.frequency.setTargetAtTime(600, t, duration);
              this.textureFilter.Q.value = 1;
              
              this.textureLFO = this.context.createOscillator();
              this.textureLFO.type = 'sawtooth';
              this.textureLFO.frequency.value = 15; 
              const gainMod = this.context.createGain();
              gainMod.gain.value = 0.04; 
              
              this.textureLFO.connect(gainMod);
              gainMod.connect(this.textureGain.gain);
              this.textureLFO.start();
              break;
              
          case 'WATER': 
              targetGain = 0.18; 
              this.textureFilter.type = 'bandpass';
              this.textureFilter.Q.value = 8;
              
              this.textureLFO = this.context.createOscillator();
              this.textureLFO.type = 'sine';
              this.textureLFO.frequency.value = 0.8; 
              const freqMod = this.context.createGain();
              freqMod.gain.value = 400; 
              
              this.textureFilter.frequency.setValueAtTime(450, t);
              this.textureLFO.connect(freqMod);
              freqMod.connect(this.textureFilter.frequency);
              this.textureLFO.start();
              break;

          case 'WIND': 
              targetGain = 0.12;
              this.textureFilter.type = 'bandpass';
              this.textureFilter.Q.value = 1;
              
              this.textureLFO = this.context.createOscillator();
              this.textureLFO.frequency.value = 0.15; 
              const windMod = this.context.createGain();
              windMod.gain.value = 500; 
              
              this.textureFilter.frequency.setValueAtTime(700, t);
              this.textureLFO.connect(windMod);
              windMod.connect(this.textureFilter.frequency);
              this.textureLFO.start();
              break;

          case 'THUNDER': 
              targetGain = 0.20; 
              this.textureFilter.type = 'lowpass';
              this.textureFilter.frequency.setTargetAtTime(80, t, duration);
              this.textureFilter.Q.value = 8; 
              break;

          case 'EARTH': 
              targetGain = 0.10;
              this.textureFilter.type = 'lowpass';
              this.textureFilter.frequency.setTargetAtTime(120, t, duration);
              this.textureFilter.Q.value = 0; 
              break;

          case 'ETHER':
              targetGain = 0.05; 
              this.textureFilter.type = 'highpass';
              this.textureFilter.frequency.setTargetAtTime(1200, t, duration);
              break;

          default:
              this.textureFilter.type = 'lowpass';
              this.textureFilter.frequency.setTargetAtTime(200, t, duration);
              break;
      }
      
      this.textureGain.gain.setTargetAtTime(targetGain, t, 0.5);
  }

  private fadeIn() {
    if (!this.masterGain || !this.context) return;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(this.userVolume, now + 4); 
  }

  private fadeOut(callback: () => void) {
    if (!this.masterGain || !this.context) {
        callback();
        return;
    }
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 2);
    
    setTimeout(() => {
        callback();
    }, 2000);
  }

  public stop() {
    if (!this.isPlaying) return;
    if (this.chimeTimer) {
        clearTimeout(this.chimeTimer);
        this.chimeTimer = null;
    }

    this.fadeOut(() => {
        this.oscillators.forEach(node => {
            if ('stop' in node) try { (node as any).stop(); } catch(e) {}
        });
        if (this.textureLFO) try { this.textureLFO.stop(); } catch(e) {}
        if (this.noiseNode) try { this.noiseNode.stop(); } catch(e) {}
        
        this.oscillators = [];
        this.activeDroneOscillators = [];
        this.activePadOscillators = [];
        this.noiseNode = null;
        this.textureLFO = null;
        this.textureFilter = null;
        this.isPlaying = false;
        this.chimeDensity = 1.0; 
    });
  }

  public toggleMute(muted: boolean) {
    if (!this.masterGain || !this.context) return;
    if (muted) {
        this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.5);
    } else {
        this.masterGain.gain.setTargetAtTime(this.userVolume, this.context.currentTime, 0.5);
        if (this.context.state === 'suspended') this.context.resume();
    }
  }

  public setSystemSuspended(suspend: boolean) {
      if (!this.context || !this.isPlaying) return;
      if (suspend) {
          this.context.suspend();
          this.isSystemSuspended = true;
      } else {
          this.context.resume();
          this.isSystemSuspended = false;
      }
  }
}

export const audioManager = new AudioEngine();
