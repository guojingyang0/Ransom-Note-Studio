
export interface CharacterStyle {
  id: string;
  char: string;
  fontFamily: string;
  backgroundColor: string;
  color: string;
  rotation: number;
  scale: number;
  padding: number;
  borderRadius: string;
  borderWidth: number;
  borderColor: string;
  zIndex: number;
  texture?: 'grain' | 'paper' | 'none'; 
}

export interface ColorPair {
  bg: string;
  text: string;
}

export interface PresetConfig {
  mode: 'preset' | 'ai'; // Mutually exclusive modes
  
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
