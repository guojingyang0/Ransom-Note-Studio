
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterStyle, PresetConfig, Language } from './types';
import { FONTS, PALETTES, INITIAL_TEXT, TRANSLATIONS, STYLE_PACKS } from './constants';
import StyleControls from './components/StyleControls';
import { generateStyleAndContent } from './services/geminiService';

export default function App() {
  const [lang, setLang] = useState<Language>('zh'); 
  const t = TRANSLATIONS[lang];

  const [text, setText] = useState(INITIAL_TEXT);
  const [styles, setStyles] = useState<CharacterStyle[]>([]);
  
  // Initial config
  const [config, setConfig] = useState<PresetConfig>({
    mode: 'preset',
    chaosLevel: 50,
    fontVariance: 80,
    colorVibrancy: 'retro',
    textureMode: 'grain',
    customPalette: [],
    selectedPackId: 'redacted' // Default pack
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Helpers
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

  // --- Shape Generators ---
  
  // Generates a jagged polygon (for torn paper effect)
  // Returns points in 0-1 normalized range
  const generateJaggedShape = (): {x: number, y: number}[] => {
    const points = [];
    const segments = 10;
    
    // Top edge (0,0 -> 1,0)
    for(let i=0; i<=segments; i++) points.push({x: i/segments, y: random(-0.05, 0.05)});
    // Right edge (1,0 -> 1,1)
    for(let i=1; i<=segments; i++) points.push({x: 1 + random(-0.05, 0.05), y: i/segments});
    // Bottom edge (1,1 -> 0,1)
    for(let i=segments-1; i>=0; i--) points.push({x: i/segments, y: 1 + random(-0.05, 0.05)});
    // Left edge (0,1 -> 0,0)
    for(let i=segments-1; i>0; i--) points.push({x: random(-0.05, 0.05), y: i/segments});

    return points;
  };

  // Generates geometric cutouts (trapezoids, cut corners)
  const generateGeometricShape = (): {x: number, y: number}[] => {
    const type = randomInt(0, 2);
    if(type === 0) { // Cut corner TL
       return [{x: 0.2, y:0}, {x:1, y:0}, {x:1, y:1}, {x:0, y:1}, {x:0, y:0.2}];
    }
    if(type === 1) { // Trapezoid
       return [{x: 0.1, y:0}, {x:0.9, y:0}, {x:1, y:1}, {x:0, y:1}];
    }
    // Hex-ish
    return [{x:0.1,y:0}, {x:0.9,y:0}, {x:1,y:0.5}, {x:0.9,y:1}, {x:0.1,y:1}, {x:0,y:0.5}];
  };

  const pointsToPolygon = (points: {x: number, y: number}[]) => {
    return `polygon(${points.map(p => `${p.x * 100}% ${p.y * 100}%`).join(', ')})`;
  };

  // Core logic: Generate style for a single character based on config
  const createCharStyle = useCallback((char: string, index: number): CharacterStyle => {
    if (char === '\n') {
        return {
            id: `char-${index}-${Date.now()}`,
            char: '\n',
            fontFamily: '',
            backgroundColor: '',
            color: '',
            rotation: 0,
            scale: 1,
            padding: 0,
            borderRadius: '',
            borderWidth: 0,
            borderColor: '',
            zIndex: 0
        };
    }

    // Handle Space
    if (char === ' ') {
         return {
            id: `char-${index}-${Date.now()}`,
            char: ' ',
            fontFamily: 'sans-serif',
            backgroundColor: 'transparent',
            color: 'transparent',
            rotation: 0,
            scale: 1,
            padding: 12,
            borderRadius: '',
            borderWidth: 0,
            borderColor: 'transparent',
            zIndex: 0,
            texture: 'none'
        };
    }

    let bg, textColor, fontFamily;
    let rotation = 0;
    let scale = 1;
    let shapePoints = undefined;
    let borderRadius = '';
    let borderWidth = 0;
    let bgCss = undefined;
    let texture: 'grain' | 'paper' | 'none' = 'none';
    let packId = undefined;

    // --- MODE: PACK ---
    if (config.mode === 'pack' && config.selectedPackId) {
        const pack = STYLE_PACKS[config.selectedPackId];
        if (pack) {
            packId = pack.id;
            // Pick colors from pack
            const colorPair = pack.colors[randomInt(0, pack.colors.length - 1)];
            bg = colorPair.bg;
            textColor = colorPair.text;
            
            // Pick font
            fontFamily = pack.fontOptions[randomInt(0, pack.fontOptions.length - 1)];
            
            // Background Logic
            if (pack.bgType === 'stripes') {
                bgCss = `repeating-linear-gradient(45deg, ${bg}, ${bg} 10px, #000 10px, #000 20px)`;
            } else if (pack.bgType === 'gradient') {
                bgCss = `linear-gradient(135deg, ${bg}, ${textColor === '#FFFF00' ? '#00FFFF' : '#ffffff'})`;
            } else {
                bgCss = bg;
            }

            // Shape Logic
            if (pack.shape === 'jagged') {
                shapePoints = generateJaggedShape();
            } else if (pack.shape === 'geometric') {
                shapePoints = generateGeometricShape();
            } else if (pack.shape === 'circle') {
                borderRadius = '50%';
            } else {
                borderRadius = '0px';
            }
            
            // Chaos (Packs are usually a bit cleaner than pure chaos mode, but still cutouts)
            rotation = random(-5, 5);
            scale = random(0.95, 1.05);
            
            // Texture
            if(pack.bgType === 'noise') texture = 'paper';
        }
    } 
    // --- MODE: PRESET / AI ---
    else {
        // ... (Existing logic for Preset/AI)
        if (config.mode === 'ai' && config.customPalette.length > 0) {
            const pair = config.customPalette[randomInt(0, config.customPalette.length - 1)];
            bg = pair.bg;
            textColor = pair.text;
        } else {
            const palette = PALETTES[config.colorVibrancy];
            const colors = palette[randomInt(0, palette.length - 1)];
            bg = colors.bg;
            textColor = colors.text;
        }
        
        const rotationFactor = config.chaosLevel / 100;
        const maxRot = 25 * rotationFactor;
        
        const fontIndexLimit = Math.max(1, Math.floor(FONTS.length * (config.fontVariance / 100)));
        fontFamily = FONTS[randomInt(0, fontIndexLimit - 1)];

        if (config.textureMode === 'mixed') {
           const r = random(0, 1);
           if (r < 0.4) texture = 'grain';
           else if (r < 0.8) texture = 'paper';
           else texture = 'none';
        } else {
           texture = config.textureMode as 'grain' | 'paper' | 'none';
        }

        rotation = random(-maxRot, maxRot);
        scale = random(0.9, 1.0 + (config.chaosLevel / 500));
        borderRadius = random(0, 1) > 0.5 ? '2px' : '0px';
        borderWidth = random(0, 1) > 0.8 ? randomInt(1, 3) : 0;
    }

    return {
      id: `char-${index}-${Date.now()}`,
      char,
      fontFamily: fontFamily || 'sans-serif',
      backgroundColor: bg || '#000',
      backgroundCss: bgCss,
      color: textColor || '#fff',
      rotation,
      scale, 
      padding: randomInt(10, 20),
      borderRadius,
      borderWidth,
      borderColor: 'rgba(0,0,0,0.3)',
      zIndex: randomInt(1, 10),
      texture,
      shapePoints,
      packId
    };
  }, [config]);

  // Generate styles for entire string
  const regenerateStyles = useCallback((currentText: string) => {
    const newStyles = currentText.split('').map((char, i) => createCharStyle(char, i));
    setStyles(newStyles);
  }, [createCharStyle]);

  // Re-generate when styles/config change
  useEffect(() => {
    regenerateStyles(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.chaosLevel, config.colorVibrancy, config.fontVariance, config.mode, config.customPalette, config.textureMode, config.selectedPackId]); 

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value; 
    setText(newText);
    
    if (newText.length > text.length && newText.startsWith(text)) {
       const char = newText[newText.length - 1];
       setStyles(prev => [...prev, createCharStyle(char, newText.length - 1)]);
    } else {
       regenerateStyles(newText);
    }
  };

  const handleShuffle = () => {
    regenerateStyles(text);
  };

  const handleAIGenerate = async (promptInput: string, includeText: boolean) => {
    setIsGenerating(true);
    try {
      const result = await generateStyleAndContent(promptInput, includeText);
      if (result.text && includeText) {
         setText(result.text);
      }
      setConfig(prev => ({
         ...prev,
         mode: 'ai',
         customPalette: result.palette,
         chaosLevel: result.chaosLevel,
         fontVariance: result.fontVariance,
         textureMode: result.textureMode || 'grain'
      }));

    } catch (e: any) {
      console.error(e);
      alert(e.message || "An error occurred while generating style.");
    } finally {
      setIsGenerating(false);
    }
  };

  const createTexturePattern = (ctx: CanvasRenderingContext2D, type: 'grain' | 'paper') => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const pCtx = canvas.getContext('2d');
    if (!pCtx) return null;

    const imageData = pCtx.createImageData(size, size);
    const data = imageData.data;

    if (type === 'grain') {
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() * 255;
        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        data[i + 3] = 40;  
      }
    } else if (type === 'paper') {
       for (let i = 0; i < data.length; i += 4) {
         const r = Math.random();
         if (r > 0.98) {
           data[i] = 80; data[i + 1] = 70; data[i + 2] = 60; data[i + 3] = 60;
         } else if (r < 0.02) {
           data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 60;
         } else {
           data[i + 3] = 0;
         }
       }
    }

    pCtx.putImageData(imageData, 0, 0);
    return ctx.createPattern(canvas, 'repeat');
  };

  // Helper to draw specific pack background patterns on Canvas
  const drawPackBackground = (ctx: CanvasRenderingContext2D, style: CharacterStyle, width: number, height: number) => {
     if (style.packId === 'industrial') {
        // Draw stripes
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(-width/2, -height/2, width, height);
        
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        for(let i = -width; i < width; i+=20) {
            ctx.moveTo(i, -height/2);
            ctx.lineTo(i + height, height/2);
        }
        ctx.stroke();
     } 
     else if (style.packId === 'acid') {
         const grad = ctx.createLinearGradient(-width/2, -height/2, width/2, height/2);
         grad.addColorStop(0, style.backgroundColor);
         grad.addColorStop(1, style.color === '#FFFF00' ? '#00FFFF' : '#FFFFFF');
         ctx.fillStyle = grad;
         ctx.fillRect(-width/2, -height/2, width, height);
     }
     else {
         // Default solid
         ctx.fillStyle = style.backgroundColor;
         ctx.fillRect(-width/2, -height/2, width, height);
     }
  };

  // --- Canvas Rendering Logic ---
  const drawToCanvas = async (isExport = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isExport) {
        await document.fonts.ready;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const grainPattern = createTexturePattern(ctx, 'grain');
    const paperPattern = createTexturePattern(ctx, 'paper');

    const startX = 50;
    let startY = 150;
    let currentX = startX;
    const lineHeight = 160; 
    const maxWidth = 1800;

    styles.forEach((style) => {
      if (style.char === '\n') {
        currentX = startX;
        startY += lineHeight;
        return;
      }

      ctx.save();
      ctx.font = style.fontFamily ? `60px "${style.fontFamily}"` : '60px sans-serif';
      const textMetrics = ctx.measureText(style.char);
      const charWidth = textMetrics.width;
      const boxPadding = style.padding * 2;
      const boxWidth = charWidth + boxPadding;
      const boxHeight = 110; // Slightly taller for shapes
      
      if (currentX + boxWidth > maxWidth) {
          currentX = startX;
          startY += lineHeight;
      }

      if (style.char === ' ') {
          currentX += boxWidth;
          ctx.restore();
          return;
      }

      const xPos = currentX + boxWidth / 2;
      const yPos = startY;
      
      ctx.translate(xPos, yPos);
      ctx.rotate((style.rotation * Math.PI) / 180);
      ctx.scale(style.scale, style.scale);
      
      // Shadow (Only if not a complex pack shape, usually hard to shadow complex clips cheaply)
      // We will skip shadow for complex clips for simplicity or fake it
      if (!style.shapePoints) {
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
      }

      // --- Shape Clipping ---
      if (style.shapePoints) {
          ctx.beginPath();
          const first = style.shapePoints[0];
          // Map normalized 0-1 points to -w/2 to w/2 coordinate space
          const mapX = (v: number) => (v * boxWidth) - (boxWidth/2);
          const mapY = (v: number) => (v * boxHeight) - (boxHeight/2);
          
          ctx.moveTo(mapX(first.x), mapY(first.y));
          for(let i=1; i<style.shapePoints.length; i++) {
              ctx.lineTo(mapX(style.shapePoints[i].x), mapY(style.shapePoints[i].y));
          }
          ctx.closePath();
          ctx.clip(); // Restrict drawing to this shape
      }

      // Background Drawing
      if (style.packId) {
          drawPackBackground(ctx, style, boxWidth, boxHeight);
      } else {
          // Standard Preset Background
          ctx.fillStyle = style.backgroundColor;
          if (style.borderRadius !== '0px' && !style.shapePoints) {
            ctx.beginPath();
            ctx.roundRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 4);
            ctx.fill();
          } else {
            ctx.fillRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight);
          }
      }

      // Reset Shadow
      ctx.shadowColor = "transparent";

      // Texture Overlay
      if (style.texture === 'grain' && grainPattern) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = grainPattern;
          ctx.globalAlpha = 0.2;
          ctx.fillRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
      } else if (style.texture === 'paper' && paperPattern) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = paperPattern;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
      }

      // Border
      if (style.borderWidth > 0 && !style.shapePoints) { // Don't border complex shapes for now
        ctx.lineWidth = style.borderWidth;
        ctx.strokeStyle = style.borderColor;
        ctx.strokeRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight);
      }

      // Text
      ctx.fillStyle = style.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(style.char, 0, 5);

      ctx.restore();
      currentX += boxWidth + 15;
    });
  };

  const handleDownload = async () => {
    try {
      await drawToCanvas(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `cutout-collage-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  useEffect(() => {
      const t = setTimeout(() => drawToCanvas(false), 500);
      return () => clearTimeout(t);
  }, [styles]);

  const renderLines = () => {
      const lines: CharacterStyle[][] = [];
      let currentLine: CharacterStyle[] = [];
      styles.forEach(s => {
          if (s.char === '\n') {
              lines.push(currentLine);
              currentLine = [];
          } else {
              currentLine.push(s);
          }
      });
      if (currentLine.length > 0) lines.push(currentLine);
      if (lines.length === 0 && styles.length === 0) return [];
      if (lines.length === 0 && styles.length > 0) return [styles]; 
      return lines;
  };
  const lines = renderLines();

  const getTextureClass = (tex?: string) => {
    if (tex === 'grain') return "mix-blend-multiply opacity-20 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]";
    if (tex === 'paper') return "mix-blend-multiply opacity-40 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]";
    return "";
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#1A1A1A] p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-black p-2 rounded-lg transform -rotate-3 font-['Black_Ops_One'] text-xl">
            RANSOM
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white">{t.appTitle}</h1>
            <span className="text-xs text-gray-400">{t.subtitle}</span>
          </div>
        </div>
        <div className="flex gap-4">
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-gray-300 self-center hidden sm:block">
             {t.poweredBy}
           </a>
           <button 
             onClick={handleDownload}
             className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             {t.exportPNG}
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 p-6 bg-[#18181b] border-r border-gray-800 overflow-y-auto flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.sourceText}</label>
            <textarea
              value={text}
              onChange={handleTextChange}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none font-mono text-lg"
              rows={4}
              placeholder={t.placeholder}
            />
          </div>
          
          <StyleControls 
            config={config} 
            setConfig={setConfig} 
            onGenerateAI={handleAIGenerate}
            isGenerating={isGenerating}
            onShuffle={handleShuffle}
            lang={lang}
            setLang={setLang}
          />
        </aside>

        {/* Canvas Area */}
        <section className="flex-1 relative flex flex-col bg-[#202023] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="flex flex-col justify-center items-center gap-6 p-10 border-2 border-dashed border-gray-700 rounded-xl min-h-[300px]">
              {lines.length === 0 && (
                <span className="text-gray-600 font-mono">{t.startTyping}</span>
              )}
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex flex-wrap justify-center items-center gap-2">
                    {line.map((style) => (
                        <div
                        key={style.id}
                        className="relative group select-none transition-transform hover:scale-110 duration-200 cursor-grab active:cursor-grabbing"
                        style={{
                            fontFamily: style.fontFamily,
                            background: style.backgroundCss || style.backgroundColor, // Use complex CSS if available
                            color: style.color,
                            transform: `rotate(${style.rotation}deg) scale(${style.scale})`,
                            padding: `${style.padding}px ${style.padding * 1.5}px`,
                            borderRadius: style.borderRadius,
                            border: style.borderWidth > 0 ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
                            zIndex: style.zIndex,
                            boxShadow: style.char === ' ' ? 'none' : '4px 4px 0px rgba(0,0,0,0.2)',
                            clipPath: style.shapePoints ? pointsToPolygon(style.shapePoints) : 'none'
                        }}
                        >
                        <span className="text-5xl md:text-7xl leading-none block relative z-10">
                            {style.char === ' ' ? '\u00A0' : style.char}
                        </span>
                        
                        {style.texture !== 'none' && style.char !== ' ' && (
                           <div className={getTextureClass(style.texture)}></div>
                        )}

                        {style.char !== ' ' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                        )}
                        </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
          
          <canvas ref={canvasRef} width={1920} height={1080} className="hidden" />
          
          <div className="bg-[#1A1A1A] text-gray-500 text-xs p-2 text-center border-t border-gray-800">
             {t.footer}
          </div>
        </section>
      </main>
    </div>
  );
}
