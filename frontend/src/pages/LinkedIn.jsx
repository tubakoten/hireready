import { useState, useRef } from 'react'
import api from '../api'

function LinkedInAnalyze() {
  const [mode, setMode] = useState('paste') // 'paste' | 'pdf'
  const [profileText, setProfileText] = useState('')
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')
  const [sector, setSector] = useState('')
  const [level, setLevel] = useState('junior')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'tr')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') setFile(droppedFile)
  }

  const handleAnalyze = async () => {
    if (!position) { setError('Pozisyon zorunludur'); return }
    if (mode === 'paste' && !profileText.trim()) { setError('Profil metnini yapıştırın'); return }
    if (mode === 'pdf' && !file) { setError('PDF dosyası seçin'); return }

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('position', position)
      if (company) formData.append('company', company)
      if (sector) formData.append('sector', sector)
      formData.append('level', level)
      formData.append('language', language)
      if (mode === 'paste') {
        formData.append('profile_text', profileText)
      } else {
        formData.append('file', file)
      }
      const res = await api.post('/linkedin/analyze', formData)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'LinkedIn analizi başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-4xl font-bold mb-2">LinkedIn Profil Analizi</h2>
      <p className="text-gray-400 mb-10">
        LinkedIn profilini hedef pozisyona göre AI ile değerlendir; başlık, hakkında bölümü ve
        anahtar kelime uyumu için somut öneriler al.
      </p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Sol - Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('paste')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'paste' ? 'bg-blue-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📋 Metni Yapıştır
            </button>
            <button
              onClick={() => setMode('pdf')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'pdf' ? 'bg-blue-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📄 PDF Yükle
            </button>
          </div>

          {mode === 'paste' ? (
            <div className="mb-4">
              <textarea
                value={profileText}
                onChange={e => setProfileText(e.target.value)}
                rows={8}
                placeholder="LinkedIn profilinizi açın, sayfanın tamamını seçip (Cmd/Ctrl+A) kopyalayın ve buraya yapıştırın..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
              />
              <p className="text-gray-500 text-xs mt-1">
                İpucu: Profilinizde "Kaynak" (Resource) → "Profili PDF olarak kaydet" seçeneği ile de dışa aktarıp "PDF Yükle" sekmesinden yükleyebilirsiniz.
              </p>
            </div>
          ) : (
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
                  <p className="text-gray-300 text-sm">LinkedIn PDF'ini Seç veya Buraya Sürükle</p>
                  <p className="text-gray-500 text-xs mt-1">Profil sayfasında "Kaynak → Profili PDF olarak kaydet"</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={e => setFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

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
            {loading ? '🧠 AI analiz ediyor...' : 'LinkedIn Profilini Analiz Et →'}
          </button>
        </div>

        {/* Sağ - AI Açıklama */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-xl mb-4">💼</div>
            <h3 className="font-semibold text-xl mb-3">LinkedIn Optimizasyonu</h3>
            <p className="text-gray-400 text-sm mb-4">
              AI, profilinizi işe alım uzmanı gözüyle inceler; başlığınızın ve deneyim
              açıklamalarınızın hedef pozisyonla ne kadar örtüştüğünü değerlendirir.
            </p>
            <div className="space-y-2">
              {['✓ Başlık (Headline) Değerlendirmesi', '✓ Anahtar Kelime Uyumu', '✓ Somut Başarı Önerileri'].map(f => (
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
            <div className="text-gray-400">LinkedIn Uygunluk Skoru</div>
            <p className="text-gray-300 mt-4">{result.summary}</p>
          </div>

          {result.headline_suggestion && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold text-blue-400 mb-2">✨ Önerilen Başlık (Headline)</h3>
              <p className="text-gray-200 text-lg font-medium">"{result.headline_suggestion}"</p>
            </div>
          )}

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
        </div>
      )}
    </main>
  )
}

export default LinkedInAnalyze