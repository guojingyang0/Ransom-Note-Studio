
export interface CharacterStyle {
  id: string;
  char: string;
  fontFamily: string;
  backgroundColor: string;
  backgroundCss?: string; // New: For complex CSS backgrounds (gradients, stripes)
  color: string;
  rotation: number;
  scale: number;
  padding: number;
  borderRadius: string;
  borderWidth: number;
  borderColor: string;
  zIndex: number;
  texture?: 'grain' | 'paper' | 'none';
  // New: For irregular shapes
  shapePoints?: {x: number, y: number}[]; 
  packId?: string; // To identify which renderer to use
}

export interface ColorPair {
  bg: string;
  text: string;
}

export interface StylePack {
  id: string;
  label: string;
  description: string;
  fontOptions: string[];
  colors: { bg: string; text: string }[];
  bgType: 'solid' | 'gradient' | 'stripes' | 'noise';
  shape: 'rect' | 'jagged' | 'geometric' | 'circle';
}

export interface PresetConfig {
  mode: 'preset' | 'ai' | 'pack'; // Added 'pack' mode
  
  // Pack Mode Settings
  selectedPackId?: string;

  // Preset Mode Settings
  chaosLevel: number; 
  fontVariance: number; 
  colorVibrancy: 'bw' | 'retro' | 'neon' | 'pastel';
  textureMode: 'none' | 'grain' | 'paper' | 'mixed';
  
  // AI Mode Settings (Generated)
  customPalette: ColorPair[];
}

export interface GeneratedStyle {
  text?: string;
  mood: string;
  palette: ColorPair[];
  chaosLevel: number;
  fontVariance: number;
  textureMode: 'none' | 'grain' | 'paper' | 'mixed';
}

export type Language = 'en' | 'zh';
