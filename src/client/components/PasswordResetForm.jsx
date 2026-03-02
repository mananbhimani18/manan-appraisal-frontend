import React, { useState } from 'react'

function PasswordResetForm({ username, onSuccess, onCancel }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    // Validation
    if (!newPassword.trim()) {
      setIsError(true)
      setMessage('New password cannot be empty')
      return
    }

    if (!confirmPassword.trim()) {
      setIsError(true)
      setMessage('Confirm password cannot be empty')
      return
    }

    if (newPassword !== confirmPassword) {
      setIsError(true)
      setMessage('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setIsError(true)
      setMessage('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(data.error || 'Password reset failed')
      }

      setMessage('Password reset successfully! Logging in...')
      setIsError(false)
      
      // Call success callback to trigger auto-login
      setTimeout(() => onSuccess(username), 500)
    } catch (err) {
      setIsError(true)
      setMessage(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <h2 style={{ fontSize: '18px', margin: '0 0 16px', fontWeight: '600' }}>Reset Password</h2>

      <label htmlFor="newPassword">New Password</label>
<div style={{ position: 'relative' }}>
  <input
    id="newPassword"
    type={showNewPassword ? 'text' : 'password'}
    placeholder="Enter new password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    disabled={isLoading}
    style={{
      width: '100%',
      margin: '6px 0 12px',
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--fg)',
      border: '1px solid var(--border)',
      padding: '8px 36px 8px 10px',
      borderRadius: '6px'
    }}
  />

  <span
    onClick={() => setShowNewPassword(!showNewPassword)}
    style={{
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      userSelect: 'none'
    }}
  >
    {showNewPassword ? '🙈' : '👁️'}
  </span>
</div>
      <label htmlFor="confirmPassword">Confirm Password</label>
<div style={{ position: 'relative' }}>
  <input
    id="confirmPassword"
    type={showConfirmPassword ? 'text' : 'password'}
    placeholder="Confirm new password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    disabled={isLoading}
    style={{
      width: '100%',
      margin: '6px 0 16px',
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--fg)',
      border: '1px solid var(--border)',
      padding: '8px 36px 8px 10px',
      borderRadius: '6px',
      opacity: isLoading ? 0.6 : 1,
      transition: 'opacity 0.2s'
    }}
  />

  <span
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    style={{
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      userSelect: 'none'
    }}
  >
    {showConfirmPassword ? '🙈' : '👁️'}
  </span>
</div>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '12px',
            backgroundColor: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            color: isError ? '#ef4444' : '#22c55e',
            borderRadius: '6px',
            fontSize: '14px',
            border: `1px solid ${isError ? '#dc2626' : '#16a34a'}`
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
        <button
          type="submit"
          disabled={isLoading}
          className="btn"
          style={{
            flex: 1,
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'var(--fg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default PasswordResetForm
