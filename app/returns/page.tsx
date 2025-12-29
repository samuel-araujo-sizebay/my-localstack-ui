'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, RefreshCw, Calendar, FileDown, Copy } from 'lucide-react'

interface ProcessingStatus {
  processingId: string
  status: string
  executionDate: string
  domain: string
  inputFileUrl: string
  outputFileUrl?: string
  durationMs?: number
  errorMessage?: string
  stats?: {
    totalProcessed: number
    totalCreated: number
    totalErrors: number
    successRate: number
    errorsByType?: Array<{
      code: string
      count: number
    }>
  }
}

export default function ReturnsPage() {
  const [sessionId, setSessionId] = useState('')
  const [fileKey, setFileKey] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUploadingRef = useRef(false)
  
  // Process CSV
  const [returnsFileKey, setReturnsFileKey] = useState('')
  const [domain, setDomain] = useState('preprod.na-kd.com')
  const [recipientEmail, setRecipientEmail] = useState('samuel.araujo@sizebay.com')
  const [recipientName, setRecipientName] = useState('samuel')
  const [processType, setProcessType] = useState('PRODUCT_ID')
  const [ignoreOrderedSize, setIgnoreOrderedSize] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Status
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([])
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // CSV Generation
  const [pastedText, setPastedText] = useState('')
  const [generatedCsv, setGeneratedCsv] = useState('')
  const [csvFileName, setCsvFileName] = useState('returns.csv')

  useEffect(() => {
    // Carregar sessionId do localStorage se existir
    const savedSessionId = localStorage.getItem('returns-session-id')
    if (savedSessionId) {
      setSessionId(savedSessionId)
    }
    
    // Definir data padrão como hoje
    const today = new Date().toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(today)
  }, [])

  const handleSessionIdChange = (value: string) => {
    setSessionId(value)
    localStorage.setItem('returns-session-id', value)
  }

  // Função unificada para fazer upload de arquivo (via API route para evitar CORS)
  const handleFileUpload = async (file: File, targetFileKey: string) => {
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

      // Fazer upload através da API route (evita problemas de CORS)
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

      const data = await uploadResponse.json()
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

  const handleProcessCsv = async () => {
    if (!sessionId || !returnsFileKey || !domain || !recipientEmail || !recipientName) {
      if (!returnsFileKey) {
        alert('É necessário gerar um CSV ou fazer upload de um arquivo primeiro')
      } else {
        alert('Preencha todos os campos obrigatórios (Domain, Recipient Email, Recipient Name)')
      }
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/returns/process-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          returnsFileKey,
          domain,
          notification: {
            recipientEmail,
            recipientName,
          },
          processType,
          ignoreOrderedSize,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao processar CSV' }))
        alert(`Erro: ${errorData.error || 'Falha ao processar CSV'}`)
        return
      }

      const data = await response.json()
      alert('Processamento iniciado com sucesso!')
      // Atualizar status após processar
      setTimeout(() => fetchStatus(), 2000)
    } catch (error: any) {
      console.error('Erro ao processar CSV:', error)
      alert(`Erro ao processar CSV: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setProcessing(false)
    }
  }

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

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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

  const generateCsvFromText = () => {
    if (!pastedText.trim()) {
      alert('Cole o texto primeiro')
      return
    }

    try {
      // Extrair Order ID (formato: PREP50017952914 ou similar)
      const orderIdMatch = pastedText.match(/ID:\s*([A-Z0-9]+)/i) || pastedText.match(/(PREP\d+|XXX_\w+)/i)
      
      // Extrair Order Date (formato: 12/29/2025 ou MM/DD/YYYY)
      const orderDateMatch = pastedText.match(/Order date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) || pastedText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
      
      // Converter data de MM/DD/YYYY para YYYY-MM-DD
      let formattedDate = ''
      if (orderDateMatch) {
        const dateParts = orderDateMatch[1].split('/')
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
        }
      }
      
      const lines = pastedText.split('\n').map(l => l.trim()).filter(l => l)
      const products: any[] = []
      
      // Procurar por padrões de tabela de produtos
      // Formato esperado: SKU na primeira coluna, Product na terceira, etc.
      let foundTableStart = false
      let headerIndex = -1
      
      // Encontrar onde começa a tabela de produtos
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('ID') && lines[i].includes('SKU') && lines[i].includes('Product')) {
          headerIndex = i
          foundTableStart = true
          break
        }
      }
      
      if (foundTableStart && headerIndex >= 0) {
        // Processar linhas após o cabeçalho
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i]
          if (!line || line.length < 10) continue
          
          // Dividir por tabs ou múltiplos espaços
          const columns = line.split(/\t+/).filter(c => c.trim())
          if (columns.length < 3) {
            // Tentar dividir por múltiplos espaços
            const spaceColumns = line.split(/\s{2,}/).filter(c => c.trim())
            if (spaceColumns.length >= 3) {
              columns.push(...spaceColumns)
            }
          }
          
          // Procurar por SKU no formato: 1704-000043-0179-000
          const skuMatch = line.match(/(\d{4}-\d{6}-\d{4}-\d{3})/)
          if (skuMatch) {
            const sku = skuMatch[1]
            
            // Encontrar nome do produto (geralmente após o SKU)
            let productName = 'Unknown Product'
            const skuIndex = line.indexOf(sku)
            const afterSku = line.substring(skuIndex + sku.length).trim()
            const productMatch = afterSku.match(/^([A-Za-z][A-Za-z\s&]+?)(?:\s+--|\s+\d|$)/i)
            if (productMatch) {
              productName = productMatch[1].trim()
            } else if (columns.length > 2) {
              // Tentar pegar da terceira coluna
              productName = columns[2]?.trim() || columns[1]?.trim() || 'Unknown Product'
            }
            
            // Encontrar tamanho comprado
            let purchasedSize = 'One Size'
            if (line.includes('One Size')) {
              purchasedSize = 'One Size'
            } else {
              const sizeMatch = line.match(/Size[:\s]+([A-Z0-9\s]+)/i)
              if (sizeMatch) {
                purchasedSize = sizeMatch[1].trim()
              } else if (columns.length > 4) {
                purchasedSize = columns[4]?.trim() || 'One Size'
              }
            }
            
            // Encontrar preço
            let price = '0'
            const priceMatch = line.match(/(\d+\.?\d*)\s*EUR/i)
            if (priceMatch) {
              price = priceMatch[1]
            } else if (columns.length > 5) {
              const priceCol = columns[5]?.replace(/EUR/i, '').trim()
              if (priceCol) price = priceCol
            }
            
            // Quantidade (geralmente 1 se não especificado)
            let quantity = '1'
            if (columns.length > 3) {
              const qtyMatch = columns[3]?.match(/(\d+)/)
              if (qtyMatch) quantity = qtyMatch[1]
            }
            
            products.push({
              orderId: orderIdMatch?.[1] || 'UNKNOWN',
              orderDate: formattedDate || orderDateMatch?.[1] || '',
              productIdentifier: sku,
              sizeOrdered: purchasedSize,
              quantity: quantity,
            })
          }
        }
      }
      
      // Se não encontrou na tabela, tentar busca mais genérica
      if (products.length === 0) {
        // Buscar todos os SKUs no texto
        const allSkus = pastedText.matchAll(/(\d{4}-\d{6}-\d{4}-\d{3})/g)
        const skuArray = Array.from(allSkus)
        
        for (const skuMatch of skuArray) {
          const sku = skuMatch[1]
          const skuIndex = skuMatch.index || 0
          
          // Tentar encontrar produto próximo ao SKU
          const context = pastedText.substring(Math.max(0, skuIndex - 50), skuIndex + 200)
          let productName = 'Unknown Product'
          
          // Procurar por nome de produto após o SKU
          const afterSku = context.substring(context.indexOf(sku) + sku.length)
          const productMatch = afterSku.match(/([A-Za-z][A-Za-z\s&]{3,30})/i)
          if (productMatch) {
            productName = productMatch[1].trim()
          }
          
          // Procurar preço
          let price = '0'
          const priceMatch = context.match(/(\d+\.?\d*)\s*EUR/i)
          if (priceMatch) {
            price = priceMatch[1]
          }
          
          products.push({
            orderId: orderIdMatch?.[1] || 'UNKNOWN',
            orderDate: formattedDate || '',
            productIdentifier: sku,
            sizeOrdered: 'One Size',
            quantity: '1',
          })
        }
      }
      
      if (products.length === 0) {
        alert('Não foi possível extrair dados do texto. Verifique o formato.')
        return
      }
      
      // Gerar CSV no formato correto da API
      // Formato: order_id, order_date, product_id/sku/url, size_ordered, return_reason
      const headers = ['order_id', 'order_date', 'product_id/sku/url', 'size_ordered', 'return_reason']
      const csvRows = [
        headers.join(','), // Usar vírgula como separador
        ...products.map(p => {
          // Converter data de YYYY-MM-DD para MM/DD/YYYY se necessário
          let formattedOrderDate = p.orderDate
          if (formattedOrderDate && formattedOrderDate.includes('-')) {
            const parts = formattedOrderDate.split('-')
            if (parts.length === 3) {
              formattedOrderDate = `${parts[1]}/${parts[2]}/${parts[0]}`
            }
          }
          
          return [
            p.orderId, // order_id
            formattedOrderDate || '', // order_date
            p.productIdentifier, // product_id/sku/url
            p.sizeOrdered, // size_ordered
            'UNKNOWN', // return_reason padrão
          ].join(',')
        })
      ]
      
      const csv = csvRows.join('\n')
      setGeneratedCsv(csv)
      
      // Gerar automaticamente o nome do arquivo com timestamp (sempre novo)
      // A API adiciona o prefixo automaticamente, então passamos apenas o nome do arquivo
      const timestamp = Date.now()
      const fileName = `returns-${timestamp}.csv`
      const autoFileKey = fileName // Apenas o nome do arquivo, sem prefixo
      setReturnsFileKey(autoFileKey)
      setCsvFileName(fileName)
      
      // Sempre atualizar o fileKey com o novo timestamp
      setFileKey(autoFileKey)
    } catch (error: any) {
      console.error('Erro ao gerar CSV:', error)
      alert(`Erro ao gerar CSV: ${error.message || 'Verifique o formato do texto.'}`)
    }
  }

  const downloadCsv = () => {
    if (!generatedCsv) {
      alert('Gere o CSV primeiro')
      return
    }
    
    const blob = new Blob([generatedCsv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = csvFileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const copyCsvToClipboard = () => {
    if (!generatedCsv) {
      alert('Gere o CSV primeiro')
      return
    }
    
    navigator.clipboard.writeText(generatedCsv).then(() => {
      alert('CSV copiado para a área de transferência!')
    }).catch(() => {
      alert('Erro ao copiar CSV')
    })
  }

  const handleUploadGeneratedCsv = async () => {
    if (!generatedCsv || !sessionId) {
      alert('Gere o CSV e informe o Session ID primeiro')
      return
    }

    if (!returnsFileKey) {
      alert('Erro: nome do arquivo não foi gerado')
      return
    }

    // Criar Blob do CSV e fazer upload automaticamente
    const csvBlob = new Blob([generatedCsv], { type: 'text/csv' })
    const csvFile = new File([csvBlob], returnsFileKey.split('/').pop() || 'returns.csv', { type: 'text/csv' })
    
    const success = await handleFileUpload(csvFile, returnsFileKey)
    
    if (success) {
      alert(`CSV enviado com sucesso! Arquivo: ${returnsFileKey}`)
      // Preencher automaticamente o campo de processamento
      setFileKey(returnsFileKey)
    }
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

        {/* Session ID */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-semibold mb-2">
            Session ID (x-session-id) *
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => handleSessionIdChange(e.target.value)}
            placeholder="Digite o session ID"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* CSV Generation Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileDown className="w-6 h-6" />
            Gerar CSV a partir de Texto
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cole o texto do pedido/ordem aqui:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Cole aqui o texto completo do pedido..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-40 font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={generateCsvFromText}
                disabled={!pastedText.trim()}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                Gerar CSV
              </button>
              
              {generatedCsv && (
                <>
                  <button
                    onClick={handleUploadGeneratedCsv}
                    disabled={!sessionId || uploading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Enviando...' : 'Upload CSV'}
                  </button>
                  <button
                    onClick={downloadCsv}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={copyCsvToClipboard}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar CSV
                  </button>
                </>
              )}
            </div>
            
            {generatedCsv && returnsFileKey && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                <strong>Arquivo gerado:</strong> <span className="font-mono">{returnsFileKey}</span>
              </div>
            )}
            
            {generatedCsv && (
              <div>
                <label className="block text-sm font-medium mb-2">CSV Gerado:</label>
                <textarea
                  value={generatedCsv}
                  readOnly
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-xs h-40"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {generatedCsv.split('\n').length - 1} linha(s) gerada(s)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Process CSV Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Processar CSV
          </h2>
          
          <div className="space-y-4">
            {/* Informação do arquivo que será processado */}
            {returnsFileKey ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Arquivo para processamento:
                </p>
                <p className="text-sm font-mono text-blue-700 dark:text-blue-300">
                  {returnsFileKey}
                </p>
                {generatedCsv && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ✓ CSV gerado automaticamente do texto
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {generatedCsv 
                    ? 'Clique em "Upload CSV" acima para enviar o arquivo gerado'
                    : 'Faça upload de um arquivo CSV ou gere um CSV a partir do texto acima'
                  }
                </p>
              </div>
            )}
            
            {/* Opção de upload de arquivo (só aparece se não tiver CSV gerado) */}
            {!generatedCsv && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fazer upload de arquivo CSV:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // Resetar o input para permitir selecionar o mesmo arquivo novamente
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }

                    if (!sessionId) {
                      alert('Session ID é obrigatório para fazer upload')
                      return
                    }

                    // Prevenir múltiplos uploads simultâneos
                    if (isUploadingRef.current || uploading) {
                      console.log('Upload já em andamento')
                      return
                    }

                    // Gerar fileKey automaticamente
                    // A API adiciona o prefixo automaticamente, então passamos apenas o nome do arquivo
                    const timestamp = Date.now()
                    const fileName = `returns-${timestamp}.csv`
                    const targetFileKey = fileName // Apenas o nome do arquivo, sem prefixo
                    setReturnsFileKey(targetFileKey)
                    setFileKey(targetFileKey)

                    // Fazer upload automaticamente
                    setSelectedFile(file)
                    const success = await handleFileUpload(file, targetFileKey)
                    
                    if (success) {
                      alert(`Arquivo enviado com sucesso!`)
                    }
                  }}
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
            )}

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

            <div>
              <label className="block text-sm font-medium mb-2">Process Type</label>
                <select
                  value={processType}
                  onChange={(e) => setProcessType(e.target.value)}
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
              onClick={handleProcessCsv}
              disabled={!sessionId || processing}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {processing ? 'Processando...' : 'Processar CSV'}
            </button>
          </div>
        </div>

        {/* Status Section */}
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
                <div
                  key={status.processingId}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
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

                  <div className="mt-3 space-y-1 text-sm">
                    {status.inputFileUrl && (
                      <div>
                        <span className="font-medium">Input:</span>{' '}
                        <a href={status.inputFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {status.inputFileUrl}
                        </a>
                      </div>
                    )}
                    {status.outputFileUrl && (
                      <div>
                        <span className="font-medium">Output:</span>{' '}
                        <a href={status.outputFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {status.outputFileUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

