
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
    
    // Preset Mode
    styleSettings: "Manual Controls",
    styleDesc: "Select a palette and adjust parameters.",
    palette: "Palette",
    texture: "Texture",
    chaosLevel: "Chaos Level",
    fontVariance: "Font Variance",
    reshuffle: "Re-Shuffle Layout",
    
    // AI Mode
    aiDesc: "Describe a brand, movie, or aesthetic. AI will generate the colors and vibe.",
    aiPromptLabel: "Style / Brand Prompt",
    aiPromptPlaceholder: "e.g. Starbucks, Cyberpunk 2077, Barbie, IKEA...",
    generateBtn: "Generate Style",
    generating: "Analyzing...",
    includeText: "Also rewrite text?",
    
    exportPNG: "Export PNG",
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
      mixed: "Mixed"
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
    
    // Preset Mode
    styleSettings: "参数调节",
    styleDesc: "选择预设配色并微调随机参数。",
    palette: "配色方案",
    texture: "质感",
    chaosLevel: "混乱程度",
    fontVariance: "字体差异",
    reshuffle: "重新随机布局",
    
    // AI Mode
    aiDesc: "描述一个品牌、电影或审美风格。AI 将自动提取特征色和氛围。",
    aiPromptLabel: "风格 / 品牌提示词",
    aiPromptPlaceholder: "例如：星巴克、赛博朋克、芭比电影、宜家...",
    generateBtn: "生成风格",
    generating: "AI 思考中...",
    includeText: "同时重写文案？",
    
    exportPNG: "导出 PNG",
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
      mixed: "混合"
    },
    footer: "支持拖拽字符 • 使用谷歌字体渲染 • 导出基于 HTML5 Canvas",
    startTyping: "开始输入以生成拼贴画..."
  }
};
