import { useState, useEffect } from 'react'

const SESSION_ID_STORAGE_KEY = 'returns-session-id'

/**
 * Hook para gerenciar Session ID com persistência no localStorage
 */
export function useReturnsSession() {
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    const savedSessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY)
    if (savedSessionId) {
      setSessionId(savedSessionId)
    }
  }, [])

  const updateSessionId = (value: string) => {
    setSessionId(value)
    localStorage.setItem(SESSION_ID_STORAGE_KEY, value)
  }

  return {
    sessionId,
    setSessionId: updateSessionId,
  }
}

