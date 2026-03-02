import { useEffect, useRef, useCallback } from 'react'

/**
 * Session Timeout Hook
 * 
 * Automatically logs out user after specified inactivity period.
 * Tracks mouse, keyboard, scroll, and API activity.
 * 
 * @param {Function} onLogout - Callback to trigger logout
 * @param {number} timeoutMs - Timeout in milliseconds (default: 1 hour = 3600000ms)
 * @param {number} warningMs - Show warning before logout (optional, default: 5min before timeout)
 * @returns {Function} resetTimeout - Manually reset the inactivity timer
 */
export function useSessionTimeout(onLogout, timeoutMs = 3600000, warningMs = null) {
  const timeoutIdRef = useRef(null)
  const warningIdRef = useRef(null)
  const warningShownRef = useRef(false)
  const isActiveRef = useRef(true)

  // Default warning: 5 minutes before timeout
  const effectiveWarningMs = warningMs ?? Math.max(timeoutMs - 300000, 60000)

  /**
   * Reset the inactivity timer and clear any warnings
   */
  const resetTimeout = useCallback(() => {
    // Clear existing timers
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    if (warningIdRef.current) clearTimeout(warningIdRef.current)

    warningShownRef.current = false
    isActiveRef.current = true

    // Hide any warning if visible
    const warningEl = document.getElementById('session-warning')
    if (warningEl) {
      warningEl.style.display = 'none'
    }

    // Set warning timer
    warningIdRef.current = setTimeout(() => {
      if (!warningShownRef.current && isActiveRef.current) {
        warningShownRef.current = true
        showSessionWarning()
      }
    }, effectiveWarningMs)

    // Set logout timer
    timeoutIdRef.current = setTimeout(() => {
      isActiveRef.current = false
      if (warningShownRef.current) {
        // Warning was shown, now log out
        performLogout()
      } else {
        // No warning shown, just log out
        performLogout()
      }
    }, timeoutMs)
  }, [timeoutMs, effectiveWarningMs])

  /**
   * Show a warning dialog that user will be logged out
   */
  const showSessionWarning = () => {
    console.warn('[Session] Inactivity warning: User will be logged out in 5 minutes');
    
    // Try to show a notification (you can customize this)
    let warningEl = document.getElementById('session-warning')
    if (!warningEl) {
      warningEl = document.createElement('div')
      warningEl.id = 'session-warning'
      warningEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        max-width: 400px;
      `
      document.body.appendChild(warningEl)
    }
    warningEl.textContent = '⚠️ Session timeout soon due to inactivity'
    warningEl.style.display = 'block'

    // Auto-hide warning after 8 seconds
    setTimeout(() => {
      if (warningEl) warningEl.style.display = 'none'
    }, 8000)
  }

  /**
   * Perform the actual logout
   */
  const performLogout = useCallback(() => {
    console.warn('[Session] Session timeout: Logging out due to inactivity')
    
    // Call backend logout to invalidate session (optional but secure)
    fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: localStorage.getItem('user') })
    }).catch(err => console.warn('[Session] Logout API call failed:', err))

    // Clear local data
    localStorage.removeItem('auth')
    localStorage.removeItem('user')

    // Call the logout handler
    onLogout()
  }, [onLogout])

  /**
   * Handle user activity events
   */
  const handleActivity = useCallback(() => {
    if (isActiveRef.current) {
      resetTimeout()
    }
  }, [resetTimeout])

  /**
   * Setup event listeners and timers
   */
  useEffect(() => {
    // Initial timer start
    resetTimeout()

    // Activity event listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })

      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
      if (warningIdRef.current) clearTimeout(warningIdRef.current)
    }
  }, [handleActivity, resetTimeout])

  return resetTimeout
}

/**
 * Create a fetch wrapper that resets session timeout on API calls
 * Use this to wrap all fetch calls in your app
 */
export function createSessionAwareFetch(resetTimeout) {
  return async function sessionAwareFetch(url, options = {}) {
    // Reset timeout before API call
    resetTimeout()

    try {
      const response = await fetch(url, options)
      
      // Reset timeout after successful (or failed) API call
      resetTimeout()

      return response
    } catch (error) {
      // Reset timeout even on error
      resetTimeout()
      throw error
    }
  }
}
