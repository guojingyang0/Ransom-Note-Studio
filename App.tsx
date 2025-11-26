
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
  
  const [exportSize, setExportSize] = useState({ w: 1920, h: 1080 });
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Helpers
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

  // --- Shape Generators ---
  
  // Generates a jagged polygon (for torn paper effect)
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

  // Helper for DOM CSS patterns
  const getPatternCss = (type: string, bg: string, fg: string) => {
      switch (type) {
          case 'lines':
              return `repeating-linear-gradient(45deg, ${bg}, ${bg} 10px, ${fg} 10px, ${fg} 20px)`;
          case 'dots':
              return `radial-gradient(circle, ${fg} 2px, transparent 2.5px), ${bg}`;
          case 'grid':
              return `linear-gradient(${fg} 1px, transparent 1px), linear-gradient(90deg, ${fg} 1px, transparent 1px), ${bg}`;
          case 'checker':
              return `repeating-linear-gradient(45deg, ${fg} 25%, transparent 25%, transparent 75%, ${fg} 75%, ${fg}), repeating-linear-gradient(45deg, ${fg} 25%, ${bg} 25%, ${bg} 75%, ${fg} 75%, ${fg})`; 
          case 'gradient':
              return `linear-gradient(135deg, ${bg}, ${fg})`;
          default:
              return bg;
      }
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
    let texture: 'grain' | 'paper' | 'none' | 'fabric' | 'grunge' | 'concrete' = 'none';
    let packId = undefined;
    let bgType = undefined;
    let bgPatternColors = undefined;
    let visualEffect: 'none' | 'shadow' | 'outline' | 'neon' | '3d' = 'none';
    let decoration: 'none' | 'tape' | 'pin' = 'none';
    let decorationColor = undefined;

    // --- MODE: PACK ---
    if (config.mode === 'pack' && config.selectedPackId) {
        const pack = STYLE_PACKS[config.selectedPackId];
        if (pack) {
            packId = pack.id;
            const colorPair = pack.colors[randomInt(0, pack.colors.length - 1)];
            bg = colorPair.bg;
            textColor = colorPair.text;
            
            fontFamily = pack.fontOptions[randomInt(0, pack.fontOptions.length - 1)];
            
            bgType = pack.bgType;
            bgPatternColors = { bg, fg: packId === 'industrial' ? '#000000' : textColor };
            
            if (packId === 'popart') {
                 bgPatternColors.fg = textColor; 
            }
            if (packId === 'blueprint') {
                bgPatternColors.fg = 'rgba(255,255,255,0.3)';
            }

            bgCss = getPatternCss(bgType, bgPatternColors.bg, bgPatternColors.fg);

            if (pack.shape === 'jagged') {
                shapePoints = generateJaggedShape();
            } else if (pack.shape === 'geometric') {
                shapePoints = generateGeometricShape();
            } else if (pack.shape === 'circle') {
                borderRadius = '50%';
            } else {
                borderRadius = '0px';
            }
            
            rotation = random(-5, 5);
            scale = random(0.95, 1.05);
            if(pack.bgType === 'noise') texture = 'paper';
            
            // Assign Preferred Effects
            if (pack.preferredEffect) visualEffect = pack.preferredEffect;
            if (pack.preferredDecoration) decoration = pack.preferredDecoration;
            
            // Random variation within pack
            if (packId === 'scrapbook' && Math.random() > 0.5) decoration = 'none';
        }
    } 
    // --- MODE: PRESET / AI ---
    else {
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
           const modes = ['grain', 'paper', 'fabric', 'grunge', 'concrete', 'none'];
           const r = randomInt(0, modes.length - 1);
           texture = modes[r] as any;
        } else {
           texture = config.textureMode as 'grain' | 'paper' | 'none' | 'fabric' | 'grunge' | 'concrete';
        }

        rotation = random(-maxRot, maxRot);
        scale = random(0.9, 1.0 + (config.chaosLevel / 500));
        borderRadius = random(0, 1) > 0.5 ? '2px' : '0px';
        borderWidth = random(0, 1) > 0.8 ? randomInt(1, 3) : 0;
        
        // Random Effects based on Chaos
        if (config.chaosLevel > 30) {
            const effectRoll = Math.random();
            if (effectRoll > 0.8) visualEffect = 'shadow';
            else if (effectRoll > 0.9) visualEffect = 'outline';
        }
        if (config.chaosLevel > 60) {
             const decRoll = Math.random();
             if (decRoll > 0.85) decoration = 'tape';
             if (decRoll > 0.95) decoration = 'pin';
        }
    }

    // Decor colors
    if (decoration === 'tape') {
        const tapeColors = ['rgba(255,255,255,0.4)', 'rgba(255,255,200,0.5)', 'rgba(255,200,200,0.5)', 'rgba(200,255,200,0.5)'];
        decorationColor = tapeColors[randomInt(0, tapeColors.length-1)];
    }
    if (decoration === 'pin') {
        decorationColor = '#C0C0C0'; // Silver pin
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
      packId,
      bgType,
      bgPatternColors,
      visualEffect,
      decoration,
      decorationColor
    };
  }, [config]);

  // Generate styles for entire string
  const regenerateStyles = useCallback((currentText: string) => {
    const newStyles = currentText.split('').map((char, i) => createCharStyle(char, i));
    setStyles(newStyles);
  }, [createCharStyle]);

  useEffect(() => {
    regenerateStyles(text);
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

  // --- Rendering Helpers ---
  const createTexturePattern = (ctx: CanvasRenderingContext2D, type: 'grain' | 'paper' | 'fabric' | 'grunge' | 'concrete') => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const pCtx = canvas.getContext('2d');
    if (!pCtx) return null;

    const imageData = pCtx.createImageData(size, size);
    const data = imageData.data;

    // ... (Existing texture generation logic same as before, simplified for brevity but keep original implementation)
    // For this update, I will reuse the exact same logic logic as previous step but ensure it's here
    if (type === 'grain') {
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() * 255;
        data[i] = val; data[i + 1] = val; data[i + 2] = val; data[i + 3] = 40;  
      }
    } else if (type === 'paper') {
       for (let i = 0; i < data.length; i += 4) {
         const r = Math.random();
         if (r > 0.98) { data[i] = 80; data[i + 1] = 70; data[i + 2] = 60; data[i + 3] = 60; } 
         else if (r < 0.02) { data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 60; } 
         else { data[i + 3] = 0; }
       }
    } else if (type === 'fabric') {
        for (let i = 0; i < data.length; i += 4) data[i+3] = 0;
        pCtx.putImageData(imageData, 0, 0);
        pCtx.fillStyle = 'rgba(0,0,0,0.15)';
        for(let i=0; i<size; i+=3) { pCtx.fillRect(i, 0, 1, size); pCtx.fillRect(0, i, size, 1); }
        return ctx.createPattern(canvas, 'repeat');
    } else if (type === 'grunge') {
         for (let i = 0; i < data.length; i += 4) data[i+3] = 0;
         pCtx.putImageData(imageData, 0, 0);
         for(let i=0; i<30; i++) {
            const x = Math.random() * size; const y = Math.random() * size;
            const r = Math.random() * 40 + 5;
            pCtx.beginPath(); pCtx.arc(x,y,r,0,Math.PI*2); pCtx.fillStyle=`rgba(0,0,0,${Math.random() * 0.1})`; pCtx.fill();
         }
         return ctx.createPattern(canvas, 'repeat');
    } else if (type === 'concrete') {
        for (let i = 0; i < data.length; i += 4) {
            const val = 100 + Math.random() * 50; 
            data[i] = val; data[i+1] = val; data[i+2] = val; data[i+3] = 40 + Math.random() * 20; 
        }
    }
    pCtx.putImageData(imageData, 0, 0);
    return ctx.createPattern(canvas, 'repeat');
  };

  const createPatternCanvas = (ctx: CanvasRenderingContext2D, type: string, bg: string, fg: string) => {
      const size = 40;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const pCtx = canvas.getContext('2d');
      if (!pCtx) return null;
      pCtx.fillStyle = bg;
      pCtx.fillRect(0, 0, size, size);

      if (type === 'lines') {
          pCtx.strokeStyle = fg; pCtx.lineWidth = 10; pCtx.beginPath();
          pCtx.moveTo(0, size); pCtx.lineTo(size, 0);
          pCtx.moveTo(-10, 10); pCtx.lineTo(10, -10);
          pCtx.moveTo(size-10, size+10); pCtx.lineTo(size+10, size-10);
          pCtx.stroke();
      } 
      else if (type === 'dots') {
          pCtx.fillStyle = fg; pCtx.beginPath(); pCtx.arc(size/2, size/2, 6, 0, Math.PI * 2); pCtx.fill();
          pCtx.beginPath(); pCtx.arc(0, 0, 6, 0, Math.PI * 2); pCtx.fill();
          pCtx.beginPath(); pCtx.arc(size, 0, 6, 0, Math.PI * 2); pCtx.fill();
          pCtx.beginPath(); pCtx.arc(0, size, 6, 0, Math.PI * 2); pCtx.fill();
          pCtx.beginPath(); pCtx.arc(size, size, 6, 0, Math.PI * 2); pCtx.fill();
      }
      else if (type === 'grid') {
          pCtx.strokeStyle = fg; pCtx.lineWidth = 1; pCtx.beginPath();
          pCtx.moveTo(0, 0); pCtx.lineTo(size, 0);
          pCtx.moveTo(0, 0); pCtx.lineTo(0, size);
          pCtx.stroke();
      }
      return ctx.createPattern(canvas, 'repeat');
  };

  const drawPackBackground = (ctx: CanvasRenderingContext2D, style: CharacterStyle, width: number, height: number) => {
     if (style.bgType && style.bgPatternColors && style.bgType !== 'solid') {
         if (style.bgType === 'gradient') {
            const grad = ctx.createLinearGradient(-width/2, -height/2, width/2, height/2);
            grad.addColorStop(0, style.bgPatternColors.bg);
            grad.addColorStop(1, style.bgPatternColors.fg);
            ctx.fillStyle = grad;
            ctx.fillRect(-width/2, -height/2, width, height);
         } else {
            const pattern = createPatternCanvas(ctx, style.bgType, style.bgPatternColors.bg, style.bgPatternColors.fg);
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(-width/2, -height/2, width, height);
            } else {
                ctx.fillStyle = style.backgroundColor;
                ctx.fillRect(-width/2, -height/2, width, height);
            }
         }
     } else {
         ctx.fillStyle = style.backgroundColor;
         ctx.fillRect(-width/2, -height/2, width, height);
     }
  };

  // --- SVG Rendering Logic ---
  const generateSVG = async () => {
    const measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    if (!ctx) return;
    const width = exportSize.w;
    const height = exportSize.h;
    
    const fontImports = `@import url('https://fonts.googleapis.com/css2?family=${FONTS.map(f => f.replace(/ /g, '+')).join('&family=')}&display=swap');`;
    let defs = `<style>${fontImports.replace(/&/g, '&amp;')}</style>`;
    
    const usedPatterns = new Set<string>();
    styles.forEach(s => {
        if (s.bgType && s.bgType !== 'solid' && s.bgPatternColors) {
            usedPatterns.add(JSON.stringify({ type: s.bgType, colors: s.bgPatternColors }));
        }
    });

    usedPatterns.forEach(pStr => {
        const p = JSON.parse(pStr);
        const id = `pat-${p.type}-${p.colors.bg.replace('#','')}-${p.colors.fg.replace('#','')}`;
        if (p.type === 'lines') {
            defs += `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="20" height="20" fill="${p.colors.bg}"/><line x1="0" y1="0" x2="0" y2="20" stroke="${p.colors.fg}" stroke-width="10" stroke-linecap="square"/></pattern>`;
        }
        else if (p.type === 'dots') {
            defs += `<pattern id="${id}" width="15" height="15" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="${p.colors.bg}"/><circle cx="7.5" cy="7.5" r="3" fill="${p.colors.fg}"/></pattern>`;
        }
        else if (p.type === 'grid') {
            defs += `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${p.colors.bg}"/><path d="M 20 0 L 0 0 0 20" fill="none" stroke="${p.colors.fg}" stroke-width="1"/></pattern>`;
        }
        else if (p.type === 'gradient') {
            defs += `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${p.colors.bg}" /><stop offset="100%" stop-color="${p.colors.fg}" /></linearGradient>`;
        }
    });

    let svgContent = '';
    const startX = 50;
    let startY = 150;
    let currentX = startX;
    const lineHeight = 160; 
    const maxWidth = width - 100;

    styles.forEach((style, index) => {
      if (style.char === '\n') { currentX = startX; startY += lineHeight; return; }
      const fontSize = 60;
      ctx.font = style.fontFamily ? `${fontSize}px "${style.fontFamily}"` : `${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(style.char);
      const boxWidth = textMetrics.width + (style.padding * 2);
      const boxHeight = 110;

      if (currentX + boxWidth > maxWidth) { currentX = startX; startY += lineHeight; }
      if (style.char === ' ') { currentX += boxWidth; return; }

      const xPos = currentX + boxWidth / 2;
      const yPos = startY;
      const transform = `translate(${xPos}, ${yPos}) rotate(${style.rotation}) scale(${style.scale})`;

      let fill = style.backgroundColor;
      if (style.bgType && style.bgType !== 'solid' && style.bgPatternColors) {
           const id = `pat-${style.bgType}-${style.bgPatternColors.bg.replace('#','')}-${style.bgPatternColors.fg.replace('#','')}`;
           fill = `url(#${id})`;
      }

      let shapeElement = '';
      if (style.shapePoints) {
          const pointsStr = style.shapePoints.map(p => {
              const px = (p.x * boxWidth) - (boxWidth/2);
              const py = (p.y * boxHeight) - (boxHeight/2);
              return `${px},${py}`;
          }).join(' ');
          shapeElement = `<polygon points="${pointsStr}" fill="${fill}" />`;
      } else {
          const rx = style.borderRadius === '50%' ? '50%' : (parseInt(style.borderRadius) || 0);
          shapeElement = `<rect x="${-boxWidth/2}" y="${-boxHeight/2}" width="${boxWidth}" height="${boxHeight}" rx="${rx}" fill="${fill}" />`;
      }

      // Border (if not geometric)
      let borderElement = '';
      if (style.borderWidth > 0 && !style.shapePoints) {
          borderElement = `<rect x="${-boxWidth/2}" y="${-boxHeight/2}" width="${boxWidth}" height="${boxHeight}" fill="none" stroke="${style.borderColor}" stroke-width="${style.borderWidth}" />`;
      }

      const escapedChar = style.char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Text Effects SVG
      let textGroup = '';
      const textBase = `<text x="0" y="5" font-family="${style.fontFamily || 'sans-serif'}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle"`;
      
      if (style.visualEffect === 'outline') {
          // Stroke + Fill
          textGroup = `${textBase} stroke="black" stroke-width="3" fill="${style.color}">${escapedChar}</text>`;
      } else if (style.visualEffect === '3d') {
          // Layers
          textGroup = `
            ${textBase} fill="rgba(0,0,0,0.5)" transform="translate(4, 4)">${escapedChar}</text>
            ${textBase} fill="rgba(0,0,0,0.5)" transform="translate(2, 2)">${escapedChar}</text>
            ${textBase} fill="${style.color}">${escapedChar}</text>
          `;
      } else if (style.visualEffect === 'neon') {
          textGroup = `
             ${textBase} fill="${style.color}" stroke="${style.color}" stroke-width="2" opacity="0.5" filter="blur(2px)">${escapedChar}</text>
             ${textBase} fill="${style.color}">${escapedChar}</text>
          `;
      } else {
          textGroup = `${textBase} fill="${style.color}">${escapedChar}</text>`;
      }

      // Decoration SVG
      let decoElement = '';
      if (style.decoration === 'tape') {
          decoElement = `<rect x="${-boxWidth/2}" y="${-boxHeight/2 - 10}" width="${boxWidth}" height="20" fill="${style.decorationColor || 'rgba(255,255,255,0.4)'}" transform="rotate(${random(-5, 5)})" />`;
      } else if (style.decoration === 'pin') {
          decoElement = `<circle cx="0" cy="${-boxHeight/2 + 5}" r="4" fill="${style.decorationColor || 'silver'}" stroke="rgba(0,0,0,0.3)" stroke-width="1" />`;
      }

      svgContent += `<g transform="${transform}">${shapeElement}${borderElement}${textGroup}${decoElement}</g>`;
      currentX += boxWidth + 15;
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${svgContent}</svg>`;
  };

  const handleDownloadSVG = async () => {
      try {
          const svgString = await generateSVG();
          if (!svgString) return;
          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `cutout-collage-${Date.now()}.svg`;
          link.click();
      } catch (error) { console.error("SVG Export failed:", error); alert("SVG Export failed."); }
  };

  // --- Canvas Rendering Logic ---
  const drawToCanvas = async (isExport = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isExport) { canvas.width = exportSize.w; canvas.height = exportSize.h; } 
    else { canvas.width = 1920; canvas.height = 1080; }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (isExport) await document.fonts.ready;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Patterns
    const grainPattern = createTexturePattern(ctx, 'grain');
    const paperPattern = createTexturePattern(ctx, 'paper');
    const fabricPattern = createTexturePattern(ctx, 'fabric');
    const grungePattern = createTexturePattern(ctx, 'grunge');
    const concretePattern = createTexturePattern(ctx, 'concrete');

    const startX = 50;
    let startY = 150;
    let currentX = startX;
    const lineHeight = 160; 
    const maxWidth = canvas.width - 100;

    styles.forEach((style) => {
      if (style.char === '\n') { currentX = startX; startY += lineHeight; return; }
      ctx.save();
      ctx.font = style.fontFamily ? `60px "${style.fontFamily}"` : '60px sans-serif';
      const textMetrics = ctx.measureText(style.char);
      const boxWidth = textMetrics.width + (style.padding * 2);
      const boxHeight = 110;
      
      if (currentX + boxWidth > maxWidth) { currentX = startX; startY += lineHeight; }
      if (style.char === ' ') { currentX += boxWidth; ctx.restore(); return; }

      const xPos = currentX + boxWidth / 2;
      const yPos = startY;
      ctx.translate(xPos, yPos);
      ctx.rotate((style.rotation * Math.PI) / 180);
      ctx.scale(style.scale, style.scale);
      
      // Shadow (Drop shadow behind the paper)
      if (!style.shapePoints) {
        ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
      }

      // Shape Clip & Background
      if (style.shapePoints) {
          ctx.beginPath();
          const mapX = (v: number) => (v * boxWidth) - (boxWidth/2);
          const mapY = (v: number) => (v * boxHeight) - (boxHeight/2);
          ctx.moveTo(mapX(style.shapePoints[0].x), mapY(style.shapePoints[0].y));
          for(let i=1; i<style.shapePoints.length; i++) ctx.lineTo(mapX(style.shapePoints[i].x), mapY(style.shapePoints[i].y));
          ctx.closePath();
          ctx.clip(); 
      }
      drawPackBackground(ctx, style, boxWidth, boxHeight);
      ctx.shadowColor = "transparent"; // Reset shadow for text

      // Texture
      let texturePattern = null; let alpha = 1.0;
      if (style.texture === 'grain') { texturePattern = grainPattern; alpha = 0.2; }
      else if (style.texture === 'paper') { texturePattern = paperPattern; alpha = 0.4; }
      else if (style.texture === 'fabric') { texturePattern = fabricPattern; alpha = 0.3; }
      else if (style.texture === 'grunge') { texturePattern = grungePattern; alpha = 0.5; }
      else if (style.texture === 'concrete') { texturePattern = concretePattern; alpha = 0.3; }
      if (texturePattern) {
          ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = texturePattern; ctx.globalAlpha = alpha;
          ctx.fillRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight);
          ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
      }

      // Border
      if (style.borderWidth > 0 && !style.shapePoints) {
        ctx.lineWidth = style.borderWidth; ctx.strokeStyle = style.borderColor; ctx.strokeRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight);
      }

      // --- Text Rendering with Effects ---
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      
      if (style.visualEffect === 'outline') {
          ctx.strokeStyle = '#000000'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
          ctx.strokeText(style.char, 0, 5);
          ctx.fillStyle = style.color;
          ctx.fillText(style.char, 0, 5);
      } else if (style.visualEffect === '3d') {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillText(style.char, 4, 9); // Layer 1
          ctx.fillText(style.char, 2, 7); // Layer 2
          ctx.fillStyle = style.color;
          ctx.fillText(style.char, 0, 5);
      } else if (style.visualEffect === 'neon') {
          ctx.shadowBlur = 10; ctx.shadowColor = style.color;
          ctx.fillStyle = style.color;
          ctx.fillText(style.char, 0, 5);
          ctx.shadowBlur = 0; // Reset
      } else {
          ctx.fillStyle = style.color;
          ctx.fillText(style.char, 0, 5);
      }

      // --- Decorations ---
      if (style.decoration === 'tape') {
          ctx.fillStyle = style.decorationColor || 'rgba(255,255,255,0.4)';
          ctx.rotate(random(-0.1, 0.1)); // Slight random tape rotation
          ctx.fillRect(-boxWidth/2, -boxHeight/2 - 10, boxWidth, 20);
      } else if (style.decoration === 'pin') {
          ctx.fillStyle = style.decorationColor || 'silver';
          ctx.beginPath(); ctx.arc(0, -boxHeight/2 + 5, 4, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
      }

      ctx.restore();
      currentX += boxWidth + 15;
    });
  };

  const handleDownloadPNG = async () => {
    try {
      await drawToCanvas(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `cutout-collage-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) { console.error("Export failed:", error); alert("Export failed."); }
  };

  useEffect(() => { const t = setTimeout(() => drawToCanvas(false), 500); return () => clearTimeout(t); }, [styles]);

  const renderLines = () => {
      const lines: CharacterStyle[][] = []; let currentLine: CharacterStyle[] = [];
      styles.forEach(s => { if (s.char === '\n') { lines.push(currentLine); currentLine = []; } else { currentLine.push(s); } });
      if (currentLine.length > 0) lines.push(currentLine);
      return lines.length === 0 && styles.length === 0 ? [] : (lines.length === 0 && styles.length > 0 ? [styles] : lines);
  };
  const lines = renderLines();

  const getTextureClass = (tex?: string) => {
    if (tex === 'grain') return "mix-blend-multiply opacity-20 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]";
    if (tex === 'paper') return "mix-blend-multiply opacity-40 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]";
    if (tex === 'fabric') return "mix-blend-multiply opacity-30 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')]";
    if (tex === 'grunge') return "mix-blend-multiply opacity-50 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]";
    if (tex === 'concrete') return "mix-blend-multiply opacity-30 pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')]";
    return "";
  };

  // DOM Text Styles for effects
  const getTextStyle = (s: CharacterStyle): React.CSSProperties => {
      const base: React.CSSProperties = {
          fontFamily: s.fontFamily,
          color: s.color,
      };
      if (s.visualEffect === 'outline') {
          return { ...base, WebkitTextStroke: '2px black' };
      }
      if (s.visualEffect === '3d') {
          return { ...base, textShadow: '2px 2px 0px rgba(0,0,0,0.5), 4px 4px 0px rgba(0,0,0,0.3)' };
      }
      if (s.visualEffect === 'neon') {
          return { ...base, textShadow: `0 0 10px ${s.color}, 0 0 20px ${s.color}` };
      }
      return base;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 flex flex-col font-sans">
      <header className="border-b border-gray-800 bg-[#1A1A1A] p-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="bg-yellow-400 text-black p-2 rounded-lg transform -rotate-3 font-['Black_Ops_One'] text-xl select-none">
            RANSOM
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white">{t.appTitle}</h1>
            <span className="text-xs text-gray-400">{t.subtitle}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-gray-900/50 p-2 rounded-xl border border-gray-700">
           <div className="flex items-center gap-2 border-r border-gray-700 pr-3">
              <span className="text-[10px] text-gray-500 font-bold uppercase">{t.width}</span>
              <input type="number" value={exportSize.w} onChange={(e) => setExportSize(prev => ({...prev, w: Number(e.target.value)}))} className="w-14 bg-gray-800 border border-gray-600 rounded px-1 text-xs text-white focus:border-yellow-400 outline-none text-center"/>
              <span className="text-[10px] text-gray-500 font-bold uppercase">{t.height}</span>
              <input type="number" value={exportSize.h} onChange={(e) => setExportSize(prev => ({...prev, h: Number(e.target.value)}))} className="w-14 bg-gray-800 border border-gray-600 rounded px-1 text-xs text-white focus:border-yellow-400 outline-none text-center"/>
           </div>
           <div className="flex gap-2">
             <button onClick={handleDownloadSVG} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 border border-gray-600">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> {t.exportSVG}
             </button>
             <button onClick={handleDownloadPNG} className="bg-white hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-[0_0_10px_rgba(255,255,255,0.2)]">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> {t.exportPNG}
             </button>
           </div>
        </div>
        <div className="hidden sm:block">
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-gray-300">{t.poweredBy}</a>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-80 p-6 bg-[#18181b] border-r border-gray-800 overflow-y-auto flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.sourceText}</label>
            <textarea value={text} onChange={handleTextChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none font-mono text-lg" rows={4} placeholder={t.placeholder}/>
          </div>
          <StyleControls config={config} setConfig={setConfig} onGenerateAI={handleAIGenerate} isGenerating={isGenerating} onShuffle={handleShuffle} lang={lang} setLang={setLang} />
        </aside>

        <section className="flex-1 relative flex flex-col bg-[#202023] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="flex flex-col justify-center items-center gap-6 p-10 border-2 border-dashed border-gray-700 rounded-xl min-h-[300px]">
              {lines.length === 0 && <span className="text-gray-600 font-mono">{t.startTyping}</span>}
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex flex-wrap justify-center items-center gap-2">
                    {line.map((style) => (
                        <div
                        key={style.id}
                        className="relative group select-none transition-transform hover:scale-110 duration-200 cursor-grab active:cursor-grabbing"
                        style={{
                            background: style.backgroundCss || style.backgroundColor,
                            transform: `rotate(${style.rotation}deg) scale(${style.scale})`,
                            padding: `${style.padding}px ${style.padding * 1.5}px`,
                            borderRadius: style.borderRadius,
                            border: style.borderWidth > 0 ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
                            zIndex: style.zIndex,
                            boxShadow: style.char === ' ' ? 'none' : '4px 4px 0px rgba(0,0,0,0.2)',
                            clipPath: style.shapePoints ? pointsToPolygon(style.shapePoints) : 'none'
                        }}
                        >
                        {/* Text Layer with Effects */}
                        <span className="text-5xl md:text-7xl leading-none block relative z-10" style={getTextStyle(style)}>
                            {style.char === ' ' ? '\u00A0' : style.char}
                        </span>
                        
                        {/* Tape Decoration */}
                        {style.decoration === 'tape' && style.char !== ' ' && (
                            <div className="absolute top-[-10px] left-0 right-0 h-5 transform -rotate-1 opacity-90 pointer-events-none z-20" 
                                 style={{backgroundColor: style.decorationColor || 'rgba(255,255,255,0.4)'}}></div>
                        )}
                         {/* Pin Decoration */}
                         {style.decoration === 'pin' && style.char !== ' ' && (
                            <div className="absolute top-1 left-1/2 w-2 h-2 rounded-full border border-gray-500 transform -translate-x-1/2 z-20 shadow-sm" 
                                 style={{backgroundColor: style.decorationColor || 'silver'}}></div>
                        )}

                        {style.texture !== 'none' && style.char !== ' ' && <div className={getTextureClass(style.texture)}></div>}
                        {style.char !== ' ' && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>}
                        </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} width={1920} height={1080} className="hidden" />
          <div className="bg-[#1A1A1A] text-gray-500 text-xs p-2 text-center border-t border-gray-800">{t.footer}</div>
        </section>
      </main>
    </div>
  );
}
