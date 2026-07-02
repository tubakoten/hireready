import { useState, useEffect } from 'react'
import api from '../api'

function MayaCoach({ question, position }) {
  const [open, setOpen] = useState(false)
  const [tip, setTip] = useState('')
  const [loading, setLoading] = useState(false)

  const getTip = async () => {
    if (tip) { setOpen(true); return }
    setLoading(true)
    setOpen(true)
    try {
      const res = await api.post(`/interview/evaluate?question=${encodeURIComponent(question)}&answer=ipucu+ver&position=${encodeURIComponent(position)}&language=tr`)
      setTip(res.data.feedback || 'Bu soruya STAR metoduyla yaklaş: Durum, Görev, Aksiyon, Sonuç.')
    } catch {
      setTip('Bu soruya STAR metoduyla yaklaş: Durum, Görev, Aksiyon, Sonuç.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 mb-3 w-72 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-sm font-medium">Maya</p>
                <p className="text-xs text-green-400">● Çevrimiçi</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-lg">×</button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">🧠 İpucu hazırlanıyor...</p>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed italic">"{tip}"</p>
          )}
        </div>
      )}
      <button
        onClick={getTip}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-lg transition text-xl"
        title="Maya'dan ipucu al"
      >
        🤖
      </button>
    </div>
  )
}

function Interview() {
  const [step, setStep] = useState('setup')
  const [cvList, setCvList] = useState([])
  const [selectedCv, setSelectedCv] = useState('')
  const [position, setPosition] = useState('')
  const [level, setLevel] = useState('junior')
  const [language, setLanguage] = useState('tr')
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/cv/list').then(res => setCvList(res.data)).catch(() => {})
  }, [])

  const startInterview = async () => {
    if (!selectedCv) { setError('Lütfen bir CV seçin'); return }
    if (!position) { setError('Pozisyon zorunlu'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post(`/interview/questions?cv_id=${selectedCv}&position=${encodeURIComponent(position)}&level=${level}&language=${language}`)
      setQuestions(res.data.questions)
      setStep('questions')
    } catch (err) {
      setError(err.response?.data?.detail || 'Soru üretimi başarısız')
    } finally {
      setLoading(false)
    }
  }

  const generateNewQuestion = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/interview/questions?cv_id=${selectedCv}&position=${encodeURIComponent(position)}&level=${level}&language=${language}`)
      const newQuestions = [...questions]
      const newQ = res.data.questions.find(q => q !== questions[currentQ]) || res.data.questions[0]
      newQuestions[currentQ] = newQ
      setQuestions(newQuestions)
    } catch (err) {
      console.error('Yeni soru üretilemedi')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await api.post(`/interview/evaluate?question=${encodeURIComponent(questions[currentQ])}&answer=${encodeURIComponent(answer)}&position=${encodeURIComponent(position)}&language=${language}`)
      setResults([...results, { question: questions[currentQ], answer, ...res.data }])
      setAnswer('')
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
      } else {
        const count = parseInt(localStorage.getItem('interviewCount') || '0')
        localStorage.setItem('interviewCount', count + 1)
        setStep('evaluated')
      }
    } catch (err) {
      setError('Değerlendirme başarısız')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'setup') {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">Mülakat Simülasyonu</h2>
          <p className="text-gray-400 text-lg">Pozisyona özel sorularla pratik yap. AI destekli mülakat koçumuzla gerçekçi bir deneyim yaşa.</p>
        </div>

        {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="grid grid-cols-2 gap-6">
          {/* Sol - Ayarlar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <span>⚙️</span>
              <h3 className="font-semibold">Oturum Ayarları</h3>
            </div>

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

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Pozisyon</label>
                <input
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  placeholder="Frontend Developer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Seviye</label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
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
                onClick={startInterview}
                disabled={loading || cvList.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg mt-2"
              >
                {loading ? '🧠 Sorular hazırlanıyor...' : 'Mülakata Başla →'}
              </button>
            </div>
          </div>

          {/* Sağ - Maya Koç Paneli */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl">🤖</div>
              <div>
                <h3 className="font-semibold text-lg">AI Kariyer Koçu: Maya</h3>
                <p className="text-green-400 text-sm">● Çevrimiçi</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm italic mb-6 bg-gray-800/50 rounded-lg p-3">
              "Merhaba! Ben Maya. Bugün hangi pozisyon için mülakat pratiği yapmak istersin? CV'ni ve hedeflediğin pozisyonu seçtiğinde sana özel sorular hazırlayacağım."
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span>✨</span>
                <h4 className="font-medium">Maya ile Hazırlan</h4>
              </div>
              <p className="text-gray-400 text-sm mb-4">Maya, seçtiğiniz CV ve pozisyona göre size özel sorular hazırlayacak. Mülakat sırasında ipucu almak için Maya'ya tıklayabilirsiniz.</p>
              <div className="space-y-2">
                {['🎤 Sesli Yanıt Desteği', '📊 Anlık Geri Bildirim', '✅ Puanlama ve Gelişim Raporu'].map(f => (
                  <div key={f} className="bg-gray-800 rounded-lg px-4 py-2 text-sm text-gray-300">{f}</div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Önceki Başarı Skorun</span>
                <span className="text-2xl font-bold text-blue-400">
                  {localStorage.getItem('lastScore') || '--'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'questions') {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Soru {currentQ + 1} / {questions.length}</h2>
          <div className="w-32 bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <p className="text-lg">{questions[currentQ]}</p>
        </div>

        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={6}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 mb-4"
          placeholder="Cevabını buraya yaz..."
        />

        <div className="flex gap-3">
          <button
            onClick={generateNewQuestion}
            disabled={loading}
            className="flex-1 border border-gray-700 text-gray-500 hover:border-red-800 hover:text-red-400 py-4 rounded-lg font-medium transition disabled:opacity-50"
          >
            👎 Soruyu yenile
          </button>
          <button
            onClick={submitAnswer}
            disabled={loading}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? '🧠 Değerlendiriliyor...' : currentQ < questions.length - 1 ? 'Sonraki Soru →' : 'Bitir →'}
          </button>
        </div>

        <MayaCoach question={questions[currentQ]} position={position} />
      </main>
    )
  }

  const avgScore = results.length > 0 ? Math.round(results.reduce((a, b) => a + (b.score || 0), 0) / results.length) : 0

  if (step === 'evaluated') {
    localStorage.setItem('lastScore', avgScore)
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Mülakat Sonuçları</h2>
        <div className="text-6xl font-bold text-blue-400 mt-4">{avgScore}</div>
        <p className="text-gray-400">Ortalama Skor</p>
      </div>
      <div className="space-y-6">
        {results.map((r, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Soru {i + 1}</p>
            <p className="font-medium mb-3">{r.question}</p>
            <p className="text-gray-300 text-sm mb-4 italic">"{r.answer}"</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-blue-400">{r.score}</span>
              <span className="text-gray-400 text-sm">/ 100</span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{r.feedback}</p>
            <p className="text-sm text-yellow-400">💡 {r.improvement}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

export default Interview