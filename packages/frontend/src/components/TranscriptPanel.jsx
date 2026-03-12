/**
 * TranscriptPanel - Sesli konuşma transkripti paneli
 * Sağ taraftan sürgülü olarak açılır
 */
import { useEffect, useRef } from 'react';

export default function TranscriptPanel({ transcripts, onClose }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-50 animate-slide-in-right">
      <div className="h-full glass bg-gray-950/80 flex flex-col">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white/70">Konuşma Kaydı</h3>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Transkriptler */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
          {transcripts.length === 0 && (
            <p className="text-white/20 text-sm text-center mt-8">
              Henüz konuşma kaydı yok
            </p>
          )}
          {transcripts.map((t, i) => (
            <div
              key={i}
              className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  t.role === 'user'
                    ? 'bg-indigo-500/20 text-indigo-200 rounded-br-md'
                    : 'bg-white/5 text-white/70 rounded-bl-md'
                } ${t.partial ? 'opacity-70' : 'opacity-100'}`}
              >
                <span className="block text-[10px] text-white/30 mb-1">
                  {t.role === 'user' ? 'Sen' : 'Nöra'}
                </span>
                {t.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
