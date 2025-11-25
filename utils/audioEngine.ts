
// Motore Audio Procedurale per Oracle Genius (Master Level)
// Features: Binaural Theta Waves (Ramp Down), Isochronic Tones, Algorithmic Melodic Walker, Modal Scales (432Hz), Physical Texture Synthesis

type AudioMode = 'ORACLE' | 'MEDITATION';

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null; 
  private reverbNode: ConvolverNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Nodi attivi
  private oscillators: AudioNode[] = []; 
  
  // Trackers specifici per il Pitch Morphing e Binaural Control
  private activeDroneOscillators: { left: OscillatorNode, right: OscillatorNode, baseIndex: number }[] = [];
  private activePadOscillators: { osc: OscillatorNode, baseIndex: number }[] = [];

  // Texture e Noise
  private noiseNode: AudioBufferSourceNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;
  private textureLFO: OscillatorNode | null = null; // LFO specifico per la sintesi fisica (es. crackle fuoco)
  private textureGain: GainNode | null = null;

  // ISOCHRONIC PULSE (Nuovo Layer)
  // Modula il volume della texture per creare un battimento udibile anche senza cuffie
  private isochronicLFO: OscillatorNode | null = null;
  private isochronicGain: GainNode | null = null;

  // Stato
  private isPlaying: boolean = false;
  private isSystemSuspended: boolean = false; 
  private chimeTimer: ReturnType<typeof setTimeout> | null = null;
  private userVolume: number = 1.0; 
  
  // Parametri Manuali
  private chimeDensity: number = 1.0; 
  private currentElement: string = 'EARTH';
  private currentMode: AudioMode = 'MEDITATION'; 

  // Algorithmic Walker State
  private lastNoteIndex: number = 5; 

  // --- TUNING DRONE PER ELEMENTO (Hertz) - A=432Hz BASE ---
  // Frequenze abbassate per effetto "cranial massage" ma udibili
  // Earth A1 (54Hz), Water D2 (72Hz), Fire C2 (64Hz), Wind F2 (85Hz), Ether B1 (60Hz)
  private droneTunings: Record<string, number[]> = {
      'EARTH': [54.00, 81.00], // A1 (432Hz base)
      'WATER': [72.08, 108.00], // D2
      'FIRE': [64.22, 96.33],   // C2
      'WIND': [85.72, 128.58],  // F2
      'ETHER': [60.61, 90.91],  // B1
  };

  // --- SCALE MODALI (Hertz) - A=432Hz BASE ---
  // Ricalcolate con rapporto 0.9818 rispetto allo standard 440Hz
  private scales: Record<string, number[]> = {
      'EARTH': [ // A Minor Pentatonic (432Hz)
          108.00, 128.43, 144.16, 161.82, 192.43, 
          216.00, 256.87, 288.33, 323.63, 384.87, 
          432.00, 513.74, 576.65, 647.27, 769.74,
          864.00
      ],
      'FIRE': [ // C Lydian (432Hz)
          128.43, 144.16, 161.82, 181.63, 192.43, 216.00, 242.45,
          256.87, 288.33, 323.63, 363.27, 384.87, 432.00, 484.90,
          513.74, 576.65, 647.27, 726.54
      ],
      'WATER': [ // D Hirajoshi (432Hz)
          72.08, 81.00, 108.00, 114.42, 144.16,
          144.16, 161.82, 216.00, 228.84, 288.33,
          288.33, 323.63, 432.00, 457.69, 576.65
      ],
      'WIND': [ // F Lydian/Whole Tone (432Hz)
          85.72, 108.00, 128.43, 144.16, 171.44, 192.43,
          171.44, 216.00, 256.87, 288.33, 342.88, 384.87,
          342.88, 432.00, 513.74, 576.65, 685.76
      ],
      'ETHER': [ // B Locrian/Pitagorico (432Hz)
          60.61, 72.08, 85.72, 96.33, 121.23, 144.16,
          121.23, 144.16, 171.44, 192.43, 242.45, 288.33,
          242.45, 288.33, 342.88, 384.87, 484.90, 576.65
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

  public setMode(mode: AudioMode) {
      this.currentMode = mode;
      if (this.isPlaying) {
          this.updateTexture(this.currentElement);
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
      if (this.currentElement === element) return;

      this.currentElement = element;
      this.updateTexture(element);
      this.morphDronePitch(element); 
      
      this.lastNoteIndex = 5;
      
      if (this.currentMode === 'MEDITATION') {
          if (this.chimeTimer) clearTimeout(this.chimeTimer);
          this.playRandomChime();
      }
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
      
      const currentScale = this.scales[this.currentElement] || this.scales['EARTH'];
      
      const maxStep = 2;
      const step = Math.floor(Math.random() * (maxStep * 2 + 1)) - maxStep; 
      let nextIndex = this.lastNoteIndex + step;
      
      if (nextIndex < 0) nextIndex = 1;
      if (nextIndex >= currentScale.length) nextIndex = currentScale.length - 2;
      
      this.lastNoteIndex = nextIndex;
      const freq = currentScale[nextIndex];

      let material = 'GLASS';
      const r = Math.random();
      
      switch (this.currentElement) {
          case 'FIRE':
              if (r < 0.6) material = 'METAL';
              else material = 'WOOD';
              break;
          case 'WATER':
              if (r < 0.5) material = 'GLASS';
              else if (r < 0.8) material = 'GONG';
              else material = 'METAL';
              break;
          case 'EARTH':
              if (r < 0.7) material = 'WOOD';
              else material = 'GONG';
              break;
          case 'WIND':
              if (r < 0.6) material = 'GLASS';
              else material = 'WOOD';
              break;
          case 'ETHER':
              if (r < 0.5) material = 'GLASS';
              else material = 'METAL';
              break;
          default:
              material = ['GLASS', 'WOOD', 'METAL'][Math.floor(r * 3)];
      }

      const panner = this.context.createStereoPanner();
      panner.pan.value = this.randomRange(-0.4, 0.4);
      
      let velocity = this.randomRange(0.7, 1.2); 
      let dryMix = 0.3;

      if (this.currentMode === 'ORACLE') {
          velocity *= 0.4; 
          dryMix = 0.15; 
      }

      const gain = this.context.createGain();
      gain.connect(panner);
      
      panner.connect(this.reverbNode); 
      if (material !== 'GONG') {
          const dryGain = this.context.createGain();
          dryGain.gain.value = dryMix * velocity; 
          panner.connect(dryGain);
          dryGain.connect(this.compressor); 
      }

      // SINTESI STRUMENTI
      if (material === 'GLASS') {
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
          const fund = this.context.createOscillator();
          fund.type = 'sine';
          fund.frequency.value = freq;
          
          const mod = this.context.createOscillator();
          mod.type = 'square';
          mod.frequency.value = freq * 1.58; 
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
          const osc1 = this.context.createOscillator();
          osc1.frequency.value = freq;
          const osc2 = this.context.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.value = freq * 1.005; 
          
          const filter = this.context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, t);
          filter.frequency.linearRampToValueAtTime(600, t + 2); 

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

      let densityMultiplier = this.chimeDensity;
      let extraDelay = 0;
      
      if (this.currentMode === 'ORACLE') {
          densityMultiplier = 0.5; 
          extraDelay = 10000; 
      }

      const baseMin = 1500 + extraDelay;
      const baseMax = 5000 + extraDelay;
      const nextInterval = this.randomRange(baseMin / densityMultiplier, baseMax / densityMultiplier); 
      this.chimeTimer = setTimeout(() => this.playRandomChime(), nextInterval);
  }

  // --- BINAURAL DRONE ENGINE (DEEP DIVE PROTOCOL) ---
  public startDrone() {
    if (this.isPlaying || !this.context || !this.compressor || !this.reverbNode) return;
    if (this.context.state === 'suspended') this.context.resume();

    this.activeDroneOscillators = [];
    this.activePadOscillators = [];
    const t = this.context.currentTime;

    const baseFreqs = this.droneTunings[this.currentElement] || this.droneTunings['EARTH'];
    const volMod = this.currentMode === 'ORACLE' ? 0.7 : 1.0;
    
    // PROTOCOLLO DI INDUZIONE (Ramp-Down)
    // Start: 12Hz (Alpha) -> End: 4Hz (Theta) over 60 seconds
    const startBinaural = 12;
    const endBinaural = 4;
    const rampDuration = 60; 

    const droneLevels = [
        { freqIdx: 0, vol: 0.15 * volMod }, 
        { freqIdx: 1, vol: 0.10 * volMod }
    ];

    droneLevels.forEach(d => {
        if (!this.context || !this.reverbNode) return;

        const baseFreq = baseFreqs[d.freqIdx];

        // LEFT EAR (Base)
        const oscL = this.context.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.value = baseFreq;
        const panL = this.context.createStereoPanner();
        panL.pan.value = -1; 
        const gainL = this.context.createGain();
        gainL.gain.value = d.vol;

        // RIGHT EAR (Base + Binaural Offset)
        const oscR = this.context.createOscillator();
        oscR.type = 'sine';
        
        // Applica Rampa di Induzione
        oscR.frequency.setValueAtTime(baseFreq + startBinaural, t);
        oscR.frequency.linearRampToValueAtTime(baseFreq + endBinaural, t + rampDuration);

        const panR = this.context.createStereoPanner();
        panR.pan.value = 1; 
        const gainR = this.context.createGain();
        gainR.gain.value = d.vol;

        oscL.connect(gainL);
        gainL.connect(panL);
        panL.connect(this.compressor!); 

        oscR.connect(gainR);
        gainR.connect(panR);
        panR.connect(this.compressor!);

        oscL.start(t);
        oscR.start(t);

        this.oscillators.push(oscL, oscR);
        this.activeDroneOscillators.push({
            left: oscL,
            right: oscR,
            baseIndex: d.freqIdx
        });
    });

    // 2. PAD ETEREO
    this.createPadLayer();

    // 3. TEXTURE FISICA + ISOCHRONIC PULSE
    this.noiseNode = this.createBrownNoise();
    if (this.noiseNode && this.reverbNode) {
        this.textureGain = this.context.createGain();
        this.textureGain.gain.value = 0.0; 
        
        // Setup Isochronic Modulation Chain
        // LFO -> IsoGain -> TextureGain.gain
        this.isochronicLFO = this.context.createOscillator();
        this.isochronicLFO.type = 'sine';
        // Sincronizza LFO con la frequenza binaurale (Rampa)
        this.isochronicLFO.frequency.setValueAtTime(startBinaural, t);
        this.isochronicLFO.frequency.linearRampToValueAtTime(endBinaural, t + rampDuration);

        this.isochronicGain = this.context.createGain();
        this.isochronicGain.gain.value = 0.2; // Modulazione sottile (20%)

        this.isochronicLFO.connect(this.isochronicGain);
        // Nota: Connettiamo l'isochronic gain al texture gain DOPO aver settato il valore base in updateTexture

        this.textureFilter = this.context.createBiquadFilter();
        this.textureFilter.type = 'lowpass';
        this.textureFilter.frequency.value = 200; 

        this.noiseNode.connect(this.textureFilter);
        this.textureFilter.connect(this.textureGain);
        this.textureGain.connect(this.reverbNode);
        
        this.noiseNode.start(t);
        this.isochronicLFO.start(t);
    }

    this.isPlaying = true;
    this.fadeIn();
    this.updateTexture(this.currentElement);
    
    this.chimeTimer = setTimeout(() => this.playRandomChime(), 2000);
  }

  // --- PITCH MORPHING (Realtime Drone Update) ---
  private morphDronePitch(element: string) {
      if (!this.context) return;
      const targetFreqs = this.droneTunings[element] || this.droneTunings['EARTH'];
      const t = this.context.currentTime;
      const duration = 2.0; 
      const binauralTarget = 4; // Target fisso a 4Hz post-induzione

      this.activeDroneOscillators.forEach(d => {
          if (targetFreqs[d.baseIndex]) {
              const target = targetFreqs[d.baseIndex];
              d.left.frequency.exponentialRampToValueAtTime(target, t + duration);
              // Mantiene il binaural beat a 4Hz durante il cambio
              d.right.frequency.exponentialRampToValueAtTime(target + binauralTarget, t + duration); 
          }
      });

      this.activePadOscillators.forEach(p => {
         const base = targetFreqs[0];
         let target = base * 2; 
         if (p.baseIndex === 1) target = base * 3; 
         p.osc.frequency.exponentialRampToValueAtTime(target, t + duration);
      });
  }

  private createPadLayer() {
      if (!this.context || !this.reverbNode) return;
      
      const baseFreqs = this.droneTunings[this.currentElement] || this.droneTunings['EARTH'];
      const padNotes = [baseFreqs[0] * 2, baseFreqs[0] * 3]; 
      
      const volMod = this.currentMode === 'ORACLE' ? 0.015 : 0.03;

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
         gain.gain.value = volMod; 

         osc.connect(filter);
         filter.connect(gain);
         gain.connect(this.reverbNode!); 

         osc.start();
         lfo.start();
         this.oscillators.push(osc, lfo);
         
         this.activePadOscillators.push({ osc: osc, baseIndex: idx });
      });
  }

  // --- SINTESI FISICA DEGLI ELEMENTI ---
  public updateTexture(element: string) {
      if (!this.context || !this.textureFilter || !this.textureGain) return;

      const t = this.context.currentTime;
      const duration = 1.0; 
      const modeMultiplier = this.currentMode === 'ORACLE' ? 0.25 : 1.0;

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
              gainMod.gain.value = 0.04 * modeMultiplier; 
              
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
      
      this.textureGain.gain.setTargetAtTime(targetGain * modeMultiplier, t, 0.5);

      // Connetti L'Isochronic LFO al gain della texture per la modulazione ritmica
      if (this.isochronicGain) {
          // Disconnetti prima per evitare connessioni multiple se updateTexture viene chiamato spesso
          try { this.isochronicGain.disconnect(); } catch(e) {} 
          this.isochronicGain.connect(this.textureGain.gain);
      }
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
        if (this.isochronicLFO) try { this.isochronicLFO.stop(); } catch(e) {}
        
        this.oscillators = [];
        this.activeDroneOscillators = [];
        this.activePadOscillators = [];
        this.noiseNode = null;
        this.textureLFO = null;
        this.textureFilter = null;
        this.isochronicLFO = null;
        this.isPlaying = false;
        this.chimeDensity = 1.0; 
        this.currentMode = 'MEDITATION'; 
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
