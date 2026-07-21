import { useState, useEffect } from 'react'
import api from '../api'

function CoverLetter() {
  const [cvList, setCvList] = useState([])
  const [selectedCv, setSelectedCv] = useState('')
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')
  const [language, setLanguage] = useState('tr')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/cv/list').then(res => setCvList(res.data)).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!selectedCv || !position || !company) {
      setError('CV, pozisyon ve şirket zorunludur')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await api.post('/cover-letter/generate', {
        cv_id: parseInt(selectedCv),
        position,
        company,
        language
      })
      setResult(res.data.cover_letter)
    } catch (err) {
      setError(err.response?.data?.detail || 'Kapak mektubu üretimi başarısız')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        {/* Sol - Başlık ve Görsel */}
        <div>
          <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full">✨ AI-POWERED WRITER</span>
          <h2 className="text-4xl font-bold mt-4 mb-4">Cover Letter</h2>
          <p className="text-gray-400 mb-6">Generate a tailored, professional cover letter that aligns your unique skills with your target position's requirements in seconds.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="p-4 font-mono text-xs text-gray-400 space-y-1">
              <p>Sayın İşe Alım Ekibi,</p>
              <p className="mt-2">Frontend Developer pozisyonu için...</p>
              <p>React ve TypeScript konusundaki...</p>
              <p>deneyimlerimle katkı sağlamak...</p>
              <p className="mt-2">Saygılarımla,</p>
            </div>
          </div>
        </div>

        {/* Sağ - Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 flex items-center gap-2 block">📄 CV Seç</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-2 block">🗂️ Pozisyon *</label>
                <input
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  placeholder="Frontend Developer"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-2 block">🏢 Şirket *</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  placeholder="Microsoft"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 flex items-center gap-2 block">🌐 Dil</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || cvList.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg"
            >
              {loading ? '✉️ Hazırlanıyor...' : 'Kapak Mektubu Oluştur →'}
            </button>

            <div className="flex justify-center gap-6 text-xs text-gray-500">
              <span>✓ ATS Optimized</span>
              <span>⚡ Instant Result</span>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">✉️ Kapak Mektubun</h3>
            <button
              onClick={handleCopy}
              className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
            >
              {copied ? '✅ Kopyalandı!' : '📋 Kopyala'}
            </button>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{result}</p>
        </div>
      )}
    </main>
  )
}

export default CoverLetter