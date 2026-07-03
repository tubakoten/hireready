import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      setError('Email veya şifre hatalı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hire<span className="text-blue-400">Ready</span>'e Hoş Geldin
          </h1>
          <p className="text-gray-400">Hesabına giriş yap ve kariyerine hazırlan.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Şifre</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>

          <p className="text-gray-400 text-sm mt-6 text-center">
            Hesabın yok mu?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default Login