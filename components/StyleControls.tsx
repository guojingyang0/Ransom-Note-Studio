
import React, { useState } from 'react';
import { PresetConfig, Language } from '../types';
import { TRANSLATIONS, STYLE_PACKS } from '../constants';

interface StyleControlsProps {
  config: PresetConfig;
  setConfig: React.Dispatch<React.SetStateAction<PresetConfig>>;
  onGenerateAI: (prompt: string, includeText: boolean) => void;
  isGenerating: boolean;
  onShuffle: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

const StyleControls: React.FC<StyleControlsProps> = ({ 
  config, 
  setConfig, 
  onGenerateAI, 
  isGenerating,
  onShuffle,
  lang,
  setLang
}) => {
  const t = TRANSLATIONS[lang];
  const [aiPrompt, setAiPrompt] = useState('');
  const [includeText, setIncludeText] = useState(false);

  // Switch between modes
  const handleModeSwitch = (mode: 'preset' | 'ai' | 'pack') => {
    setConfig(prev => ({ ...prev, mode }));
  };

  const handlePresetChange = <K extends keyof PresetConfig>(key: K, value: PresetConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value, mode: 'preset' }));
  };

  // Allow changing params without switching mode (for AI fine-tuning)
  const handleParamChange = <K extends keyof PresetConfig>(key: K, value: PresetConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePackSelect = (packId: string) => {
    setConfig(prev => ({ ...prev, mode: 'pack', selectedPackId: packId }));
  }

  const handleAiSubmit = () => {
    if (!aiPrompt.trim()) return;
    onGenerateAI(aiPrompt, includeText);
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg flex flex-col overflow-hidden">
      
      {/* Header / Lang Switch */}
      <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration</span>
        <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
           <button 
             onClick={() => setLang('en')}
             className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             EN
           </button>
           <button 
             onClick={() => setLang('zh')}
             className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'zh' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
           >
             中文
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => handleModeSwitch('preset')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${
            config.mode === 'preset' 
              ? 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-400' 
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          {t.tabPreset}
        </button>
        <button
          onClick={() => handleModeSwitch('pack')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${
            config.mode === 'pack' 
              ? 'bg-gray-800 text-green-400 border-b-2 border-green-400' 
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          {t.tabPack}
        </button>
        <button
          onClick={() => handleModeSwitch('ai')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${
            config.mode === 'ai' 
              ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-400' 
              : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          {t.tabAI}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        
        {/* === PRESET MODE CONTENT === */}
        {config.mode === 'preset' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{t.styleSettings}</h3>
              <p className="text-gray-400 text-xs">{t.styleDesc}</p>
            </div>

            {/* Palette Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">{t.palette}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['bw', 'retro', 'neon', 'pastel'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handlePresetChange('colorVibrancy', mode)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      config.colorVibrancy === mode 
                        ? 'border-yellow-400 bg-gray-700 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]' 
                        : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t.modes[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Texture Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">{t.texture}</label>
              <div className="grid grid-cols-4 gap-2">
                {(['none', 'grain', 'paper', 'mixed'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handlePresetChange('textureMode', mode)}
                    className={`px-1 py-2 rounded-lg text-[10px] font-bold transition-all border text-center ${
                      config.textureMode === mode 
                        ? 'border-blue-400 bg-gray-700 text-blue-400' 
                        : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t.textures[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-gray-500">{t.chaosLevel}</label>
                  <span className="text-xs text-yellow-400 font-mono">{config.chaosLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.chaosLevel}
                  onChange={(e) => handlePresetChange('chaosLevel', Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-gray-500">{t.fontVariance}</label>
                  <span className="text-xs text-yellow-400 font-mono">{config.fontVariance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.fontVariance}
                  onChange={(e) => handlePresetChange('fontVariance', Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
            </div>

            <button
              onClick={onShuffle}
              className="w-full py-2 mt-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {t.reshuffle}
            </button>
          </div>
        )}

        {/* === PACK MODE CONTENT === */}
        {config.mode === 'pack' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{t.selectPack}</h3>
              <p className="text-gray-400 text-xs">{t.packDesc}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {Object.values(STYLE_PACKS).map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handlePackSelect(pack.id)}
                  className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                    config.selectedPackId === pack.id
                      ? 'border-green-400 bg-gray-700'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-sm ${config.selectedPackId === pack.id ? 'text-green-400' : 'text-white'}`}>
                      {pack.label}
                    </span>
                    {config.selectedPackId === pack.id && (
                       <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">{pack.description}</p>
                  
                  {/* Preview of styles in pack */}
                  <div className="flex gap-1">
                     <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ background: pack.colors[0].bg, color: pack.colors[0].text }}>A</div>
                     <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ background: pack.colors[1] ? pack.colors[1].bg : pack.colors[0].bg, color: pack.colors[1] ? pack.colors[1].text : pack.colors[0].text }}>B</div>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={onShuffle}
              className="w-full py-2 mt-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               {t.reshuffle}
            </button>
          </div>
        )}

        {/* === AI MODE CONTENT === */}
        {config.mode === 'ai' && (
          <div className="space-y-5 animate-fadeIn">
             <div>
              <p className="text-gray-300 text-sm leading-relaxed">{t.aiDesc}</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-purple-400 uppercase">{t.aiPromptLabel}</label>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t.aiPromptPlaceholder}
                className="w-full h-24 bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-white focus:border-purple-400 focus:outline-none placeholder-gray-600 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIncludeText(!includeText)}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${includeText ? 'bg-purple-500 border-purple-500' : 'border-gray-500 bg-transparent'}`}>
                {includeText && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className="text-xs text-gray-400 select-none">{t.includeText}</span>
            </div>

            <button
              onClick={handleAiSubmit}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.generating}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {t.generateBtn}
                </>
              )}
            </button>
            
            {/* Visual Indicator and Fine Tuning */}
            {config.customPalette.length > 0 && (
              <div className="pt-4 border-t border-gray-700 space-y-4">
                
                {/* Palette Preview */}
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block mb-2">Current Generated Palette</span>
                  <div className="flex gap-1 h-6">
                    {config.customPalette.map((cp, idx) => (
                       <div key={idx} className="flex-1 rounded" style={{background: cp.bg}}>
                          <div className="w-full h-full rounded opacity-50 flex items-center justify-center" style={{color: cp.text}}>A</div>
                       </div>
                    ))}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.finetuneTitle}</h4>

                {/* Chaos Slider (AI) */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-gray-500">{t.chaosLevel}</label>
                        <span className="text-xs text-purple-400 font-mono">{config.chaosLevel}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.chaosLevel}
                        onChange={(e) => handleParamChange('chaosLevel', Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                </div>

                {/* Font Variance Slider (AI) */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-gray-500">{t.fontVariance}</label>
                        <span className="text-xs text-purple-400 font-mono">{config.fontVariance}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.fontVariance}
                        onChange={(e) => handleParamChange('fontVariance', Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                </div>

                {/* Texture Selector (AI) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">{t.texture}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'grain', 'paper', 'mixed'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleParamChange('textureMode', mode)}
                        className={`px-1 py-2 rounded-lg text-[10px] font-bold transition-all border text-center ${
                          config.textureMode === mode 
                            ? 'border-purple-400 bg-gray-700 text-purple-400' 
                            : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {t.textures[mode]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onShuffle}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {t.reshuffle}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default StyleControls;
