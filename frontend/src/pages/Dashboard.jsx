import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

function Dashboard() {
  const [cvList, setCvList] = useState([])
  const [analyzeCount, setAnalyzeCount] = useState(0)
  const [interviewCount, setInterviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-gray-400">Yükleniyor...</p>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold mb-2">Profilim</h2>
      <p className="text-gray-400 mb-10">CV'lerini yönet, analizlerini takip et.</p>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-1">{cvList.length}</div>
          <div className="text-gray-400 text-sm">Yüklenen CV</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-green-400 mb-1">{analyzeCount}</div>
          <div className="text-gray-400 text-sm">Analiz Yapıldı</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-purple-400 mb-1">{interviewCount}</div>
          <div className="text-gray-400 text-sm">Mülakat Tamamlandı</div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold">CV'lerim</h3>
        <Link to="/analyze" className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
          + Yeni CV Yükle
        </Link>
      </div>

      {cvList.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">Henüz CV yüklemediniz.</p>
          <Link to="/analyze" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition">
            CV Yükle →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cvList.map(cv => (
            <div key={cv.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">📄 {cv.filename}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(cv.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <Link
                  to={`/analyze?cv_id=${cv.id}`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Analiz Et
                </Link>
                <Link
                  to={`/interview?cv_id=${cv.id}`}
                  className="text-sm text-purple-400 hover:text-purple-300 transition"
                >
                  Mülakat
                </Link>
                <button
                  onClick={() => handleDelete(cv.id)}
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default Dashboard