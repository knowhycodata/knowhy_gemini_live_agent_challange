/**
 * AgentSession - Nöra ile tam otonom sesli etkileşim sayfası
 * Kullanıcı bu sayfaya geldiğinde mikrofon izni alınır ve
 * Gemini Live API ile sesli konuşma başlar.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeminiLive, SESSION_STATES } from '../hooks/useGeminiLive';
import { createLogger } from '../lib/logger';
import OrbitalVisualizer from '../components/OrbitalVisualizer';
import TranscriptPanel from '../components/TranscriptPanel';
import GeneratedImagePanel from '../components/GeneratedImagePanel';

const log = createLogger('AgentSession');

export default function AgentSession() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const gemini = useGeminiLive();
  const [showTranscript, setShowTranscript] = useState(false);
  const hasStarted = useRef(false);

  // Otomatik bağlantı ve oturum başlatma - TEK ADIMDA
  useEffect(() => {
    log.info('useEffect triggered', { 
      hasToken: !!token, 
      hasStarted: hasStarted.current,
      currentState: gemini.state
    });

    if (!token) {
      log.warn('No token available, redirecting to login');
      navigate('/login');
      return;
    }

    if (hasStarted.current) {
      log.info('Already started, skipping');
      return;
    }

    hasStarted.current = true;
    log.info('Starting connection with token', { tokenLength: token.length });
    
    // connectAndStart: Tek adımda bağlan + auth + session başlat + mikrofon aç
    gemini.connectAndStart(token).then(() => {
      log.info('connectAndStart completed');
    }).catch((err) => {
      log.error('connectAndStart failed', { error: err.message });
    });
  }, [token]);

  // State değişimlerini logla
  useEffect(() => {
    log.info('State changed', { 
      state: gemini.state, 
      sessionId: gemini.sessionId,
      isRecording: gemini.isRecording,
      isSpeaking: gemini.isSpeaking,
      currentTest: gemini.currentTest,
      error: gemini.error
    });
  }, [gemini.state, gemini.sessionId, gemini.isRecording, gemini.isSpeaking, gemini.currentTest, gemini.error]);

  // Tamamlandığında sonuçlara yönlendir
  useEffect(() => {
    if (gemini.state === SESSION_STATES.COMPLETED && gemini.sessionId) {
      log.info('Session completed, redirecting to results', { sessionId: gemini.sessionId });
      const timer = setTimeout(() => {
        navigate(`/results/${gemini.sessionId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gemini.state, gemini.sessionId, navigate]);

  const handleEnd = useCallback(() => {
    gemini.endSession();
    navigate('/dashboard');
  }, [gemini, navigate]);

  const mapStateToVisualizer = () => {
    switch (gemini.state) {
      case SESSION_STATES.IDLE: return 'idle';
      case SESSION_STATES.CONNECTING: return 'connecting';
      case SESSION_STATES.AUTHENTICATING: return 'authenticating';
      case SESSION_STATES.READY: return 'ready';
      case SESSION_STATES.ACTIVE: return 'active';
      case SESSION_STATES.LISTENING: return 'listening';
      case SESSION_STATES.SPEAKING: return 'speaking';
      case SESSION_STATES.PROCESSING: return 'processing';
      case SESSION_STATES.COMPLETED: return 'completed';
      case SESSION_STATES.ERROR: return 'error';
      default: return 'idle';
    }
  };

  const currentTestLabel = () => {
    switch (gemini.currentTest) {
      case 'verbal_fluency': return 'Test 1: Sözel Akıcılık';
      case 'verbal_fluency_done': return 'Sözel Akıcılık ✓';
      case 'story_recall': return 'Test 2: Hikaye Hatırlama';
      case 'story_recall_done': return 'Hikaye Hatırlama ✓';
      case 'visual_recognition': return 'Test 3: Görsel Tanıma';
      case 'visual_recognition_done': return 'Görsel Tanıma ✓';
      case 'orientation': return 'Test 4: Yönelim';
      case 'orientation_done': return 'Yönelim ✓';
      case 'all_done': return 'Tüm Testler Tamamlandı';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Arka plan parçacıkları */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Üst bar */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="text-white/80 font-medium text-sm tracking-wide">Nöra</span>
        </div>

        <div className="flex items-center gap-4">
          {currentTestLabel() && (
            <span className="text-xs text-white/40 glass px-3 py-1.5 rounded-full animate-fade-in">
              {currentTestLabel()}
            </span>
          )}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-white/40 hover:text-white/80 transition-colors p-2"
            title="Transkript"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Ana içerik - Orbital */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg px-4">
        <OrbitalVisualizer state={mapStateToVisualizer()} size={280} />

        {/* Timer Göstergesi */}
        {gemini.timer && gemini.timer.active && (
          <div className="mt-6 animate-slide-up">
            <div className="glass rounded-xl px-6 py-4 border border-indigo-500/20">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="url(#timerGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${(gemini.timer.remaining / gemini.timer.duration) * 100} 100`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{gemini.timer.remaining}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Sözel Akıcılık Testi</p>
                  <p className="text-white/40 text-sm">Kelimeler söyleyin...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Timer Bitti Mesajı */}
        {gemini.timer && !gemini.timer.active && gemini.timer.remaining === 0 && (
          <div className="mt-6 animate-slide-up">
            <div className="glass rounded-xl px-4 py-3 border-green-500/20">
              <p className="text-green-400 text-sm font-medium">⏱️ Süreniz doldu!</p>
            </div>
          </div>
        )}

        {/* Multi-Agent: Nano Banana 2 Pro - Otonom Görsel Üretme */}
        {(gemini.generatedImage || gemini.imageGenerating) && (
          <div className="mt-6">
            <GeneratedImagePanel
              image={gemini.generatedImage}
              isGenerating={gemini.imageGenerating}
              onClose={() => {}}
            />
          </div>
        )}

        {/* Hata mesajı */}
        {gemini.error && (
          <div className="mt-6 animate-slide-up">
            <div className="glass rounded-xl px-4 py-3 border-red-500/20">
              <p className="text-red-400 text-sm">{gemini.error}</p>
            </div>
          </div>
        )}

        {/* Tamamlandı mesajı */}
        {gemini.state === SESSION_STATES.COMPLETED && (
          <div className="mt-6 animate-slide-up text-center">
            <p className="text-white/60 text-sm">
              Testler tamamlandı. Sonuç sayfasına yönlendiriliyorsunuz...
            </p>
          </div>
        )}
      </main>

      {/* Alt bar - kontroller */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-6 pb-8">
        {/* Mikrofon durumu */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            gemini.isRecording ? 'bg-green-400 animate-pulse' : 'bg-white/20'
          }`} />
          <span className="text-xs text-white/40">
            {gemini.isRecording ? 'Mikrofon açık' : 'Mikrofon kapalı'}
          </span>
        </div>

        {/* Çıkış butonu */}
        <button
          onClick={handleEnd}
          className="glass rounded-full px-5 py-2.5 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
        >
          Oturumu Sonlandır
        </button>
      </footer>

      {/* Transkript paneli */}
      {showTranscript && (
        <TranscriptPanel
          transcripts={gemini.transcripts}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  );
}
