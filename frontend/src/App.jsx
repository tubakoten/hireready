import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import Interview from './pages/Interview'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CoverLetter from './pages/CoverLetter'
import Roadmap from './pages/Roadmap'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  return children
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved !== null ? saved === 'true' : true
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-950 text-white' : 'light bg-gray-50 text-gray-900'}`}>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home darkMode={darkMode} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/analyze" element={<ProtectedRoute><Analyze darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><Interview darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><Roadmap darkMode={darkMode} /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App