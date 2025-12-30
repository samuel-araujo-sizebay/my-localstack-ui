import { Calendar, RefreshCw, CheckCircle, XCircle, FileText, FileDown } from 'lucide-react'
import { useProcessingStatus } from '../hooks/useProcessingStatus'
import { ProcessingStatus as ProcessingStatusType } from '../interfaces/processing'

interface ProcessingStatusProps {
  sessionId: string
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'text-green-500'
    case 'failed':
    case 'error':
      return 'text-red-500'
    case 'processing':
    case 'in_progress':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'failed':
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />
    default:
      return <RefreshCw className="w-5 h-5 text-blue-500" />
  }
}

export function ProcessingStatus({ sessionId }: ProcessingStatusProps) {
  const {
    statuses,
    loadingStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchStatus,
  } = useProcessingStatus(sessionId)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Processing Status
        </h2>
        <button
          onClick={fetchStatus}
          disabled={!sessionId || loadingStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {loadingStatus ? (
        <div className="text-center py-8">Carregando status...</div>
      ) : statuses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum status encontrado. Clique em "Atualizar" para buscar.
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((status) => (
            <StatusCard key={status.processingId} status={status} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatusCard({ status }: { status: ProcessingStatusType }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(status.status)}
          <div>
            <div className="font-semibold">ID: {status.processingId}</div>
            <div className="text-sm text-gray-500">
              Status: <span className={getStatusColor(status.status)}>{status.status}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(status.executionDate).toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <span className="text-sm font-medium">Domain:</span>
          <p className="text-sm">{status.domain}</p>
        </div>
        {status.durationMs && (
          <div>
            <span className="text-sm font-medium">Duration:</span>
            <p className="text-sm">{status.durationMs}ms</p>
          </div>
        )}
      </div>

      {status.stats && (
        <div className={`mb-3 p-3 rounded border ${
          parseInt(String(status.stats.totalErrors)) > 0 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : 'bg-white dark:bg-gray-800'
        }`}>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Processados:</span> {status.stats.totalProcessed}
            </div>
            <div>
              <span className="font-medium">Criados:</span> {status.stats.totalCreated}
            </div>
            <div className={parseInt(String(status.stats.totalErrors)) > 0 ? 'text-red-600 dark:text-red-400' : ''}>
              <span className="font-medium">Erros:</span> {status.stats.totalErrors}
            </div>
            <div className={parseInt(String(status.stats.successRate)) === 0 ? 'text-red-600 dark:text-red-400' : ''}>
              <span className="font-medium">Taxa de Sucesso:</span> {status.stats.successRate}%
            </div>
          </div>
          {parseInt(String(status.stats.totalErrors)) > 0 && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                ⚠️ Erros encontrados no processamento
              </p>
              {status.stats.errorsByType && status.stats.errorsByType.length > 0 ? (
                <div className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Erros por Tipo:</span>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    {status.stats.errorsByType.map((error, idx) => (
                      <li key={idx}>
                        <span className="font-mono">{error.code}</span>: {error.count} ocorrência(s)
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-red-700 dark:text-red-300">
                  Verifique o arquivo de saída (Output) para mais detalhes sobre os erros.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {status.errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-3">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            ❌ Erro no Processamento
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 font-mono">
            {status.errorMessage}
          </p>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {status.inputFileUrl && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Input:</span>
            <a 
              href={status.inputFileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-md"
              title={status.inputFileUrl}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {status.inputFileUrl.split('/').pop()?.split('?')[0] || 'Arquivo de entrada'}
              </span>
            </a>
          </div>
        )}
        {status.outputFileUrl && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Output:</span>
            <a 
              href={status.outputFileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-md"
              title={status.outputFileUrl}
            >
              <FileDown className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {status.outputFileUrl.split('/').pop()?.split('?')[0] || 'Arquivo de saída'}
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

