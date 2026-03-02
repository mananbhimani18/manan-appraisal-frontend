/**
 * Session-Aware Fetch Interceptor
 * 
 * Automatically resets session timeout on every fetch call
 * This ensures API activity is tracked as user activity
 */

let sessionResetCallback = null

/**
 * Initialize the fetch interceptor
 * Call this in App.jsx during initialization
 * 
 * @param {Function} resetTimeoutCallback - The resetTimeout function from useSessionTimeout
 */
export function initSessionAwareFetch(resetTimeoutCallback) {
  sessionResetCallback = resetTimeoutCallback

  // Store original fetch
  const originalFetch = window.fetch

  // Override fetch globally
  window.fetch = function sessionAwareFetch(...args) {
    // Reset timeout before the request
    if (sessionResetCallback) {
      sessionResetCallback()
    }

    // Call original fetch
    const fetchPromise = originalFetch.apply(this, args)

    // Also reset after response (success or failure)
    return fetchPromise
      .then(response => {
        if (sessionResetCallback) {
          sessionResetCallback()
        }
        return response
      })
      .catch(error => {
        if (sessionResetCallback) {
          sessionResetCallback()
        }
        throw error
      })
  }

  console.log('[Session] Fetch interceptor initialized')
}

/**
 * Clean up the fetch interceptor
 * Call this when unmounting or logging out
 */
export function cleanupSessionAwareFetch() {
  sessionResetCallback = null
  console.log('[Session] Fetch interceptor cleaned up')
}
