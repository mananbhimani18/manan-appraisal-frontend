import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InvalidDataPage from './pages/InvalidDataPage'
import { useSessionTimeout } from './hooks/useSessionTimeout'
import { initSessionAwareFetch } from './hooks/sessionFetchInterceptor'
import NProgress from "nprogress"
import "nprogress/nprogress.css"
import { useLocation } from "react-router-dom"
NProgress.configure({ showSpinner: false, trickleSpeed: 120 })

function RouteProgress() {
  const location = useLocation()

  useEffect(() => {
    NProgress.start()

    const finish = setTimeout(() => {
      NProgress.done()
    }, 500)

    return () => {
      clearTimeout(finish)
      NProgress.done()
    }

  }, [location])

  return null
}
function App() {
const getInitialAuth = () => {
  const auth = localStorage.getItem('auth')
  const loginTime = localStorage.getItem('loginTime')
  const SESSION_LIMIT = 1800000

  if (!auth || !loginTime) return false

  const now = Date.now()
  if (now - loginTime > SESSION_LIMIT) {
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('serverStart') 
    return false
  }

  return true
}

const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth())
const [user, setUser] = useState(localStorage.getItem('user') || '')
  
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'hulk'
    document.body.setAttribute('data-theme', theme)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth')
    localStorage.removeItem('user')
    localStorage.removeItem('loginTime')  // ADD THIS
    localStorage.removeItem('serverStart') 
    setUser('')
    setIsAuthenticated(false)
  }

// Session timeout: 30 minutes, warning 5 minutes before
  const resetSessionTimeout = useSessionTimeout(handleLogout, 1800000, 300000)

useEffect(() => {
  const checkServerRestart = async () => {
    try {
      const saved = localStorage.getItem("serverStart");

      const res = await fetch("/api/server-time");
      const data = await res.json();

      if (!saved) {
        localStorage.setItem("serverStart", data.startTime);
        return;
      }

      if (String(saved) !== String(data.startTime)) {
        handleLogout();
      }

    } catch (err) {
      console.error("Server check failed");
    }
  };

  checkServerRestart();

  const interval = setInterval(checkServerRestart, 5000);

  return () => clearInterval(interval);
}, []);

  // Initialize fetch interceptor to track API activity
  useEffect(() => {
    if (isAuthenticated) {
      initSessionAwareFetch(resetSessionTimeout)
    }
  }, [isAuthenticated, resetSessionTimeout])

  const handleLogin = (username) => {
    localStorage.setItem('auth', 'hr')
    localStorage.setItem('user', username)
    localStorage.setItem('loginTime', Date.now())   // ADD THIS
    setUser(username)
    setIsAuthenticated(true)
  }

  return (
    <Router>
       <RouteProgress />
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
