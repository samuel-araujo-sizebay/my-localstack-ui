import { useState } from 'react'
import { CsvParser } from '../domain/csv/CsvParser'
import { CsvGenerator } from '../domain/csv/CsvGenerator'
import { ProductFieldType, CsvGenerationResult } from '../interfaces/csv'

/**
 * Hook para gerenciar geração de CSV a partir de texto
 */
export function useCsvGenerator() {
  const [pastedText, setPastedText] = useState('')
  const [generatedCsv, setGeneratedCsv] = useState<CsvGenerationResult | null>(null)
  const [productFieldType, setProductFieldType] = useState<ProductFieldType>('product_sku')

  const generateCsv = () => {
    if (!pastedText.trim()) {
      alert('Cole o texto primeiro')
      return
    }

    try {
      // Parse do texto usando o serviço de domínio
      const products = CsvParser.parse(pastedText)

      if (products.length === 0) {
        alert('Não foi possível extrair dados do texto. Verifique o formato.')
        return
      }

      // Debug: verificar se os tamanhos estão sendo extraídos corretamente
      console.log('Produtos parseados:', products)

      // Gerar CSV usando o serviço de domínio
      const result = CsvGenerator.generate(products, productFieldType)
      console.log('CSV gerado:', result)
      setGeneratedCsv(result)
    } catch (error: any) {
      console.error('Erro ao gerar CSV:', error)
      alert(`Erro ao gerar CSV: ${error.message || 'Verifique o formato do texto.'}`)
    }
  }

  const updateCsv = (newCsv: string) => {
    if (generatedCsv) {
      setGeneratedCsv({
        ...generatedCsv,
        csv: newCsv,
      })
    }
  }

  const downloadCsv = () => {
    if (!generatedCsv) {
      alert('Gere o CSV primeiro')
      return
    }

    const blob = new Blob([generatedCsv.csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generatedCsv.fileName
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

    navigator.clipboard.writeText(generatedCsv.csv).then(() => {
      alert('CSV copiado para a área de transferência!')
    }).catch(() => {
      alert('Erro ao copiar CSV')
    })
  }

  return {
    pastedText,
    setPastedText,
    generatedCsv,
    productFieldType,
    setProductFieldType,
    generateCsv,
    updateCsv,
    downloadCsv,
    copyCsvToClipboard,
  }
}

