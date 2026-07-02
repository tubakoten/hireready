import { useState, useEffect } from 'react'
import api from '../api'

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
    if (!selectedCv) {
      setError('Lütfen bir CV seçin')
      return
    }
    if (!position) {
      setError('Pozisyon zorunlu')
      return
    }
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
      // Mevcut sorudan farklı bir soru bul
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
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-2">Mülakat Simülasyonu</h2>
        <p className="text-gray-400 mb-8">Pozisyona özel sorularla pratik yap.</p>

        {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="space-y-4">
          <div>
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
            <label className="text-sm text-gray-400 mb-1 block">Pozisyon</label>
            <input
              type="text"
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              placeholder="Frontend Developer"
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
          <button
            onClick={startInterview}
            disabled={loading || cvList.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-medium transition disabled:opacity-50 text-lg"
          >
            {loading ? '🧠 Sorular hazırlanıyor...' : 'Mülakata Başla →'}
          </button>
        </div>
      </main>
    )
  }

  if (step === 'questions') {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Soru {currentQ + 1} / {questions.length}</h2>
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
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-8">Mülakat Sonuçları</h2>
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