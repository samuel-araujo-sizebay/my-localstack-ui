import { useState } from 'react'
import { ProcessCsvParams } from '../interfaces/csv'

/**
 * Hook para gerenciar processamento de CSV
 */
export function useCsvProcessor(sessionId: string) {
  const [returnsFileKey, setReturnsFileKey] = useState('')
  const [domain, setDomain] = useState('preprod.na-kd.com')
  const [enableNotification, setEnableNotification] = useState(true)
  const [recipientEmail, setRecipientEmail] = useState('samuel.araujo@sizebay.com')
  const [recipientName, setRecipientName] = useState('samuel')
  const [processType, setProcessType] = useState<'PRODUCT_ID' | 'PRODUCT_SKU' | 'PRODUCT_ID_ON_ORDER_PERMALINK'>('PRODUCT_ID')
  const [ignoreOrderedSize, setIgnoreOrderedSize] = useState(false)
  const [processing, setProcessing] = useState(false)

  const processCsv = async (onSuccess?: () => void, fileKeyOverride?: string) => {
    const fileKeyToUse = fileKeyOverride || returnsFileKey
    
    if (!sessionId || !fileKeyToUse || !domain) {
      if (!fileKeyToUse) {
        alert('É necessário gerar um CSV ou fazer upload de um arquivo primeiro')
      } else {
        alert('Preencha todos os campos obrigatórios (Domain)')
      }
      return
    }

    // Validar campos de notificação apenas se estiver habilitada
    if (enableNotification && (!recipientEmail || !recipientName)) {
      alert('Se as notificações estiverem habilitadas, preencha Recipient Email e Recipient Name')
      return
    }

    try {
      setProcessing(true)

      const payload: ProcessCsvParams = {
        returnsFileKey: fileKeyToUse,
        domain,
        processType,
        ignoreOrderedSize,
      }

      // Adicionar notification apenas se estiver habilitada
      if (enableNotification) {
        payload.notification = {
          recipientEmail,
          recipientName,
        }
      }

      const response = await fetch('/api/returns/process-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao processar CSV' }))
        alert(`Erro: ${errorData.error || 'Falha ao processar CSV'}`)
        return
      }

      await response.json()
      alert('Processamento iniciado com sucesso!')
      onSuccess?.()
    } catch (error: any) {
      console.error('Erro ao processar CSV:', error)
      alert(`Erro ao processar CSV: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setProcessing(false)
    }
  }

  return {
    returnsFileKey,
    setReturnsFileKey,
    domain,
    setDomain,
    enableNotification,
    setEnableNotification,
    recipientEmail,
    setRecipientEmail,
    recipientName,
    setRecipientName,
    processType,
    setProcessType,
    ignoreOrderedSize,
    setIgnoreOrderedSize,
    processing,
    processCsv,
  }
}

