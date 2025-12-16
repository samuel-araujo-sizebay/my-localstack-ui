'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle, XCircle, Eye, Code } from 'lucide-react'

interface SendDataPoint {
  Timestamp?: Date
  DeliveryAttempts?: number
  Bounces?: number
  Complaints?: number
  Rejects?: number
}

interface SentEmail {
  id?: string
  source?: string
  Source?: string
  destination?: string[]
  Destination?: string[]
  DestinationToAddresses?: string[]
  subject?: string
  Subject?: string
  body?: string
  Body?: {
    Text?: { Data?: string }
    Html?: { Data?: string }
  }
  Message?: {
    Subject?: { Data?: string }
    Body?: {
      Text?: { Data?: string }
      Html?: { Data?: string }
    }
  }
  timestamp?: string
  Timestamp?: string
  raw?: string
  Raw?: {
    Data?: string
  }
}

interface SESData {
  identities: string[]
  sendStatistics: SendDataPoint[]
  sentEmails?: SentEmail[]
  localstackEndpoint?: string
  message?: string
}

export default function SESPage() {
  const [data, setData] = useState<SESData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<{ [key: number]: 'html' | 'text' | 'both' }>({})

  const fetchEmailsRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  
  const fetchEmails = useCallback(async (showLoading = false) => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchEmailsRef.current) return
    fetchEmailsRef.current = true
    
    try {
      // Só mostrar loading na primeira carga ou quando solicitado manualmente
      if (showLoading && isInitialLoadRef.current) {
        setLoading(true)
      }
      
      const response = await fetch('/api/ses/emails', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const result = await response.json()
      
      // Atualizar dados de forma otimizada
      setData((prevData) => {
        // Comparar apenas IDs dos emails para evitar re-render desnecessário
        const prevEmailIds = prevData?.sentEmails?.map(e => e.id || e.Id).join(',') || ''
        const newEmailIds = result.sentEmails?.map((e: any) => e.id || e.Id).join(',') || ''
        
        // Só atualizar se houver mudança nos emails
        if (prevEmailIds !== newEmailIds || !prevData) {
          return result
        }
        
        // Se não mudou, retornar dados anteriores para evitar re-render
        return prevData
      })
    } catch (error) {
      console.error('Erro ao carregar emails:', error)
    } finally {
      fetchEmailsRef.current = false
      if (showLoading && isInitialLoadRef.current) {
        setLoading(false)
        isInitialLoadRef.current = false
        setIsInitialLoad(false)
      }
    }
  }, [])
  
  useEffect(() => {
    fetchEmails(true) // Primeira carga com loading
    
    const interval = setInterval(() => {
      fetchEmails(false) // Atualizações silenciosas
    }, 5000) // Atualizar a cada 5 segundos
    
    return () => clearInterval(interval)
  }, [fetchEmails])

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('pt-BR')
  }

  const decodeHtmlEntities = (html: string): string => {
    if (!html) return ''
    // Decodificar entidades HTML comuns
    return html
      .replace(/&#x3D;/g, '=')
      .replace(/&#x3d;/g, '=')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Mail className="w-10 h-10" />
            SES Emails
          </h1>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/ses/emails/debug')
                  const data = await response.json()
                  console.log('Debug SES:', data)
                  alert('Dados de debug no console do navegador (F12)')
                } catch (error) {
                  console.error('Erro no debug:', error)
                }
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Debug
            </button>
            <button
              onClick={() => fetchEmails(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Atualizar
            </button>
          </div>
        </div>

        {loading && isInitialLoad ? (
          <div className="text-center py-12">Carregando dados do SES...</div>
        ) : !data ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            Erro ao carregar dados do SES. Verifique se o LocalStack está rodando e o serviço SES está habilitado.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identidades Verificadas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Identidades Verificadas
              </h2>
              {data.identities && data.identities.length > 0 ? (
                <div className="space-y-2">
                  {data.identities.map((identity, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="font-mono">{identity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma identidade verificada encontrada
                </p>
              )}
            </div>

            {/* Estatísticas de Envio */}
            {data.sendStatistics && data.sendStatistics.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Estatísticas de Envio</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Tentativas</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Bounces</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Reclamações</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Rejeições</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.sendStatistics.map((stat, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm">{formatDate(stat.Timestamp)}</td>
                          <td className="px-4 py-3 text-sm">{stat.DeliveryAttempts || 0}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={stat.Bounces ? 'text-red-500' : ''}>
                              {stat.Bounces || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={stat.Complaints ? 'text-yellow-500' : ''}>
                              {stat.Complaints || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={stat.Rejects ? 'text-red-500' : ''}>
                              {stat.Rejects || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mensagem Informativa */}
            {data.message && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">{data.message}</p>
                {data.localstackEndpoint && (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    <strong>Endpoint LocalStack:</strong> {data.localstackEndpoint}
                  </p>
                )}
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  <strong>Dica:</strong> Para ver emails no container Docker, execute:
                  <code className="block mt-1 bg-blue-100 dark:bg-blue-900 p-2 rounded font-mono text-xs">
                    docker exec &lt;container_id&gt; ls -la /tmp/localstack/data/ses/
                  </code>
                  Ou acesse diretamente: <code className="font-mono text-xs">{data.localstackEndpoint}/_localstack/ses</code>
                </p>
              </div>
            )}
            
            {(!data.sentEmails || data.sentEmails.length === 0) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Nenhum email encontrado.</strong> Os emails podem estar sendo salvos em arquivos dentro do container Docker.
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  Para visualizar emails salvos em arquivos, você pode:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>Acessar o container: <code className="font-mono text-xs">docker exec -it &lt;container_id&gt; /bin/bash</code></li>
                  <li>Verificar o diretório: <code className="font-mono text-xs">ls -la /tmp/localstack/data/ses/</code></li>
                  <li>Ou configurar o LocalStack para expor os emails via endpoint</li>
                </ul>
              </div>
            )}

            {/* Emails Enviados */}
            {data.sentEmails && data.sentEmails.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Emails Enviados ({data.sentEmails.length})</h2>
                <div className="space-y-4">
                  {data.sentEmails.map((email, index) => {
                    // Normalizar dados do email (diferentes formatos do LocalStack)
                    const source = email.source || email.Source || email.from || email.From || 'N/A'
                    
                    // Extrair destinatários de diferentes formatos
                    let destinations: string[] = []
                    // Verificar se destination é um array de strings ou objetos
                    if (Array.isArray(email.destination)) {
                      destinations = email.destination.map((dest: any) => {
                        if (typeof dest === 'string') return dest
                        if (dest?.ToAddresses) return dest.ToAddresses
                        return dest
                      }).flat().filter(Boolean)
                    } else if (email.destination?.ToAddresses) {
                      destinations = Array.isArray(email.destination.ToAddresses) 
                        ? email.destination.ToAddresses 
                        : [email.destination.ToAddresses]
                    } else if (email.Destination?.ToAddresses) {
                      destinations = Array.isArray(email.Destination.ToAddresses) 
                        ? email.Destination.ToAddresses 
                        : [email.Destination.ToAddresses]
                    } else if (email.Destination) {
                      destinations = Array.isArray(email.Destination) ? email.Destination : [email.Destination]
                    } else if (email.DestinationToAddresses) {
                      destinations = Array.isArray(email.DestinationToAddresses) ? email.DestinationToAddresses : [email.DestinationToAddresses]
                    } else if (email.to) {
                      destinations = Array.isArray(email.to) ? email.to : [email.to]
                    } else if (email.To) {
                      destinations = Array.isArray(email.To) ? email.To : [email.To]
                    } else if (email.recipients) {
                      destinations = Array.isArray(email.recipients) ? email.recipients : [email.recipients]
                    }
                    
                    const subject = email.subject || email.Subject || email.Message?.Subject?.Data || 'Sem assunto'
                    const timestamp = email.timestamp || email.Timestamp
                    
                    // Extrair corpo do email (formato do LocalStack usa html_part e text_part)
                    let bodyText = email.body || email.text || email.content || ''
                    let bodyHtml = email.html || ''
                    
                    // Tentar extrair de estruturas aninhadas
                    if (email.Body) {
                      // Formato do LocalStack: Body: { html_part: "...", text_part: "..." }
                      if (email.Body.html_part) {
                        bodyHtml = email.Body.html_part
                        bodyText = email.Body.text_part || bodyText
                      } else if (email.Body.Html?.Data) {
                        bodyHtml = email.Body.Html.Data
                        bodyText = email.Body.Text?.Data || bodyText
                      } else if (email.Body.Text?.Data) {
                        bodyText = email.Body.Text.Data
                      } else if (email.Body.Html) {
                        bodyHtml = email.Body.Html
                      } else if (email.Body.Text) {
                        bodyText = email.Body.Text
                      }
                    } else if (email.Message?.Body) {
                      bodyText = email.Message.Body.Text?.Data || email.Message.Body.Text || bodyText
                      bodyHtml = email.Message.Body.Html?.Data || email.Message.Body.Html || bodyHtml
                    } else if (email.raw) {
                      bodyText = email.raw
                    } else if (email.Raw?.Data) {
                      bodyText = email.Raw.Data
                    }
                    
                    // Se o bodyText parece ser HTML, mover para bodyHtml
                    if (bodyText && (bodyText.includes('<html') || bodyText.includes('<body') || bodyText.includes('<!DOCTYPE'))) {
                      if (!bodyHtml) {
                        bodyHtml = bodyText
                        bodyText = ''
                      }
                    }
                    
                    // Decodificar entidades HTML antes de renderizar
                    if (bodyHtml) {
                      bodyHtml = decodeHtmlEntities(bodyHtml)
                    }
                    
                    return (
                      <div
                        key={email.id || index}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">De:</span>
                            <p className="font-mono text-sm break-all">{source}</p>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Para:</span>
                            <p className="font-mono text-sm break-all">
                              {destinations.length > 0 ? destinations.join(', ') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Assunto:</span>
                          <p className="text-sm font-medium">{subject}</p>
                        </div>
                        
                        {(bodyHtml || bodyText) && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Conteúdo do Email:</span>
                              {bodyHtml && bodyText && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setViewMode({ ...viewMode, [index]: viewMode[index] === 'html' ? 'both' : 'html' })}
                                    className={`px-2 py-1 text-xs rounded ${
                                      viewMode[index] === 'html' || viewMode[index] === 'both'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <Eye className="w-3 h-3 inline mr-1" />
                                    HTML
                                  </button>
                                  <button
                                    onClick={() => setViewMode({ ...viewMode, [index]: viewMode[index] === 'text' ? 'both' : 'text' })}
                                    className={`px-2 py-1 text-xs rounded ${
                                      viewMode[index] === 'text' || viewMode[index] === 'both'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <Code className="w-3 h-3 inline mr-1" />
                                    Texto
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Renderizar HTML */}
                            {bodyHtml && (viewMode[index] === 'html' || viewMode[index] === 'both' || !viewMode[index]) && (
                              <div className="mb-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Visualização HTML (Renderizado):</div>
                                <div 
                                  className="p-4 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 max-h-96 overflow-auto prose prose-sm dark:prose-invert max-w-none"
                                  style={{
                                    // Estilos para melhorar a renderização do HTML
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    lineHeight: '1.6',
                                  }}
                                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                                />
                              </div>
                            )}
                            
                            {/* Mostrar código HTML */}
                            {bodyHtml && (viewMode[index] === 'text' || viewMode[index] === 'both') && (
                              <div className="mb-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Código HTML:</div>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto">
                                  <code>{bodyHtml}</code>
                                </pre>
                              </div>
                            )}
                            
                            {/* Mostrar texto puro */}
                            {bodyText && (!bodyHtml || viewMode[index] === 'text' || viewMode[index] === 'both') && (
                              <div className="mb-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {bodyHtml ? 'Versão Texto:' : 'Conteúdo:'}
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 whitespace-pre-wrap text-sm">
                                  {bodyText}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {timestamp && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                            Enviado em: {formatDate(new Date(timestamp))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(!data.sendStatistics || data.sendStatistics.length === 0) && (!data.sentEmails || data.sentEmails.length === 0) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                Nenhuma estatística de envio disponível. Envie alguns emails via SES para ver as estatísticas aqui.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

