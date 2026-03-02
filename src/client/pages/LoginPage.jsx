import React, { useState } from 'react'
import logo from "../pages/logo.png";
import PasswordResetForm from '../components/PasswordResetForm'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [resetStage, setResetStage] = useState("idle")
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)


  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(data.error || 'Login failed')
      }
      
      onLogin(username)
    } catch (err) {
      setIsError(true)
      setMessage(err.message)
    }
  }

  const handleForgot = async (e) => {
  e.preventDefault()

  if (!username.trim()) {
    setIsError(true)
    setMessage('Enter your username first')
    return
  }

  try {
    setMessage('')
    setIsError(false)

    const res = await fetch('/api/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'User not found')
    }

    // ✅ ONLY OPEN RESET FORM IF USER EXISTS
    setResetStage("request")

  } catch (err) {
    setIsError(true)
    setMessage(err.message)
  }
}

const handleVerifyOtp = async () => {
  if (!otp.trim()) {
    setIsError(true)
    setMessage("Enter OTP")
    return
  }

  try {
    setIsError(false)
    setMessage("")

    const res = await fetch('/api/verify-otp', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, otp })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "OTP invalid")
    }

    // ✅ ONLY IF OTP CORRECT
    setMessage("OTP verified")
    setResetStage("reset")

  } catch(err) {
    setIsError(true)
    setMessage(err.message)
  }
}

  const handleResetSuccess = (user) => {
    // Auto-login after successful password reset
    onLogin(user)
  }

  const handleResetCancel = () => {
    setResetStage("idle")
    setMessage('')
    setPassword('')
  }

  return (
    <main style={{ padding: '20px', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
<div className="card" style={{ width: '360px', padding: '20px' }}>
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
    <img src={logo} alt="TecnoPrism" className="brand large" />
  </div>

  {/* ⭐ ADD THIS WRAPPER */}
  <div>
  {resetStage === "idle" ? (

  <form onSubmit={handleSubmit}>
    <h1 style={{ margin: '0 0 12px' }}>Sign In</h1>

    <label htmlFor="username">Username</label>
    <input
      id="username"
      type="text"
      placeholder="username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      style={{ width: '100%', margin: '6px 0 12px', background: 'rgba(255,255,255,0.06)', color: 'var(--fg)', border: '1px solid var(--border)', padding: '8px 10px', borderRadius: '6px' }}
    />

    <label htmlFor="password">Password</label>

<div style={{ position: 'relative', marginBottom: '16px' }}>
  <input
    id="password"
    type={showPassword ? 'text' : 'password'}
    placeholder="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      width: '100%',
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--fg)',
      border: '1px solid var(--border)',
      padding: '8px 36px 8px 10px',
      borderRadius: '6px'
    }}
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      userSelect: 'none'
    }}
  >
    {showPassword ? '🙈' : '👁️'}
  </span>
</div>


    {message && (
      <div style={{ fontSize: '14px', marginBottom: '12px', color: isError ? '#ef4444' : '#22c55e' }}>
        {message}
      </div>
    )}

    <button type="submit" className="btn" style={{ width: '100%' }}>Sign In</button>

    <div style={{ marginTop: '10px' }}>
      <button
        type="button"
        onClick={handleForgot}
        style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Forgot password?
      </button>
    </div>
  </form>

) : resetStage === "request" ? (

  /* ✅ THIS WAS MISSING */
  <div>
    <h2>Reset Password</h2>

    <label>Email</label>
    <input
      type="email"
      placeholder="Enter registered email"
      value={email}
      onChange={(e)=>setEmail(e.target.value)}
      style={{
        width:'100%',
        margin:'6px 0 16px',
        background:'rgba(255,255,255,0.06)',
        color:'var(--fg)',
        border:'1px solid var(--border)',
        padding:'8px 10px',
        borderRadius:'6px'
      }}
    />

    <button
  type="button"
  className="btn"
  style={{width:'100%'}}
  onClick={async () => {
  if (!email.trim()) {
    setIsError(true)
    setMessage("Enter email")
    return
  }

  try {
    setIsError(false)
    setMessage("")

    const res = await fetch('/api/send-otp', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, email })
    })

    const data = await res.json()

    if (!res.ok) throw new Error(data.error || "OTP failed")

    setMessage("OTP sent to your email")
    setResetStage("otp")

  } catch(err) {
    setIsError(true)
    setMessage(err.message)
  }
}}
>
  Send OTP
</button>

    <button
      type="button"
      onClick={()=>setResetStage("idle")}
      style={{marginTop:'10px'}}
    >
      Back
    </button>
  </div>

) : resetStage === "otp" ? (
  <>
    <h2>Enter OTP</h2>

    <input
      type="text"
      placeholder="Enter OTP"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
      style={{
        width: '100%',
        margin: '10px 0',
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--fg)',
        border: '1px solid var(--border)',
        padding: '8px 10px',
        borderRadius: '6px'
      }}
    />

    <button className="btn" onClick={handleVerifyOtp} style={{ width:'100%' }}>
      Verify OTP
    </button>
  </>

) : resetStage === "reset" ? (

  <PasswordResetForm
    username={username}
    onSuccess={handleResetSuccess}
    onCancel={handleResetCancel}
  />

) : null}
  </div>
</div>
</main>
  )
}

export default LoginPage
