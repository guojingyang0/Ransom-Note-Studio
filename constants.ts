
import { StylePack } from './types';

export const FONTS = [
  'Anton',
  'Bangers',
  'Courier Prime',
  'Permanent Marker',
  'Lobster',
  'Abril Fatface',
  'Rubik Glitch',
  'Special Elite',
  'Black Ops One',
  'Righteous',
  'Ultra',
  'VT323',
  'Gloria Hallelujah',
  'Indie Flower',
  'Monoton'
];

export const STYLE_PACKS: Record<string, StylePack> = {
  'redacted': {
    id: 'redacted',
    label: 'Redacted',
    description: 'Top Secret classified documents style.',
    fontOptions: ['Courier Prime', 'Special Elite', 'VT323'],
    colors: [{ bg: '#111111', text: '#F0F0F0' }],
    bgType: 'solid',
    shape: 'rect'
  },
  'industrial': {
    id: 'industrial',
    label: 'Industrial',
    description: 'Hazard stripes and brutalist typography.',
    fontOptions: ['Black Ops One', 'Anton', 'Rubik Glitch'],
    colors: [{ bg: '#FACC15', text: '#000000' }], // Yellow/Black
    bgType: 'lines',
    shape: 'geometric'
  },
  'popart': {
    id: 'popart',
    label: 'Pop Art',
    description: 'Retro comic book dots and vibrant colors.',
    fontOptions: ['Bangers', 'Ultra', 'Righteous'],
    colors: [
      { bg: '#FFFFFF', text: '#FF0000' }, 
      { bg: '#FFE4E1', text: '#0000FF' },
      { bg: '#E0FFFF', text: '#FF1493' }
    ],
    bgType: 'dots',
    shape: 'circle'
  },
  'blueprint': {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'Engineering grid and technical lettering.',
    fontOptions: ['VT323', 'Courier Prime'],
    colors: [{ bg: '#1E90FF', text: '#FFFFFF' }],
    bgType: 'grid',
    shape: 'rect'
  },
  'scrapbook': {
    id: 'scrapbook',
    label: 'Scrapbook',
    description: 'Torn paper edges and handwritten notes.',
    fontOptions: ['Indie Flower', 'Gloria Hallelujah', 'Permanent Marker'],
    colors: [
      { bg: '#fdf6e3', text: '#2c3e50' }, // Off-white
      { bg: '#eee8d5', text: '#2c3e50' },
      { bg: '#e0dcd3', text: '#000000' }
    ],
    bgType: 'noise',
    shape: 'jagged'
  },
  'acid': {
    id: 'acid',
    label: 'Acid Rave',
    description: 'Trippy gradients and bold shapes.',
    fontOptions: ['Rubik Glitch', 'Monoton', 'Righteous'],
    colors: [{ bg: '#FF00FF', text: '#FFFF00' }], // Neon
    bgType: 'gradient',
    shape: 'circle' // or geometric
  }
};

export const PALETTES = {
  bw: [
    { bg: '#000000', text: '#FFFFFF' },
    { bg: '#FFFFFF', text: '#000000' },
    { bg: '#1A1A1A', text: '#F0F0F0' },
    { bg: '#F0F0F0', text: '#1A1A1A' },
  ],
  retro: [
    { bg: '#E63946', text: '#F1FAEE' },
    { bg: '#F1FAEE', text: '#1D3557' },
    { bg: '#A8DADC', text: '#1D3557' },
    { bg: '#457B9D', text: '#F1FAEE' },
    { bg: '#1D3557', text: '#F1FAEE' },
    { bg: '#D4A373', text: '#FAEDCD' },
    { bg: '#FAEDCD', text: '#D4A373' },
  ],
  neon: [
    { bg: '#FF00FF', text: '#00FFFF' },
    { bg: '#00FFFF', text: '#000000' },
    { bg: '#FFFF00', text: '#000000' },
    { bg: '#00FF00', text: '#000000' },
    { bg: '#111111', text: '#FF00FF' },
  ],
  pastel: [
    { bg: '#FFB3BA', text: '#555555' },
    { bg: '#FFDFBA', text: '#555555' },
    { bg: '#FFFFBA', text: '#555555' },
    { bg: '#BAFFC9', text: '#555555' },
    { bg: '#BAE1FF', text: '#555555' },
  ]
};

export const INITIAL_TEXT = "CUTOUT\nCOLLAGE";

export const TRANSLATIONS = {
  en: {
    appTitle: "Cutout Studio",
    subtitle: "Ransom Note Generator",
    sourceText: "Source Text",
    placeholder: "TYPE SOMETHING...",
    
    // Tabs
    tabPreset: "Manual Presets",
    tabAI: "AI Match",
    tabPack: "Style Packs",
    
    // Preset Mode
    styleSettings: "Manual Controls",
    styleDesc: "Select a palette and adjust parameters.",
    palette: "Palette",
    texture: "Texture",
    chaosLevel: "Chaos Level",
    fontVariance: "Font Variance",
    reshuffle: "Re-Shuffle Layout",
    
    // Pack Mode
    packDesc: "Choose a curated design pack. Fonts, shapes, and textures are unified.",
    selectPack: "Select Pack",

    // AI Mode
    aiDesc: "Describe a brand, movie, or aesthetic. AI will generate the colors and vibe.",
    aiPromptLabel: "Style / Brand Prompt",
    aiPromptPlaceholder: "e.g. Starbucks, Cyberpunk 2077, Barbie, IKEA...",
    generateBtn: "Generate Style",
    generating: "Analyzing...",
    includeText: "Also rewrite text?",
    finetuneTitle: "Fine-tune Results",
    
    // Export
    exportPNG: "PNG",
    exportSVG: "SVG",
    exportSize: "Size",
    width: "W",
    height: "H",
    
    poweredBy: "Powered by Gemini",
    modes: {
      bw: "B&W",
      retro: "RETRO",
      neon: "NEON",
      pastel: "PASTEL"
    },
    textures: {
      none: "None",
      grain: "Grain",
      paper: "Paper",
      mixed: "Mixed",
      fabric: "Fabric",
      grunge: "Grunge",
      concrete: "Concrete"
    },
    footer: "Drag text characters to rearrange (Visual only) • Characters rendered using CSS & Google Fonts • Export uses HTML5 Canvas",
    startTyping: "Start typing to generate collage..."
  },
  zh: {
    appTitle: "剪报拼贴",
    subtitle: "拼贴字生成器",
    sourceText: "源文本",
    placeholder: "输入文字...",
    
    // Tabs
    tabPreset: "手动预设",
    tabAI: "AI 定制",
    tabPack: "字族风格",
    
    // Preset Mode
    styleSettings: "参数调节",
    styleDesc: "选择预设配色并微调随机参数。",
    palette: "配色方案",
    texture: "质感",
    chaosLevel: "混乱程度",
    fontVariance: "字体差异",
    reshuffle: "重新随机布局",
    
    // Pack Mode
    packDesc: "选择设计师精选字族。字体、形状和纹理将保持风格统一。",
    selectPack: "选择字族",

    // AI Mode
    aiDesc: "描述一个品牌、电影或审美风格。AI 将自动提取特征色和氛围。",
    aiPromptLabel: "风格 / 品牌提示词",
    aiPromptPlaceholder: "例如：星巴克、赛博朋克、芭比电影、宜家...",
    generateBtn: "生成风格",
    generating: "AI 思考中...",
    includeText: "同时重写文案？",
    finetuneTitle: "微调生成结果",
    
    // Export
    exportPNG: "导出 PNG",
    exportSVG: "导出 SVG",
    exportSize: "画布尺寸",
    width: "宽",
    height: "高",
    
    poweredBy: "由 Gemini 驱动",
    modes: {
      bw: "黑白",
      retro: "复古",
      neon: "霓虹",
      pastel: "粉彩"
    },
    textures: {
      none: "无",
      grain: "颗粒",
      paper: "纸张",
      mixed: "混合",
      fabric: "布料",
      grunge: "脏迹",
      concrete: "水泥"
    },
    footer: "支持拖拽字符 • 使用谷歌字体渲染 • 导出基于 HTML5 Canvas",
    startTyping: "开始输入以生成拼贴画..."
  }
};