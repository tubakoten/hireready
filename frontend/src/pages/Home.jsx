import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-6">
          Hayalindeki işe <span className="text-blue-400">hazırlan.</span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
          CV'ni yükle, hedef pozisyonunu gir. AI ile uygunluk analizi yap, mülakat sorularıyla pratik yap.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/analyze" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-medium transition text-lg">
            CV Analiz Et →
          </Link>
          <Link to="/interview" className="border border-gray-700 hover:border-gray-500 px-8 py-4 rounded-lg font-medium transition text-lg">
            Mülakat Pratiği
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Zekanızı <span className="text-blue-400">Kariyerinizle</span> Birleştirin</h2>
            <p className="text-gray-400 mt-2">Kariyer yolculuğunuzda size rehberlik edecek en gelişmiş yapay zeka araçlarını keşfedin.</p>
          </div>
          <Link to="/analyze" className="text-sm text-gray-400 hover:text-white transition whitespace-nowrap">
            Tüm Özellikleri Gör →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
  {
    icon: '📄',
    title: 'CV Analizi',
    desc: 'Hedef pozisyonunuza uygunluk skoru ve eksik beceriler. CV\'nizi güçlendirmek için kişiselleştirilmiş öneriler.',
    link: '/analyze',
    cta: 'Analizi Başlat'
  },
  {
    icon: '🎤',
    title: 'Mülakat Simülasyonu',
    desc: 'Pozisyonunuza özel sorularla pratik yapın, anında geri bildirim alın. Her sektör ve meslek için uygun.',
    link: '/interview',
    cta: 'Pratiğe Git'
  },
  {
    icon: '✉️',
    title: 'Ön Yazı',
    desc: 'Başvurduğunuz pozisyon ve şirkete özel ön yazı oluşturun. Profesyonel ve etkileyici metinler.',
    link: '/cover-letter',
    cta: 'Oluşturmaya Başla'
  },
          ].map(card => (
            <div key={card.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
              <div className="text-3xl mb-4">{card.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{card.desc}</p>
              <Link to={card.link} className="text-blue-400 text-sm hover:text-blue-300 transition">
                {card.cta} ↗
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-3">
              Kariyer <span className="text-blue-400">Yol Haritan</span> Hazır Mı?
            </h2>
            <p className="text-gray-400 mb-6">
  Sadece nerede olduğunuzu değil, nereye gidebileceğinizi de gösteriyoruz. Hedeflediğiniz pozisyon için öğrenmeniz gereken becerileri adım adım listeleriz.
</p>
            <div className="flex gap-2 flex-wrap mb-6">
            {['Sağlık & Tıp', 'Eğitim', 'Finans', 'Mühendislik', 'Hukuk', 'Tasarım'].map(tag => (
            <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
            <Link to="/roadmap" className="text-blue-400 text-sm hover:text-blue-300 transition">
              Yol Haritamı Oluştur →
            </Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-gray-400 text-sm">Kariyer Yol Haritanız</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home