/**
 * GeneratedImagePanel - Nano Banana 2 Pro tarafından üretilen görseli gösterir
 * Multi-agent pipeline sonucu: PromptRefiner → ImageGenerator → Presenter
 */
import { useState } from 'react';

export default function GeneratedImagePanel({ image, isGenerating, onClose }) {
  const [expanded, setExpanded] = useState(false);

  if (!image && !isGenerating) return null;

  return (
    <div className="animate-slide-up">
      <div className="glass rounded-2xl p-4 max-w-sm mx-auto overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <span className="text-xs text-white/50 font-medium">Nano Banana 2 Pro</span>
          </div>

          {image && (
            <button
              onClick={onClose}
              className="text-white/20 hover:text-white/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Yükleniyor */}
        {isGenerating && !image && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-amber-400/20 animate-spin" 
                   style={{ borderTopColor: 'rgba(251, 191, 36, 0.8)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 animate-pulse" />
              </div>
            </div>
            <p className="text-white/30 text-xs mt-4 animate-pulse">
              Görsel üretiliyor...
            </p>
            <p className="text-white/15 text-[10px] mt-1">
              Multi-Agent Pipeline aktif
            </p>
          </div>
        )}

        {/* Üretilen Görsel */}
        {image && (
          <>
            <div 
              className="relative rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setExpanded(!expanded)}
            >
              <img
                src={`data:${image.mimeType};base64,${image.data}`}
                alt="Üretilen görsel"
                className={`w-full object-cover rounded-xl transition-all duration-300 ${
                  expanded ? 'max-h-[500px]' : 'max-h-64'
                }`}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                <span className="text-white/70 text-[10px] flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {expanded ? (
                      <>
                        <polyline points="4 14 10 14 10 20"/>
                        <polyline points="20 10 14 10 14 4"/>
                        <line x1="14" x2="21" y1="10" y2="3"/>
                        <line x1="3" x2="10" y1="21" y2="14"/>
                      </>
                    ) : (
                      <>
                        <polyline points="15 3 21 3 21 9"/>
                        <polyline points="9 21 3 21 3 15"/>
                        <line x1="21" x2="14" y1="3" y2="10"/>
                        <line x1="3" x2="10" y1="21" y2="14"/>
                      </>
                    )}
                  </svg>
                  {expanded ? 'Küçült' : 'Büyüt'}
                </span>
              </div>
            </div>

            {/* Açıklama */}
            {image.description && (
              <p className="text-white/30 text-[11px] mt-2 leading-relaxed line-clamp-2">
                {image.description}
              </p>
            )}

            {/* Alt bilgi */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-white/15 text-[9px]">
                Gemini ile üretildi
              </span>
              {image.refinedPrompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(image.refinedPrompt);
                  }}
                  className="text-white/20 hover:text-white/40 transition-colors text-[9px] flex items-center gap-1"
                  title={image.refinedPrompt}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                  Prompt
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
