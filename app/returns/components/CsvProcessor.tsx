import { useRef, useEffect } from 'react'
import { FileText, RefreshCw } from 'lucide-react'
import { useCsvProcessor } from '../hooks/useCsvProcessor'
import { useFileUpload } from '../hooks/useFileUpload'

interface CsvProcessorProps {
  sessionId: string
  returnsFileKey: string | null
  onFileKeyGenerated: (fileKey: string) => void
  onProcessSuccess: () => void
}

export function CsvProcessor({ 
  sessionId, 
  returnsFileKey: externalReturnsFileKey, 
  onFileKeyGenerated,
  onProcessSuccess 
}: CsvProcessorProps) {
  const {
    returnsFileKey: internalReturnsFileKey,
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
    setReturnsFileKey,
  } = useCsvProcessor(sessionId)

  const { uploading, uploadFile } = useFileUpload(sessionId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar returnsFileKey externo com o interno
  useEffect(() => {
    if (externalReturnsFileKey && externalReturnsFileKey !== internalReturnsFileKey) {
      setReturnsFileKey(externalReturnsFileKey)
    }
  }, [externalReturnsFileKey, internalReturnsFileKey, setReturnsFileKey])

  // Usar o fileKey externo se disponível, senão usar o interno
  const currentReturnsFileKey = externalReturnsFileKey || internalReturnsFileKey

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (!sessionId) {
      alert('Session ID é obrigatório para fazer upload')
      return
    }

    if (uploading) {
      console.log('Upload já em andamento')
      return
    }

    const timestamp = Date.now()
    const fileName = `returns-${timestamp}.csv`
    const targetFileKey = fileName
    setReturnsFileKey(targetFileKey)
    onFileKeyGenerated(targetFileKey)

    const success = await uploadFile(file, targetFileKey)
    
    if (success) {
      alert(`Arquivo enviado com sucesso!`)
    }
  }

  const handleProcess = () => {
    processCsv(onProcessSuccess, currentReturnsFileKey || undefined)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6" />
        Processar CSV
      </h2>
      
      <div className="space-y-4">
        {currentReturnsFileKey ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Arquivo para processamento:
            </p>
            <p className="text-sm font-mono text-blue-700 dark:text-blue-300">
              {currentReturnsFileKey}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Faça upload de um arquivo CSV ou gere um CSV a partir do texto acima
            </p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Fazer upload de arquivo CSV:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            disabled={uploading || !sessionId}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm disabled:opacity-50"
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Fazendo upload do arquivo...
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Domain *</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="www.calzedonia.com"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="enableNotification"
            checked={enableNotification}
            onChange={(e) => setEnableNotification(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="enableNotification" className="text-sm font-medium">
            Habilitar notificações por email (opcional)
          </label>
        </div>

        {enableNotification && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Email *</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="example@sizebay.com"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Name *</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Roberto Alves"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Process Type</label>
          <select
            value={processType}
            onChange={(e) => setProcessType(e.target.value as any)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="PRODUCT_ID">PRODUCT_ID</option>
            <option value="PRODUCT_SKU">PRODUCT_SKU</option>
            <option value="PRODUCT_ID_ON_ORDER_PERMALINK">PRODUCT_ID_ON_ORDER_PERMALINK</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ignoreOrderedSize"
            checked={ignoreOrderedSize}
            onChange={(e) => setIgnoreOrderedSize(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="ignoreOrderedSize" className="text-sm">
            Ignore Ordered Size
          </label>
        </div>

        <button
          onClick={handleProcess}
          disabled={!sessionId || processing || !currentReturnsFileKey}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {processing ? 'Processando...' : 'Processar CSV'}
        </button>
      </div>
    </div>
  )
}

