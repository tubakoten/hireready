import { useState, useEffect, useRef } from 'react'
import api from '../api'

// Web Speech API tarayıcı desteği kontrolü
const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null
const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// Kullanıcının seçtiği sesi tarayıcıda hatırlamak için basit localStorage yardımcıları
function getSavedVoiceName(language) {
  try {
    return localStorage.getItem(`hireready_voice_${language}`) || ''
  } catch {
    return ''
  }
}
function saveVoiceName(language, name) {
  try {
    localStorage.setItem(`hireready_voice_${language}`, name)
  } catch {
    // localStorage kapalıysa sessizce yoksay
  }
}

// Mevcut sistem seslerini yükler; Chrome'da sesler bazen async yükleniyor (voiceschanged)
function useSpeechVoices() {
  const [voices, setVoices] = useState([])
  useEffect(() => {
    if (!speechSynthesisSupported) return
    const update = () => setVoices(window.speechSynthesis.getVoices())
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])
  return voices
}

function useVoiceInput(language, onFinalChunk, autoStopSilenceMs = 2500) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const resetSilenceTimer = () => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop()
    }, autoStopSilenceMs)
  }

  useEffect(() => {
    if (!SpeechRecognitionAPI) return
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language === 'tr' ? 'tr-TR' : 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          onFinalChunk(transcript)
        } else {
          interim += transcript
        }
      }
      setInterimText(interim)
      resetSilenceTimer()
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied' || event.error === 'service-not-allowed') {
        setPermissionDenied(true)
      }
      setIsListening(false)
      setInterimText('')
      clearSilenceTimer()
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      clearSilenceTimer()
    }

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
      clearSilenceTimer()
    }
  }, [language])

  const start = () => {
    if (!recognitionRef.current || isListening) return
    setPermissionDenied(false)
    try {
      recognitionRef.current.start()
      setIsListening(true)
      resetSilenceTimer()
    } catch {
      // zaten başlamışsa hata verir, yoksay
    }
  }

  const stop = () => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setIsListening(false)
    clearSilenceTimer()
  }

  return { isListening, interimText, start, stop, permissionDenied, supported: !!SpeechRecognitionAPI }
}

// Chrome bazen speak() çağrısını, utterance nesnesi referanssız kalınca
// (garbage collect edilince) sessizce iptal ediyor. Referansı dışarıda tutuyoruz.
let lastUtteranceRef = null

// Azure Speech (neural, doğal ses) — backend'de key yapılandırılmamışsa veya
// istek başarısız olursa otomatik olarak tarayıcının kendi sesine (speakText) düşer.
function useAzureSpeech(language) {
  const audioRef = useRef(null)
  const [speaking, setSpeaking] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (speechSynthesisSupported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const speak = async (text, onEnd) => {
    stop()
    if (!text) { onEnd?.(); return }
    setSpeaking(true)
    try {
      const res = await api.post(
        `/speech/tts?text=${encodeURIComponent(text)}&language=${language}`,
        null,
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      audioRef.current = audio
      const finish = () => {
        URL.revokeObjectURL(url)
        setSpeaking(false)
        onEnd?.()
      }
      audio.onended = finish
      audio.onerror = finish
      setUsingFallback(false)
      await audio.play()
    } catch (err) {
      // Azure yapılandırılmamış (503) ya da başka bir hata: tarayıcı TTS'ine düş
      setUsingFallback(true)
      speakText(text, language, () => {
        setSpeaking(false)
        onEnd?.()
      })
    }
  }

  return { speak, stop, speaking, usingFallback }
}

function speakText(text, language, onEnd) {
  if (!speechSynthesisSupported || !text) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  // cancel() sonrası hemen speak() çağırmak Chrome'da bazen çalışmıyor, küçük gecikme veriyoruz
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'tr' ? 'tr-TR' : 'en-US'
    utterance.rate = 0.95

    const savedName = getSavedVoiceName(language)
    if (savedName) {
      const match = window.speechSynthesis.getVoices().find(v => v.name === savedName)
      if (match) utterance.voice = match
    }

    if (onEnd) {
      utterance.onend = onEnd
      utterance.onerror = onEnd
    }
    lastUtteranceRef = utterance
    window.speechSynthesis.speak(utterance)
    // Chrome bazen motoru 'paused' durumda bırakıyor, resume ile açıyoruz
    window.speechSynthesis.resume()
  }, 60)
}

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
  const [company, setCompany] = useState('')
  const [level, setLevel] = useState('junior')
  const [language, setLanguage] = useState('tr')
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoMode, setAutoMode] = useState(false)
  const [companyPrep, setCompanyPrep] = useState(null)
  const [companyPrepLoading, setCompanyPrepLoading] = useState(false)

  const appendFinalTranscript = (chunk) => {
    setAnswer(prev => (prev ? prev.trim() + ' ' : '') + chunk.trim())
  }
  const voice = useVoiceInput(language, appendFinalTranscript)
  const azureSpeech = useAzureSpeech(language)

  useEffect(() => {
    api.get('/cv/list').then(res => setCvList(res.data)).catch(() => {})
  }, [])

  // Otomatik mod: soru değiştiğinde sesli oku, okuma bitince mikrofonu otomatik aç
  useEffect(() => {
    if (step !== 'questions' || !autoMode || !questions[currentQ]) return
    azureSpeech.speak(questions[currentQ], () => {
      voice.start()
    })
    return () => {
      azureSpeech.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, step, autoMode])

  const fetchCompanyPrep = async () => {
    if (!company.trim() || !position.trim()) { setError('Şirket ve pozisyon alanları gerekli'); return }
    setCompanyPrepLoading(true)
    setError('')
    try {
      const res = await api.post(`/interview/company-prep?company=${encodeURIComponent(company)}&position=${encodeURIComponent(position)}&level=${level}&language=${language}`)
      setCompanyPrep(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Şirket brifingi alınamadı')
    } finally {
      setCompanyPrepLoading(false)
    }
  }

  const startInterview = async () => {
    if (!selectedCv) { setError('Lütfen bir CV seçin'); return }
    if (!position) { setError('Pozisyon zorunlu'); return }
    setLoading(true)
    setError('')
    try {
      const companyParam = company ? `&company=${encodeURIComponent(company)}` : ''
      const res = await api.post(`/interview/questions?cv_id=${selectedCv}&position=${encodeURIComponent(position)}&level=${level}&language=${language}${companyParam}`)
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
      const companyParam = company ? `&company=${encodeURIComponent(company)}` : ''
      const res = await api.post(`/interview/questions?cv_id=${selectedCv}&position=${encodeURIComponent(position)}&level=${level}&language=${language}${companyParam}`)
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

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Şirket (opsiyonel — şirkete özel hazırlık için)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={company}
                    onChange={e => { setCompany(e.target.value); setCompanyPrep(null) }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    placeholder="Microsoft"
                  />
                  <button
                    onClick={fetchCompanyPrep}
                    disabled={companyPrepLoading || !company.trim() || !position.trim()}
                    className="shrink-0 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 px-4 py-3 rounded-lg text-sm font-medium transition whitespace-nowrap"
                  >
                    {companyPrepLoading ? '...' : '🏢 Brifing Al'}
                  </button>
                </div>
              </div>

              {companyPrep && (
                <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-4 space-y-3">
                  <p className="text-purple-300 text-sm">{companyPrep.company_overview}</p>
                  <div>
                    <p className="text-xs text-purple-400 font-medium mb-1">🎯 Değerler / Kültür</p>
                    <div className="flex flex-wrap gap-1.5">
                      {companyPrep.culture_values?.map((v, i) => (
                        <span key={i} className="text-xs bg-purple-800/40 text-purple-200 px-2 py-1 rounded-full">{v}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-purple-400 font-medium mb-1">🔍 Mülakatta Odak Alanları</p>
                    <ul className="space-y-1">
                      {companyPrep.focus_areas?.map((f, i) => (
                        <li key={i} className="text-gray-300 text-xs">• {f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-purple-400 font-medium mb-1">💡 Hazırlık İpuçları</p>
                    <ul className="space-y-1">
                      {companyPrep.prep_tips?.map((t, i) => (
                        <li key={i} className="text-gray-300 text-xs">• {t}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-purple-500/60 text-[11px]">
                    AI tahminidir, şirketin resmi kaynaklarıyla (kariyer sayfası, LinkedIn vb.) teyit etmen önerilir.
                  </p>
                </div>
              )}

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Soru {currentQ + 1} / {questions.length}</h2>
          <div className="w-32 bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {voice.supported && (
          <label className="flex items-center gap-2 mb-4 text-sm text-gray-400 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={autoMode}
              onChange={e => setAutoMode(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            🎧 Otomatik mod (soru sesli okunsun, bitince mikrofon otomatik açılsın)
          </label>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-lg">{questions[currentQ]}</p>
            <button
              onClick={() => azureSpeech.speak(questions[currentQ])}
              title="Soruyu sesli dinle"
              disabled={azureSpeech.speaking}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition disabled:opacity-50 ${
                azureSpeech.speaking ? 'bg-blue-600 animate-pulse' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              🔊
            </button>
          </div>
          {azureSpeech.speaking && (
            <p className="text-blue-400 text-xs mt-2">
              {azureSpeech.usingFallback ? '🔈 Soru okunuyor (tarayıcı sesi)...' : '🔈 Soru okunuyor (Azure doğal ses)...'}
            </p>
          )}
        </div>

        {voice.permissionDenied && (
          <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 px-4 py-3 rounded-lg text-sm mb-4">
            🚫 Mikrofon izni verilmedi. Tarayıcı adres çubuğundaki kilit/site ayarları simgesinden mikrofona izin verip tekrar dene.
          </div>
        )}

        <div className="relative mb-1">
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={6}
            className={`w-full bg-gray-900 border rounded-lg px-4 py-3 pr-14 focus:outline-none transition ${voice.isListening ? 'border-red-500/60' : 'border-gray-700 focus:border-blue-500'}`}
            placeholder="Cevabını buraya yaz ya da mikrofona konuş..."
          />
          {voice.supported && (
            <button
              onClick={() => (voice.isListening ? voice.stop() : voice.start())}
              title={voice.isListening ? 'Dinlemeyi durdur' : 'Sesli yanıtla'}
              disabled={azureSpeech.speaking}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-lg transition disabled:opacity-40 ${
                voice.isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              🎤
            </button>
          )}
        </div>

        {voice.isListening ? (
          <p className="text-red-400 text-sm mb-1">🎙️ Dinleniyor... (birkaç saniye sessiz kalırsan otomatik durur)</p>
        ) : (
          <div className="mb-1" />
        )}
        {voice.isListening && voice.interimText && (
          <p className="text-gray-500 text-sm italic mb-4">{voice.interimText}</p>
        )}
        {(!voice.isListening || !voice.interimText) && <div className="mb-4" />}

        <div className="flex gap-3">
          <button
            onClick={() => { voice.stop(); azureSpeech.stop(); generateNewQuestion() }}
            disabled={loading}
            className="flex-1 border border-gray-700 text-gray-500 hover:border-red-800 hover:text-red-400 py-4 rounded-lg font-medium transition disabled:opacity-50"
          >
            👎 Soruyu yenile
          </button>
          <button
            onClick={() => { voice.stop(); azureSpeech.stop(); submitAnswer() }}
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