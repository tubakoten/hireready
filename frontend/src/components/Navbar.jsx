import { Link, useLocation, useNavigate } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const links = [
    { path: '/', label: 'Home' },
    { path: '/analyze', label: 'CV Analysis' },
    { path: '/interview', label: 'Interview' },
    { path: '/cover-letter', label: 'Cover Letter' },
    { path: '/roadmap', label: 'Roadmap' },
    { path: '/dashboard', label: 'Dashboard' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-800/50 px-6 py-4 flex items-center justify-between bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold text-white">
        Hire<span className="text-blue-400">Ready</span>
      </Link>
      <div className="flex gap-6 items-center">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm transition ${
              location.pathname === link.path
                ? 'text-white font-medium border-b-2 border-blue-400 pb-1'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {token ? (
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition">
              Login
            </Link>
            <Link to="/register" className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar