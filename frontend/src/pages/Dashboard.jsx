import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

function Dashboard() {
  const [cvList, setCvList] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzeCount, setAnalyzeCount] = useState(0)
  const [interviewCount, setInterviewCount] = useState(0)

  useEffect(() => {
    api.get('/cv/list')
      .then(res => setCvList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    setAnalyzeCount(parseInt(localStorage.getItem('analyzeCount') || '0'))
    setInterviewCount(parseInt(localStorage.getItem('interviewCount') || '0'))
  }, [])

  const handleDelete = async (cvId) => {
    if (!confirm('Bu CV\'yi silmek istediğinizden emin misiniz?')) return
    try {
      await api.delete(`/cv/${cvId}`)
      setCvList(cvList.filter(cv => cv.id !== cvId))
    } catch (err) {
      alert('Silme işlemi başarısız')
    }
  }

  if (loading) {
    return <main className="max-w-5xl mx-auto px-6 py-12"><p className="text-gray-400">Yükleniyor...</p></main>
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-4xl font-bold mb-2">Profilim</h2>
      <p className="text-gray-400 mb-10">CV'lerini yönet, analizlerini takip et.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          { label: 'YÜKLENEN CV', value: cvList.length, color: 'text-blue-400' },
          { label: 'ANALİZ YAPILDI', value: analyzeCount, color: 'text-green-400' },
          { label: 'MÜLAKAT TAMAMLANDI', value: interviewCount, color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className={`text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
            <div className="text-gray-400 text-xs tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CV List */}
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold">CV'lerim</h3>
        <Link to="/analyze" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition">
          + Yeni CV Yükle
        </Link>
      </div>

      {cvList.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 text-center mb-6">
          <div className="text-3xl mb-3">📄</div>
          <p className="text-gray-400 mb-4">Yeni bir CV yükleyerek AI destekli analizlerimizi deneyimleyin.</p>
          <Link to="/analyze" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition text-sm">
            CV Yükle →
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-10">
          {cvList.map(cv => (
            <div key={cv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center hover:border-gray-700 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-lg">📄</div>
                <div>
                  <p className="font-medium">{cv.filename}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(cv.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <Link to={`/analyze?cv_id=${cv.id}`} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition">
                  📊 Analiz Et
                </Link>
                <Link to={`/interview?cv_id=${cv.id}`} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition">
                  🎤 Mülakat
                </Link>
                <button onClick={() => handleDelete(cv.id)} className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1 transition">
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
          <div className="border border-dashed border-gray-700 rounded-xl p-6 text-center text-gray-500 text-sm">
            <span>📄</span>
            <p className="mt-1">Yeni bir CV yükleyerek AI destekli analizlerimizi deneyimleyin.</p>
          </div>
        </div>
      )}

      {/* AI Öneri */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-xs text-blue-400 font-medium mb-3">✨ AI ÖNERİSİ</p>
          <h3 className="text-xl font-bold mb-2">Roadmap Hazır!</h3>
          <p className="text-gray-400 text-sm mb-4">Analiz edilen CV'nize göre yazılım mühendisliği pozisyonu için size özel bir öğrenme haritası oluşturduk.</p>
          <Link to="/roadmap" className="text-blue-400 text-sm hover:text-blue-300 transition">
            İncelemeye Başla →
          </Link>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-gray-400 text-sm">HireReady AI Platform Experience</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Dashboard