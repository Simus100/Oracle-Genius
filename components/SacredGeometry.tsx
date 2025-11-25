
import React, { useRef, useEffect } from 'react';
import { audioManager } from '../utils/audioEngine';

interface SacredGeometryProps {
  element: string; // EARTH, WATER, FIRE, WIND, ETHER
  isActive: boolean;
}

// --- TIPI PER I SISTEMI GENERATIVI ---

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    history: {x: number, y: number}[];
    life: number;
}

interface Harmonic {
    freq: number; // Frequenza dell'onda
    amp: number;  // Ampiezza deformazione
    phase: number; // Fase iniziale
    speed: number; // Velocità rotazione
}

interface SpiroParams {
    R: number; // Raggio esterno
    r: number; // Raggio interno
    d: number; // Distanza punto penna
    col: string;
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({ element, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // STATO PROCEDURALE PERSISTENTE (Ref per non triggerare re-render React)
  const systemRef = useRef<{
      particles: Particle[];
      harmonics: Harmonic[];
      spiro: SpiroParams | null;
      seed: number;
  }>({
      particles: [],
      harmonics: [],
      spiro: null,
      seed: Math.random()
  });

  // Inizializza il sistema quando cambia l'elemento
  useEffect(() => {
      const sys = systemRef.current;
      sys.seed = Math.random();
      
      // RESET
      sys.particles = [];
      sys.harmonics = [];
      sys.spiro = null;

      if (element === 'WIND') {
          // Inizializza Particelle
          for (let i = 0; i < 150; i++) {
              sys.particles.push({
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  vx: 0,
                  vy: 0,
                  history: [],
                  life: Math.random()
              });
          }
      } else if (element === 'FIRE') {
          // Inizializza Armoniche per il Noise radiale
          for (let i = 0; i < 8; i++) {
              sys.harmonics.push({
                  freq: Math.floor(Math.random() * 10) + 2,
                  amp: Math.random() * 20 + 5,
                  phase: Math.random() * Math.PI * 2,
                  speed: (Math.random() - 0.5) * 0.05
              });
          }
      } else if (element === 'ETHER') {
          // Inizializza Parametri Spirografo
          sys.spiro = {
              R: 50 + Math.random() * 80,
              r: 10 + Math.random() * 40,
              d: 20 + Math.random() * 60,
              col: `hsl(${200 + Math.random()*60}, 70%, 70%)`
          };
      }

  }, [element]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 64;
    const dataArray = new Uint8Array(bufferLength);
    
    const resize = () => {
        // Usa dimensioni reali del parent per evitare stretching
        canvas.width = canvas.parentElement?.clientWidth || 300;
        canvas.height = canvas.parentElement?.clientHeight || 300;
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const render = () => {
      audioManager.getAudioData(dataArray);
      
      // Calcolo Pulse Audio
      let avgVolume = 0;
      for (let i = 0; i < bufferLength; i++) avgVolume += dataArray[i];
      avgVolume = avgVolume / bufferLength;
      
      // Pulse normalizzato (0.0 - 1.0)
      const pulse = isActive ? (0.1 + (avgVolume / 255) * 1.5) : 0.1;
      const slowPulse = Math.sin(time) * 0.5 + 0.5;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxDim = Math.min(cx, cy);
      
      time += 0.005 + (pulse * 0.005);
      const sys = systemRef.current;

      ctx.save();

      // --- RENDERERS PROCEDURALI ---

      if (element === 'FIRE') {
          ctx.translate(cx, cy);
          // Disegna Blobs Multipli Sovrapposti (Simulazione Fiamma)
          const layers = 3;
          for (let l = 0; l < layers; l++) {
              ctx.beginPath();
              const baseR = 80 + (l * 20) + (pulse * 30);
              const colorAlpha = 0.5 - (l * 0.15);
              
              // Disegna perimetro polare deformato dalle armoniche
              for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
                  let r = baseR;
                  // Somma armoniche
                  sys.harmonics.forEach(h => {
                      r += Math.sin(angle * h.freq + time * 5 + h.phase + (l*10)) * (h.amp * (pulse * 2));
                  });
                  
                  // Aggiungi turbolenza verticale (simil fiamma che sale)
                  const yOffset = Math.sin(angle + time) * 20; 
                  
                  const x = Math.cos(angle) * r;
                  const y = Math.sin(angle) * r - (l * 10) + yOffset; // Shift up layers
                  
                  if (angle === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
              }
              ctx.closePath();
              
              const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseR + 50);
              grad.addColorStop(0, `rgba(255, 200, 0, ${colorAlpha})`);
              grad.addColorStop(0.6, `rgba(255, 80, 0, ${colorAlpha * 0.8})`);
              grad.addColorStop(1, `rgba(150, 0, 0, 0)`);
              
              ctx.fillStyle = grad;
              ctx.fill();
              ctx.strokeStyle = `rgba(255, 100, 50, ${0.3})`;
              ctx.stroke();
          }

      } else if (element === 'WIND') {
          // FLOW FIELD
          // Non trasliamo al centro, lavoriamo coordinate schermo
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + pulse * 0.3})`;
          ctx.lineWidth = 1;

          sys.particles.forEach(p => {
              // Calcolo vettore campo basato sulla posizione
              // Angolo basato su noise trigonometrico pseudo-causale
              const noiseScale = 0.003;
              const angle = (Math.cos(p.x * noiseScale) + Math.sin(p.y * noiseScale + time)) * Math.PI * 2;
              
              const speed = 2 + pulse * 3;
              
              p.vx += Math.cos(angle) * 0.1;
              p.vy += Math.sin(angle) * 0.1;
              
              // Friction
              p.vx *= 0.95;
              p.vy *= 0.95;

              p.x += p.vx * speed;
              p.y += p.vy * speed;

              // Wrap around screen
              if (p.x < 0) p.x = canvas.width;
              if (p.x > canvas.width) p.x = 0;
              if (p.y < 0) p.y = canvas.height;
              if (p.y > canvas.height) p.y = 0;

              // Draw tail
              p.history.push({x: p.x, y: p.y});
              if (p.history.length > 10) p.history.shift();

              ctx.beginPath();
              if (p.history.length > 0) {
                  ctx.moveTo(p.history[0].x, p.history[0].y);
                  for (let i = 1; i < p.history.length; i++) {
                      ctx.lineTo(p.history[i].x, p.history[i].y);
                  }
              }
              ctx.stroke();
          });

      } else if (element === 'ETHER') {
          ctx.translate(cx, cy);
          if (sys.spiro) {
              const { R, r, d } = sys.spiro;
              
              // Modulazione pulsante dei parametri base
              const modR = R + (pulse * 20);
              const modD = d + (Math.sin(time) * 10);
              
              ctx.strokeStyle = `rgba(129, 140, 248, 0.5)`;
              ctx.lineWidth = 1.5;
              
              ctx.beginPath();
              // Disegna l'Epitrocoide completa
              // Risoluzione alta per curve lisce
              const steps = 360 * 2; 
              for (let i = 0; i <= steps; i++) {
                  const tRad = (i * Math.PI) / 180 + (time * 0.5); // Rotazione intera figura
                  
                  // Equazione Epitrocoide
                  const x = (modR + r) * Math.cos(tRad) - modD * Math.cos(((modR + r) / r) * tRad);
                  const y = (modR + r) * Math.sin(tRad) - modD * Math.sin(((modR + r) / r) * tRad);
                  
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
              }
              ctx.stroke();

              // Secondo anello speculare
              ctx.strokeStyle = `rgba(199, 210, 254, 0.2)`;
              ctx.beginPath();
              for (let i = 0; i <= steps; i++) {
                  const tRad = (i * Math.PI) / 180 - (time * 0.5); 
                  const x = (modR + r) * Math.cos(tRad) - (modD * 1.5) * Math.cos(((modR + r) / r) * tRad);
                  const y = (modR + r) * Math.sin(tRad) - (modD * 1.5) * Math.sin(((modR + r) / r) * tRad);
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
              }
              ctx.stroke();
          }

      } else if (element === 'WATER') {
          ctx.translate(cx, cy);
          ctx.lineWidth = 2;
          
          // Curve di Lissajous multiple per creare nodi fluidi
          const waves = 5;
          for (let j = 0; j < waves; j++) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 + (j/waves)*0.3 + pulse * 0.2})`; // Cyan gradient
              
              const freqX = 3 + j * 0.5;
              const freqY = 2 + j * 0.2;
              const phase = (j * Math.PI / waves) + time;
              
              const radius = 100 + (pulse * 40);

              for (let i = 0; i <= 360; i++) {
                  const rad = (i * Math.PI) / 180;
                  
                  // Lissajous 3D projection-ish
                  const x = Math.sin(rad * freqX + time) * radius;
                  const y = Math.cos(rad * freqY + phase) * radius;
                  
                  // Deformazione aggiuntiva
                  const xDef = x + Math.sin(y * 0.05 + time) * 20;
                  
                  if (i===0) ctx.moveTo(xDef, y);
                  else ctx.lineTo(xDef, y);
              }
              ctx.stroke();
          }

      } else if (element === 'EARTH') {
          ctx.translate(cx, cy);
          // Frattale Esagonale Ricorsivo
          const drawHex = (rad: number, depth: number) => {
              if (depth <= 0) return;
              
              ctx.beginPath();
              ctx.strokeStyle = `rgba(180, 83, 9, ${0.2 + (depth/4) * 0.5})`;
              ctx.lineWidth = depth;
              
              for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI / 3) + (time * (depth % 2 === 0 ? 0.1 : -0.1));
                  const x = Math.cos(angle) * rad;
                  const y = Math.sin(angle) * rad;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.stroke();

              // Ricorsione
              if (rad > 20) {
                  drawHex(rad * 0.7 + (pulse * 5), depth - 1);
              }
          };

          const startRad = 150 + (pulse * 20);
          drawHex(startRad, 5);
          
          // Elementi centrali stabili (Terra solida)
          ctx.fillStyle = 'rgba(217, 119, 6, 0.8)';
          ctx.beginPath();
          ctx.arc(0, 0, 5 + pulse * 5, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationRef.current);
    };
  }, [element, isActive]);

  return (
    <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-60 mix-blend-screen"
    />
  );
};

export default SacredGeometry;
