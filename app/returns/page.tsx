'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { useReturnsSession } from './hooks/useReturnsSession'
import { SessionIdInput } from './components/SessionIdInput'
import { CsvGenerator } from './components/CsvGenerator'
import { CsvProcessor } from './components/CsvProcessor'
import { ProcessingStatus } from './components/ProcessingStatus'

/**
 * Página principal de Returns
 * Orquestra os componentes e hooks seguindo arquitetura modular
 */
export default function ReturnsPage() {
  const { sessionId, setSessionId } = useReturnsSession()
  const [returnsFileKey, setReturnsFileKey] = useState<string | null>(null)

  const handleFileKeyGenerated = (fileKey: string) => {
    setReturnsFileKey(fileKey)
  }

  const handleProcessSuccess = () => {
    // Atualizar status após processar (será chamado pelo componente ProcessingStatus)
    setTimeout(() => {
      // O componente ProcessingStatus tem seu próprio botão de atualizar
      // Aqui podemos adicionar lógica adicional se necessário
    }, 2000)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <FileText className="w-10 h-10" />
          Test Returns API
        </h1>

        <SessionIdInput 
          sessionId={sessionId} 
          onSessionIdChange={setSessionId} 
        />

        <CsvGenerator 
          sessionId={sessionId}
          onFileKeyGenerated={handleFileKeyGenerated}
        />

        <CsvProcessor 
          sessionId={sessionId}
          returnsFileKey={returnsFileKey}
          onFileKeyGenerated={handleFileKeyGenerated}
          onProcessSuccess={handleProcessSuccess}
        />

        <ProcessingStatus sessionId={sessionId} />
      </div>
    </main>
  )
}
