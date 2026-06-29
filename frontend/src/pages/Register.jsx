import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold mb-2">Kayıt Ol</h2>
      <p className="text-gray-400 mb-8">Yeni hesap oluştur</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Ad Soyad</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm({...form, full_name: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="Adınız Soyadınız"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Şifre</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            placeholder="••••••"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition disabled:opacity-50"
        >
          {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
        </button>
      </div>

      <p className="text-gray-400 text-sm mt-6 text-center">
        Zaten hesabın var mı?{' '}
        <Link to="/login" className="text-blue-400 hover:underline">Giriş yap</Link>
      </p>
    </main>
  )
}

export default Register