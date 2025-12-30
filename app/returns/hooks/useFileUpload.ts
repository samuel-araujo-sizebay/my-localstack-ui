import { useState, useRef } from 'react'

/**
 * Hook para gerenciar upload de arquivos
 */
export function useFileUpload(sessionId: string) {
  const [uploading, setUploading] = useState(false)
  const isUploadingRef = useRef(false)

  const uploadFile = async (file: File, targetFileKey: string): Promise<boolean> => {
    if (!sessionId) {
      alert('Session ID é obrigatório')
      return false
    }

    // Prevenir múltiplos uploads simultâneos
    if (isUploadingRef.current) {
      console.log('Upload já em andamento, ignorando...')
      return false
    }

    try {
      isUploadingRef.current = true
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileKey', targetFileKey)

      const uploadResponse = await fetch('/api/returns/upload', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Falha ao fazer upload' }))
        alert(`Erro ao fazer upload: ${errorData.error || 'Erro desconhecido'}`)
        return false
      }

      await uploadResponse.json()
      return true
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`)
      return false
    } finally {
      isUploadingRef.current = false
      setUploading(false)
    }
  }

  return {
    uploading,
    uploadFile,
  }
}

