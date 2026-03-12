import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const testTypeLabels = {
  VERBAL_FLUENCY: 'Sözel Akıcılık',
  STORY_RECALL: 'Hikaye Hatırlama',
  VISUAL_RECOGNITION: 'Görsel Tanıma',
  ORIENTATION: 'Yönelim',
};

const riskConfig = {
  LOW: {
    label: 'Düşük Risk',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    description: 'Bilişsel fonksiyonlarınız normal aralıkta görünüyor.',
  },
  MODERATE: {
    label: 'Orta Risk',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
    description: 'Bazı bilişsel alanlarda hafif düşüş gözlemlendi. Bir uzmana danışmanız önerilir.',
  },
  HIGH: {
    label: 'Yüksek Risk',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    description: 'Önemli bilişsel düşüş işaretleri gözlemlendi. Lütfen en kısa sürede bir nörolog ile görüşün.',
  },
};

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then((res) => setSession(res.data.session))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-breathe w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
      </div>
    );
  }

  if (!session) return null;

  const risk = session.riskLevel ? riskConfig[session.riskLevel] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-sm font-medium text-white/70">Sonuç Raporu</span>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-10 max-w-3xl">
        {/* Toplam Skor */}
        <div className="glass rounded-2xl p-8 text-center mb-6">
          <p className="text-xs text-white/35 mb-3 uppercase tracking-wider">Toplam Skor</p>
          <p className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {session.totalScore !== null ? Math.round(session.totalScore) : '—'}
          </p>
          <p className="mt-2 text-xs text-white/20">
            {new Date(session.startedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Risk Durumu */}
        {risk && (
          <div className={`rounded-2xl border p-5 mb-6 ${risk.bg}`}>
            <h3 className={`text-base font-semibold ${risk.color}`}>{risk.label}</h3>
            <p className="mt-1 text-sm text-white/50">{risk.description}</p>
          </div>
        )}

        {/* Test Detayları */}
        <h2 className="text-sm font-medium text-white/50 mb-4">Test Detayları</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {session.tests?.map((test) => {
            const pct = test.maxScore > 0 ? (test.score / test.maxScore) * 100 : 0;
            const barColor =
              pct >= 75 ? 'bg-emerald-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';

            return (
              <div key={test.id} className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white/80">
                    {testTypeLabels[test.testType] || test.testType}
                  </h3>
                  <span className="text-base font-bold text-white/90">
                    {Math.round(test.score)}<span className="text-white/30">/{test.maxScore}</span>
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/25">%{Math.round(pct)}</p>
              </div>
            );
          })}
        </div>

        {/* PDF İndir */}
        <div className="mt-8 text-center">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all text-sm"
            onClick={() => alert('PDF raporu hazırlanıyor...')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            PDF Rapor İndir
          </button>
        </div>

        {/* Uyarı */}
        <div className="mt-8 glass rounded-xl p-4">
          <p className="text-[11px] text-white/25 text-center leading-relaxed">
            <strong className="text-white/40">Önemli:</strong> Bu tarama bir tıbbi teşhis değildir. Sonuçlar yalnızca bilgilendirme amaçlıdır 
            ve profesyonel tıbbi değerlendirmenin yerini almaz. Endişeleriniz varsa lütfen bir sağlık kuruluşuna başvurun.
          </p>
        </div>
      </main>
    </div>
  );
}
