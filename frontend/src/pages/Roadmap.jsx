import { useState, useEffect } from 'react'
import api from '../api'

const priorityColors = {
  'yüksek': 'text-red-400 border-red-800 bg-red-900/20',
  'orta': 'text-yellow-400 border-yellow-800 bg-yellow-900/20',
  'düşük': 'text-green-400 border-green-800 bg-green-900/20',
  'high': 'text-red-400 border-red-800 bg-red-900/20',
  'medium': 'text-yellow-400 border-yellow-800 bg-yellow-900/20',
  'low': 'text-green-400 border-green-800 bg-green-900/20',
}

function Roadmap() {
  const [cvList, setCvList] = useState([])
  const [selectedCv, setSelectedCv] = useState('')
  const [position, setPosition] = useState('')
  const [language, setLanguage] = useState('tr')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/cv/list').then(res => setCvList(res.data)).catch(() => {})
    const params = new URLSearchParams(window.location.search)
    const cvId = params.get('cv_id')
    const pos = params.get('position')
    if (cvId) setSelectedCv(cvId)
    if (pos) setPosition(pos)
  }, [])

  const handleGenerate = async () => {
    if (!selectedCv || !position) { setError('CV ve pozisyon zorunludur'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.post('/roadmap/generate', {
        cv_id: parseInt(selectedCv),
        position,
        language
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Yol haritası üretimi başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-4xl font-bold mb-2">Öğrenme Yol Haritası</h2>
      <p className="text-gray-400 mb-3">CV'ndeki eksikleri tespit et, adım adım öğrenme planı oluştur. AI destekli analizimiz ile kariyer hedeflerine giden en kısa yolu çizelim.</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">CV Seç</label>
            {cvList.length === 0 ? (
              <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 px-4 py-3 rounded-lg text-sm">
                Önce <a href="/analyze" className="underline">CV Analiz</a> sayfasından CV yükleyin.
              </div>
            ) : (
              <select
                value={selectedCv}
                onChange={e => setSelectedCv(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- CV Seç --</option>
                {cvList.map(cv => (
                  <option key={cv.id} value={cv.id}>{cv.filename}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Hedef Pozisyon *</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="Frontend Developer"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Dil</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || cvList.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg"
          >
            {loading ? '🗺️ Yol haritası oluşturuluyor...' : 'Yol Haritası Oluştur →'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
          <span className="text-blue-400 text-xl">✨</span>
          <div>
            <p className="font-medium text-sm">AI Destekli Analiz</p>
            <p className="text-gray-400 text-xs mt-1">Yapay zeka, seçtiğiniz pozisyon için gereken en güncel yetkinlikleri tarar ve CV'nizle karşılaştırır.</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
          <span className="text-green-400 text-xl">📈</span>
          <div>
            <p className="font-medium text-sm">%94 Başarı</p>
            <p className="text-gray-400 text-xs mt-1">Hedef odaklı hazırlık.</p>
          </div>
        </div>
      </div>

      {result && (
        <div>
          <h3 className="text-xl font-semibold mb-6">{result.position} için Öğrenme Yol Haritası</h3>
          <div className="space-y-4">
            {result.steps?.map((step, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                    <h4 className="font-semibold text-lg">{step.skill}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[step.priority] || 'text-gray-400 border-gray-700'}`}>
                      {step.priority}
                    </span>
                    <span className="text-xs text-gray-400">⏱️ {step.duration}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">{step.description}</p>
                {step.resources?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">📚 Kaynaklar:</p>
                    <div className="flex flex-wrap gap-2">
                      {step.resources.map((r, j) => (
                        <span key={j} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

export default Roadmap