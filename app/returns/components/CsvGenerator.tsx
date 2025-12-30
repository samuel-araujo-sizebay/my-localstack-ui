import { Upload, FileDown, Copy } from 'lucide-react'
import { useCsvGenerator } from '../hooks/useCsvGenerator'
import { useFileUpload } from '../hooks/useFileUpload'
import { ProductFieldType } from '../interfaces/csv'

interface CsvGeneratorProps {
  sessionId: string
  onFileKeyGenerated: (fileKey: string) => void
}

export function CsvGenerator({ sessionId, onFileKeyGenerated }: CsvGeneratorProps) {
  const {
    pastedText,
    setPastedText,
    generatedCsv,
    productFieldType,
    setProductFieldType,
    generateCsv,
    downloadCsv,
    copyCsvToClipboard,
  } = useCsvGenerator()

  const { uploading, uploadFile } = useFileUpload(sessionId)

  const handleUploadGeneratedCsv = async () => {
    if (!generatedCsv || !sessionId) {
      alert('Gere o CSV e informe o Session ID primeiro')
      return
    }

    const csvBlob = new Blob([generatedCsv.csv], { type: 'text/csv' })
    const csvFile = new File([csvBlob], generatedCsv.fileKey.split('/').pop() || 'returns.csv', { type: 'text/csv' })
    
    const success = await uploadFile(csvFile, generatedCsv.fileKey)
    
    if (success) {
      alert(`CSV enviado com sucesso! Arquivo: ${generatedCsv.fileKey}`)
      onFileKeyGenerated(generatedCsv.fileKey)
    }
  }

  return (
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
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Campo de Produto:
          </label>
          <select
            value={productFieldType}
            onChange={(e) => setProductFieldType(e.target.value as ProductFieldType)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="product_id">product_id</option>
            <option value="product_sku">product_sku</option>
            <option value="product_url">product_url</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            O valor extraído será usado no campo selecionado
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={generateCsv}
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
        
        {generatedCsv && (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
              <strong>Arquivo gerado:</strong> <span className="font-mono">{generatedCsv.fileKey}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">CSV Gerado:</label>
              <textarea
                value={generatedCsv.csv}
                readOnly
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-xs h-40"
              />
              <p className="text-sm text-gray-500 mt-2">
                {generatedCsv.csv.split('\n').length - 1} linha(s) gerada(s)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

