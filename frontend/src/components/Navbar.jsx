import { Link, useLocation, useNavigate } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const links = [
    { path: '/', label: 'Ana Sayfa' },
    { path: '/analyze', label: 'CV Analiz' },
    { path: '/interview', label: 'Mülakat' },
    { path: '/cover-letter', label: 'Cover Letter' },
    { path: '/roadmap', label: 'Yol Haritası' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-blue-400">HireReady</Link>
      <div className="flex gap-6 items-center">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm transition ${
              location.pathname === link.path
                ? 'text-blue-400 font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
        {token ? (
          <>
            <Link
              to="/dashboard"
              className={`text-sm transition ${
                location.pathname === '/dashboard'
                  ? 'text-blue-400 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Profilim
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Çıkış
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            Giriş Yap
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar