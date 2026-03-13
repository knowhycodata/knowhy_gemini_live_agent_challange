import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const statusConfig = {
  IN_PROGRESS: { label: 'Devam Ediyor', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  COMPLETED: { label: 'Tamamlandı', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  CANCELLED: { label: 'İptal Edildi', color: 'text-red-600 bg-red-50 border-red-100' },
};

const riskConfig = {
  LOW: { label: 'Düşük Risk', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  MODERATE: { label: 'Orta Risk', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  HIGH: { label: 'Yüksek Risk', color: 'text-red-600 bg-red-50 border-red-100' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions')
      .then((res) => setSessions(res.data.sessions))
      .catch((err) => console.error('Oturumlar yüklenemedi', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">N</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Nöra</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-red-500 transition"
            >
              Çıkış
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        {/* Başlat kartı */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 mx-auto rounded-full bg-gray-900 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Bilişsel Tarama</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Nöra ile sesli etkileşime başlayın. Süre: ~10 dakika.
          </p>
          <button
            onClick={() => navigate('/session')}
            className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Taramayı Başlat
          </button>
        </div>

        {/* Geçmiş Oturumlar */}
        <div className="mt-10">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Geçmiş Oturumlar</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-400">Henüz bir tarama yapılmadı.</p>
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
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition text-left"
                  >
                    <div>
                      <p className="text-sm text-gray-700">
                        {new Date(session.startedAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                        {risk && (
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${risk.color}`}>
                            {risk.label}
                          </span>
                        )}
                      </div>
                    </div>
                    {session.totalScore !== null && (
                      <span className="text-lg font-semibold text-gray-900">
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
