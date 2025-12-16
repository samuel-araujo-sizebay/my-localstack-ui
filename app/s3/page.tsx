'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, Folder, File, Upload, Plus, X, Download, Trash2 } from 'lucide-react'

interface BucketInfo {
  Name?: string
  CreationDate?: Date
}

interface S3Object {
  Key?: string
  LastModified?: Date
  Size?: number
  StorageClass?: string
}

export default function S3Page() {
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [objects, setObjects] = useState<S3Object[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingObjects, setLoadingObjects] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [folderName, setFolderName] = useState('')

  useEffect(() => {
    fetchBuckets()
  }, [])

  const fetchBuckets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/s3/buckets')
      const data = await response.json()
      setBuckets(data.buckets || [])
    } catch (error) {
      console.error('Erro ao carregar buckets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchObjects = async (bucketName: string, prefix?: string) => {
    try {
      setLoadingObjects(true)
      const currentPath = prefix !== undefined ? prefix : currentPrefix
      const url = `/api/s3/buckets/${bucketName}/objects${currentPath ? `?prefix=${encodeURIComponent(currentPath)}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      // Com Delimiter, o S3 já retorna apenas objetos do nível atual
      // Filtrar duplicatas e a própria pasta atual
      const allObjects = data.objects || []
      const uniqueObjects = new Map<string, S3Object>()
      
      allObjects.forEach((obj: S3Object) => {
        if (!obj.Key) return
        
        // Não mostrar a própria pasta atual
        if (obj.Key === currentPath) return
        
        // Se já existe, manter o que tem tamanho maior (arquivo real vs pasta vazia)
        const existing = uniqueObjects.get(obj.Key)
        if (existing) {
          if ((obj.Size || 0) > (existing.Size || 0)) {
            uniqueObjects.set(obj.Key, obj)
          }
        } else {
          uniqueObjects.set(obj.Key, obj)
        }
      })
      
      // Converter para array e ordenar (pastas primeiro, depois arquivos)
      const sortedObjects = Array.from(uniqueObjects.values()).sort((a, b) => {
        const aIsFolder = a.Key?.endsWith('/') ? 1 : 0
        const bIsFolder = b.Key?.endsWith('/') ? 1 : 0
        if (aIsFolder !== bIsFolder) {
          return bIsFolder - aIsFolder // Pastas primeiro
        }
        return (a.Key || '').localeCompare(b.Key || '')
      })
      
      setObjects(sortedObjects)
      setSelectedBucket(bucketName)
      if (prefix !== undefined) {
        setCurrentPrefix(prefix)
      }
    } catch (error) {
      console.error('Erro ao carregar objetos:', error)
    } finally {
      setLoadingObjects(false)
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('pt-BR')
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedBucket) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      if (currentPrefix) {
        formData.append('prefix', currentPrefix)
      }

      const response = await fetch(`/api/s3/buckets/${selectedBucket}/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        alert('Arquivo enviado com sucesso!')
        setShowUploadModal(false)
        fetchObjects(selectedBucket, currentPrefix)
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !selectedBucket || uploading) return

    try {
      setUploading(true)
      const response = await fetch(`/api/s3/buckets/${selectedBucket}/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: folderName.trim(),
          prefix: currentPrefix,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Pasta criada com sucesso!')
        setShowFolderModal(false)
        setFolderName('')
        // Aguardar um pouco antes de atualizar para garantir que o S3 processou
        setTimeout(() => {
          fetchObjects(selectedBucket, currentPrefix)
        }, 500)
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error)
      alert('Erro ao criar pasta')
    } finally {
      setUploading(false)
    }
  }

  const navigateToFolder = (key: string) => {
    if (!key.endsWith('/') || !selectedBucket) return
    
    // Se já estamos em uma pasta, usar a chave completa
    // Se estamos na raiz, usar apenas a chave
    const targetPrefix = key
    fetchObjects(selectedBucket, targetPrefix)
  }

  const goUpFolder = () => {
    if (currentPrefix && selectedBucket) {
      const parts = currentPrefix.split('/').filter(Boolean)
      parts.pop()
      const newPrefix = parts.length > 0 ? parts.join('/') + '/' : ''
      fetchObjects(selectedBucket, newPrefix)
    }
  }

  const handleDownload = async (key: string) => {
    if (!selectedBucket || !key || key.endsWith('/')) return

    try {
      const response = await fetch(
        `/api/s3/buckets/${selectedBucket}/download?key=${encodeURIComponent(key)}`
      )

      if (!response.ok) {
        const data = await response.json()
        alert(`Erro: ${data.error}`)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fileName = key.split('/').pop() || 'download'
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      alert('Erro ao fazer download do arquivo')
    }
  }

  const handleDelete = async (key: string, isFolder: boolean) => {
    if (!selectedBucket || !key) return

    const itemName = isFolder 
      ? key.split('/').filter(Boolean).pop() || 'pasta'
      : key.split('/').pop() || 'arquivo'
    
    const confirmMessage = isFolder
      ? `Tem certeza que deseja deletar a pasta "${itemName}" e todos os seus conteúdos?`
      : `Tem certeza que deseja deletar o arquivo "${itemName}"?`

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(
        `/api/s3/buckets/${selectedBucket}/delete?key=${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Item deletado com sucesso!')
        fetchObjects(selectedBucket, currentPrefix)
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar item')
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
          <Database className="w-10 h-10" />
          S3 Buckets
        </h1>

        {loading ? (
          <div className="text-center py-12">Carregando buckets...</div>
        ) : buckets.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            Nenhum bucket encontrado. Crie um bucket no LocalStack primeiro.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Buckets</h2>
              <div className="space-y-2">
                {buckets.map((bucket) => (
                  <button
                    key={bucket.Name}
                    onClick={() => {
                      setCurrentPrefix('')
                      fetchObjects(bucket.Name!, '')
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedBucket === bucket.Name
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">{bucket.Name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(bucket.CreationDate)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedBucket ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Objetos em: {selectedBucket}
                      </h2>
                      {currentPrefix && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={goUpFolder}
                            className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            Voltar
                          </button>
                          <span className="text-sm text-gray-500 font-mono">
                            {currentPrefix}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFolderModal(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Nova Pasta
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                      <button
                        onClick={() => fetchObjects(selectedBucket, currentPrefix)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        Atualizar
                      </button>
                    </div>
                  </div>

                  {loadingObjects ? (
                    <div className="text-center py-12">Carregando objetos...</div>
                  ) : objects.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500">
                      Nenhum objeto encontrado neste bucket
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Nome</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Tamanho</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Modificado</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {objects.map((obj, index) => {
                            if (!obj.Key) return null
                            
                            // Calcular o nome de exibição
                            let displayName: string
                            if (currentPrefix && obj.Key.startsWith(currentPrefix)) {
                              // Remover o prefixo atual
                              displayName = obj.Key.substring(currentPrefix.length)
                            } else if (!currentPrefix) {
                              // Na raiz, mostrar apenas o primeiro nível
                              const parts = obj.Key.split('/').filter(Boolean)
                              displayName = parts[0] || obj.Key
                            } else {
                              displayName = obj.Key
                            }
                            
                            // Remover barra final se for pasta
                            if (displayName.endsWith('/')) {
                              displayName = displayName.slice(0, -1)
                            }
                            
                            // Se ainda estiver vazio, usar o nome da pasta do prefixo
                            if (!displayName && currentPrefix) {
                              const parts = currentPrefix.split('/').filter(Boolean)
                              displayName = parts[parts.length - 1] || currentPrefix
                            }
                            
                            const isFolder = obj.Key.endsWith('/')
                            const fullKey = obj.Key
                            
                            return (
                              <tr 
                                key={`${obj.Key}-${index}`} 
                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <td 
                                  className={`px-4 py-3 ${isFolder ? 'cursor-pointer' : ''}`}
                                  onClick={() => {
                                    if (isFolder && obj.Key) {
                                      navigateToFolder(obj.Key)
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    {isFolder ? (
                                      <Folder className="w-4 h-4 text-blue-500" />
                                    ) : (
                                      <File className="w-4 h-4 text-gray-500" />
                                    )}
                                    <span className="font-mono text-sm">{displayName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">{formatSize(obj.Size)}</td>
                                <td className="px-4 py-3 text-sm">{formatDate(obj.LastModified)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {!isFolder && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDownload(fullKey)
                                        }}
                                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(fullKey, isFolder)
                                      }}
                                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title={isFolder ? "Deletar pasta" : "Deletar arquivo"}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500">
                  Selecione um bucket para ver seus objetos
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Upload */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Upload de Arquivo</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Selecione o arquivo
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                {currentPrefix && (
                  <p className="text-sm text-gray-500 mt-2">
                    Será salvo em: <span className="font-mono">{currentPrefix}</span>
                  </p>
                )}
              </div>
              {uploading && (
                <div className="text-center text-blue-500">Enviando...</div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Criar Pasta */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Criar Nova Pasta</h3>
                <button
                  onClick={() => {
                    setShowFolderModal(false)
                    setFolderName('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Nome da pasta
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="nome-da-pasta"
                  disabled={uploading}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !uploading) {
                      e.preventDefault()
                      handleCreateFolder()
                    }
                  }}
                />
                {currentPrefix && (
                  <p className="text-sm text-gray-500 mt-2">
                    Será criada em: <span className="font-mono">{currentPrefix}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowFolderModal(false)
                    setFolderName('')
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!folderName.trim() || uploading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

