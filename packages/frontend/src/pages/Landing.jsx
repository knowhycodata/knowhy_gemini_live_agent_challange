import { Link } from 'react-router-dom';
import OrbitalVisualizer from '../components/OrbitalVisualizer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* Arka plan efektleri */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="text-lg font-semibold tracking-wide">Nöra</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-white/50 hover:text-white transition">
            Giriş Yap
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition"
          >
            Kayıt Ol
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 pt-16 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Orbital */}
          <div className="flex justify-center mb-8">
            <OrbitalVisualizer state="idle" size={200} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-medium text-indigo-300/80 glass rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            Gemini Live AI ile Gerçek Zamanlı Sesli Etkileşim
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Bilişsel Sağlığınızı
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Yapay Zeka
            </span>
            {' '}ile Tarayın
          </h1>

          <p className="mt-6 text-lg text-white/40 leading-relaxed max-w-xl mx-auto">
            Nöra, Alzheimer ve bilişsel bozuklukların erken tespiti için tasarlanmış 
            sesli yapay zeka asistanıdır. 4 bilişsel test uygular ve detaylı sonuç raporu oluşturur.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all"
            >
              Taramaya Başla
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 text-sm font-semibold text-white/70 glass rounded-full hover:text-white transition-all"
            >
              Giriş Yap
            </Link>
          </div>
        </div>

        {/* Özellikler */}
        <div className="mt-28 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-6">
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 rounded-xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white/90">Tam Otonom Ajan</h3>
            <p className="mt-2 text-sm text-white/35 leading-relaxed">
              Nöra sesli komutlarla çalışır. Mikrofonunuzu açın, gerisini o halleder.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 rounded-xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white/90">Güvenilir Skorlama</h3>
            <p className="mt-2 text-sm text-white/35 leading-relaxed">
              Hesaplamalar backend'de yapılır. AI halüsinasyon riski sıfır.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 rounded-xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white/90">Detaylı Rapor</h3>
            <p className="mt-2 text-sm text-white/35 leading-relaxed">
              4 bilişsel test, risk analizi ve indirilebilir PDF rapor.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-white/20">
        Gemini Hackathon 2025 — Live Agents
      </footer>
    </div>
  );
}
