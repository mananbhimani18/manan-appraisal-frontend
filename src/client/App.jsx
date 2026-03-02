import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InvalidDataPage from './pages/InvalidDataPage'
import { useSessionTimeout } from './hooks/useSessionTimeout'
import { initSessionAwareFetch } from './hooks/sessionFetchInterceptor'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth'))
  const [user, setUser] = useState(localStorage.getItem('user') || '')

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'hulk'
    document.body.setAttribute('data-theme', theme)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    setUser('')
    setIsAuthenticated(false)
  }

// Session timeout: 30 minutes, warning 5 minutes before
  const resetSessionTimeout = useSessionTimeout(handleLogout, 1800000, 300000)

  // Initialize fetch interceptor to track API activity
  useEffect(() => {
    if (isAuthenticated) {
      initSessionAwareFetch(resetSessionTimeout)
    }
  }, [isAuthenticated, resetSessionTimeout])

  const handleLogin = (username) => {
    localStorage.setItem('auth', 'hr')
    localStorage.setItem('user', username)
    setUser(username)
    setIsAuthenticated(true)
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <DashboardPage user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route path="/invalid" element={isAuthenticated ? <InvalidDataPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
