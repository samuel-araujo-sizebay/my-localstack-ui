import { useState, useEffect } from 'react'
import { ProcessingStatus } from '../interfaces/processing'

/**
 * Hook para gerenciar status de processamento
 */
export function useProcessingStatus(sessionId: string) {
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([])
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // Definir data padrão como hoje
    const today = new Date().toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(today)
  }, [])

  const fetchStatus = async () => {
    if (!sessionId) {
      alert('Session ID é obrigatório')
      return
    }

    try {
      setLoadingStatus(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/returns/processing-status?${params.toString()}`, {
        headers: {
          'x-session-id': sessionId,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao buscar status' }))
        alert(`Erro: ${errorData.error || 'Falha ao buscar status'}`)
        return
      }

      const data = await response.json()
      setStatuses(Array.isArray(data) ? data : data.data || [])
    } catch (error: any) {
      console.error('Erro ao buscar status:', error)
      alert(`Erro ao buscar status: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoadingStatus(false)
    }
  }

  return {
    statuses,
    loadingStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchStatus,
  }
}

