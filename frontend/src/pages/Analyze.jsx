import { useState, useEffect } from 'react'
import api from '../api'

function Analyze() {
  const [cvList, setCvList] = useState([])
  const [selectedCv, setSelectedCv] = useState('')
  const [file, setFile] = useState(null)
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')
  const [sector, setSector] = useState('')
  const [level, setLevel] = useState('junior')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/cv/list').then(res => setCvList(res.data)).catch(() => {})
  }, [])

  const handleUpload = async () => {
    if (!file) return null
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/cv/upload', formData)
    setCvList([...cvList, res.data])
    return res.data.id
  }

  const handleAnalyze = async () => {
    if (!position) {
      setError('Pozisyon zorunludur')
      return
    }
    if (!selectedCv && !file) {
      setError('CV seçin veya yeni CV yükleyin')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let cvId = selectedCv
      if (file) {
        cvId = await handleUpload()
        setSelectedCv(cvId)
      }

      const analyzeRes = await api.post('/analyze/cv', {
        cv_id: cvId,
        position,
        company,
        sector,
        level
      })
      setResult(analyzeRes.data)
      const count = parseInt(localStorage.getItem('analyzeCount') || '0')
      localStorage.setItem('analyzeCount', count + 1)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analiz başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-2">CV Analizi</h2>
      <p className="text-gray-400 mb-8">CV'ni yükle veya seç, pozisyonu gir, AI analiz etsin.</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-2 gap-6 mb-6">

        {cvList.length > 0 && (
          <div className="col-span-2">
            <label className="text-sm text-gray-400 mb-1 block">Kayıtlı CV'lerim</label>
            <select
              value={selectedCv}
              onChange={e => { setSelectedCv(e.target.value); setFile(null) }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- CV Seç --</option>
              {cvList.map(cv => (
                <option key={cv.id} value={cv.id}>{cv.filename}</option>
              ))}
            </select>
          </div>
        )}

        <div className="col-span-2">
          <label className="text-sm text-gray-400 mb-1 block">
            {cvList.length > 0 ? 'Ya da Yeni CV Yükle (PDF)' : 'CV Yükle (PDF)'}
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => { setFile(e.target.files[0]); setSelectedCv('') }}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-300"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Hedef Pozisyon *</label>
          <input
            type="text"
            value={position}
            onChange={e => setPosition(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="Frontend Developer"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Şirket</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="Microsoft"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Sektör</label>
          <input
            type="text"
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="Teknoloji"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Seviye</label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg"
      >
        {loading ? '🧠 AI analiz ediyor...' : 'CV Analiz Et →'}
      </button>

      {result && (
        <div className="mt-10 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-6xl font-bold text-blue-400 mb-2">{result.score}</div>
            <div className="text-gray-400">Uygunluk Skoru</div>
            <p className="text-gray-300 mt-4">{result.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-green-400 mb-4">✅ Güçlü Yanlar</h3>
              <ul className="space-y-2">
                {result.strengths?.map((s, i) => (
                  <li key={i} className="text-gray-300 text-sm">• {s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-red-400 mb-4">❌ Eksikler</h3>
              <ul className="space-y-2">
                {result.gaps?.map((g, i) => (
                  <li key={i} className="text-gray-300 text-sm">• {g}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-400 mb-4">💡 Öneriler</h3>
            <ul className="space-y-2">
              {result.suggestions?.map((s, i) => (
                <li key={i} className="text-gray-300 text-sm">• {s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  )
}

export default Analyze