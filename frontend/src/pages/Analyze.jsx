import { useState, useEffect, useRef } from 'react'
import api from '../api'

function Analyze() {
  const [cvList, setCvList] = useState([])
  const [selectedCv, setSelectedCv] = useState('')
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')
  const [sector, setSector] = useState('')
  const [level, setLevel] = useState('junior')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.get('/cv/list').then(res => setCvList(res.data)).catch(() => {})
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
      setSelectedCv('')
    }
  }

  const handleUpload = async () => {
    if (!file) return null
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/cv/upload', formData)
    setCvList([...cvList, res.data])
    return res.data.id
  }

  const handleAnalyze = async () => {
    if (!position) { setError('Pozisyon zorunludur'); return }
    if (!selectedCv && !file) { setError('CV seçin veya yeni CV yükleyin'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      let cvId = selectedCv
      if (file) {
        cvId = await handleUpload()
        setSelectedCv(cvId)
      }
      const analyzeRes = await api.post('/analyze/cv', { cv_id: cvId, position, company, sector, level })
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
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-4xl font-bold mb-2">CV Analizi</h2>
      <p className="text-gray-400 mb-10">CV'nizi yükle veya seç, pozisyonu gir, AI analiz etsin. Gelecek kariyerinizi optimize etmek için gelişmiş algoritmalarımızla tanışın.</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Sol - Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {cvList.length > 0 && (
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 block">Kayıtlı CV'lerim</label>
              <select
                value={selectedCv}
                onChange={e => { setSelectedCv(e.target.value); setFile(null) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- CV Seç --</option>
                {cvList.map(cv => (
                  <option key={cv.id} value={cv.id}>{cv.filename}</option>
                ))}
              </select>
            </div>
          )}

          {/* Drag & Drop */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-4 ${
              isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="text-3xl mb-2">📄</div>
            {file ? (
              <p className="text-blue-400 text-sm font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-gray-300 text-sm">Dosya Seç veya Buraya Sürükle</p>
                <p className="text-gray-500 text-xs mt-1">Sadece PDF, Maks. 5MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={e => { setFile(e.target.files[0]); setSelectedCv('') }}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Hedef Pozisyon *</label>
              <input type="text" value={position} onChange={e => setPosition(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="Frontend Developer" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Şirket</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="Microsoft" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Sektör</label>
              <input type="text" value={sector} onChange={e => setSector(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="Teknoloji" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Seviye</label>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>

          <button onClick={handleAnalyze} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg">
            {loading ? '🧠 AI analiz ediyor...' : 'CV Analiz Et →'}
          </button>
        </div>

        {/* Sağ - AI Açıklama */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-xl mb-4">✨</div>
            <h3 className="font-semibold text-xl mb-3">Yapay Zeka Analizi</h3>
            <p className="text-gray-400 text-sm mb-4">Gelişmiş AI modellerimiz CV'nizi hedeflediğiniz şirket ve pozisyonun beklentileriyle 10 saniyeden kısa sürede kıyaslar.</p>
            <div className="space-y-2">
              {['✓ Anahtar Kelime Eşleştirme', '✓ Format ve Yapı Analizi', '✓ Eksik Beceri Önerileri'].map(f => (
                <p key={f} className="text-gray-300 text-sm">{f}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-6xl font-bold text-blue-400 mb-2">{result.score}</div>
            <div className="text-gray-400">Uygunluk Skoru</div>
            <p className="text-gray-300 mt-4">{result.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-green-400 mb-4">✅ Güçlü Yanlar</h3>
              <ul className="space-y-2">
                {result.strengths?.map((s, i) => <li key={i} className="text-gray-300 text-sm">• {s}</li>)}
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-red-400 mb-4">❌ Eksikler</h3>
              <ul className="space-y-2">
                {result.gaps?.map((g, i) => <li key={i} className="text-gray-300 text-sm">• {g}</li>)}
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-400 mb-4">💡 Öneriler</h3>
            <ul className="space-y-2">
              {result.suggestions?.map((s, i) => <li key={i} className="text-gray-300 text-sm">• {s}</li>)}
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={() => window.location.href = `/roadmap?cv_id=${selectedCv}&position=${encodeURIComponent(position)}`}
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-medium transition text-lg"
            >
              🗺️ Öğrenme Yol Haritası Oluştur →
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default Analyze