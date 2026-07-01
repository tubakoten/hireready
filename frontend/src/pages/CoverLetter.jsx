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
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-2">Cover Letter</h2>
      <p className="text-gray-400 mb-8">CV'ne ve pozisyona özel kapak mektubu üret.</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="col-span-2">
          <label className="text-sm text-gray-400 mb-1 block">CV Seç</label>
          {cvList.length === 0 ? (
            <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 px-4 py-3 rounded-lg">
              Henüz CV yüklemediniz. Önce <a href="/analyze" className="underline">CV Analiz</a> sayfasından CV yükleyin.
            </div>
          ) : (
            <select
              value={selectedCv}
              onChange={e => setSelectedCv(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- CV Seç --</option>
              {cvList.map(cv => (
                <option key={cv.id} value={cv.id}>{cv.filename}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Pozisyon *</label>
          <input
            type="text"
            value={position}
            onChange={e => setPosition(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="Frontend Developer"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Şirket *</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="Microsoft"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Dil</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || cvList.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg mb-8"
      >
        {loading ? '✉️ Kapak mektubu hazırlanıyor...' : 'Kapak Mektubu Oluştur →'}
      </button>

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