import { Link, useLocation, useNavigate } from 'react-router-dom'

function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const links = [
    { path: '/', label: 'Ana Sayfa' },
    { path: '/analyze', label: 'CV Analiz' },
    { path: '/interview', label: 'Mülakat' },
    { path: '/cover-letter', label: 'Ön Yazı' },
    { path: '/roadmap', label: 'Yol Haritası' },
    { path: '/dashboard', label: 'Profilim' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm ${
      darkMode ? 'border-gray-800/50 bg-gray-950/80' : 'border-gray-200 bg-white/80'
    }`}>
      <Link to="/" className="text-xl font-bold">
        Hire<span className="text-blue-400">Ready</span>
      </Link>
      <div className="flex gap-6 items-center">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm transition ${
              location.pathname === link.path
                ? 'font-medium border-b-2 border-blue-400 pb-1'
                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition text-lg ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        {token ? (
          <button onClick={handleLogout} className={`text-sm transition ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            Çıkış
          </button>
        ) : (
          <>
            <Link to="/login" className={`text-sm transition ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Giriş</Link>
            <Link to="/register" className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-white">Başla</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar