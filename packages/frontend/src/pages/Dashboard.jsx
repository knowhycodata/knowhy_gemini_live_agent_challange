import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import OrbitalVisualizer from '../components/OrbitalVisualizer';

const statusConfig = {
  IN_PROGRESS: { label: 'Devam Ediyor', color: 'text-yellow-400 bg-yellow-400/10' },
  COMPLETED: { label: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-400/10' },
  CANCELLED: { label: 'İptal Edildi', color: 'text-red-400 bg-red-400/10' },
};

const riskConfig = {
  LOW: { label: 'Düşük Risk', color: 'text-emerald-400 bg-emerald-400/10' },
  MODERATE: { label: 'Orta Risk', color: 'text-yellow-400 bg-yellow-400/10' },
  HIGH: { label: 'Yüksek Risk', color: 'text-red-400 bg-red-400/10' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions')
      .then((res) => setSessions(res.data.sessions))
      .catch((err) => log.error('Oturumlar yüklenemedi', { error: err.message }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-base font-semibold tracking-wide">Nöra</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/40">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-white/30 hover:text-red-400 transition"
            >
              Çıkış
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-10 max-w-3xl">
        {/* Başlat kartı */}
        <div className="glass rounded-2xl p-8 text-center">
          <OrbitalVisualizer state="idle" size={140} />
          <h1 className="text-xl font-semibold mt-4">Bilişsel Tarama</h1>
          <p className="mt-2 text-white/35 text-sm">
            Nöra ile sesli etkileşime başlayın. Süre: ~10 dakika.
          </p>
          <button
            onClick={() => navigate('/session')}
            className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Taramayı Başlat
          </button>
        </div>

        {/* Geçmiş Oturumlar */}
        <div className="mt-10">
          <h2 className="text-sm font-medium text-white/50 mb-4">Geçmiş Oturumlar</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-breathe w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <p className="text-sm text-white/20">Henüz bir tarama yapılmadı.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const status = statusConfig[session.status] || statusConfig.IN_PROGRESS;
                const risk = session.riskLevel ? riskConfig[session.riskLevel] : null;

                return (
                  <button
                    key={session.id}
                    onClick={() =>
                      session.status === 'COMPLETED'
                        ? navigate(`/results/${session.id}`)
                        : navigate('/session')
                    }
                    className="w-full flex items-center justify-between p-4 glass rounded-xl hover:border-white/15 transition text-left"
                  >
                    <div>
                      <p className="text-sm text-white/70">
                        {new Date(session.startedAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        {risk && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${risk.color}`}>
                            {risk.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {session.totalScore !== null && (
                      <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {Math.round(session.totalScore)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
