import { Link } from 'react-router-dom'

function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center">
        <h2 className="text-5xl font-bold mb-6">
          Hayalindeki işe <span className="text-blue-400">hazırlan.</span>
        </h2>
        <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
          CV'ni yükle, hedef pozisyonunu gir. AI ile uygunluk analizi yap, mülakat sorularıyla pratik yap.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/analyze"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-medium transition text-lg"
          >
            CV Analiz Et →
          </Link>
          <Link
            to="/interview"
            className="border border-gray-700 hover:border-gray-500 px-8 py-4 rounded-lg font-medium transition text-lg"
          >
            Mülakat Pratiği
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-24">
        {[
          { title: 'CV Analizi', desc: 'Pozisyona uygunluk skoru ve eksik beceriler', icon: '📄' },
          { title: 'Mülakat Simülasyonu', desc: 'Gerçek sorularla pratik yap, anında feedback al', icon: '🎤' },
          { title: 'Cover Letter', desc: 'Pozisyona özel kapak mektubu üret', icon: '✉️' },
        ].map(card => (
          <div key={card.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
            <p className="text-gray-400 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Home