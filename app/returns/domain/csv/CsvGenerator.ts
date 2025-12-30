import { ParsedProduct } from '../../interfaces/csv'
import { ProductFieldType } from '../../interfaces/csv'
import { CsvGenerationResult } from '../../interfaces/csv'

/**
 * Serviço de domínio para geração de CSV
 * Seguindo princípios DDD - lógica de negócio isolada
 */
export class CsvGenerator {
  /**
   * Formata data para DD/MM/YYYY
   */
  static formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return ''

    // Se estiver em formato YYYY-MM-DD, converter para DD/MM/YYYY
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }

    // Validar e formatar para DD/MM/YYYY se necessário
    const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!dateMatch) {
      return dateStr
    }

    const firstPart = parseInt(dateMatch[1])
    const secondPart = parseInt(dateMatch[2])

    if (firstPart > 12) {
      // Já está em DD/MM/YYYY, apenas garantir zeros à esquerda
      const day = dateMatch[1].padStart(2, '0')
      const month = dateMatch[2].padStart(2, '0')
      const year = dateMatch[3]
      return `${day}/${month}/${year}`
    } else if (secondPart > 12) {
      // Está em MM/DD/YYYY, converter para DD/MM/YYYY
      const month = dateMatch[1].padStart(2, '0')
      const day = dateMatch[2].padStart(2, '0')
      const year = dateMatch[3]
      return `${day}/${month}/${year}`
    } else {
      // Ambos <= 12, assumir MM/DD/YYYY e converter para DD/MM/YYYY
      const month = dateMatch[1].padStart(2, '0')
      const day = dateMatch[2].padStart(2, '0')
      const year = dateMatch[3]
      return `${day}/${month}/${year}`
    }
  }

  /**
   * Gera nome de arquivo com timestamp
   */
  static generateFileName(): string {
    const timestamp = Date.now()
    return `returns-${timestamp}.csv`
  }

  /**
   * Gera CSV a partir de produtos parseados
   */
  static generate(
    products: ParsedProduct[],
    productFieldType: ProductFieldType
  ): CsvGenerationResult {
    if (products.length === 0) {
      throw new Error('Nenhum produto encontrado para gerar CSV')
    }

    const headers = ['order_id', 'order_date', productFieldType, 'size_ordered', 'return_reason']
    const csvRows = [
      headers.join(','),
      ...products.map(p => {
        const formattedOrderDate = this.formatDateToDDMMYYYY(p.orderDate)
        return [
          p.orderId,
          formattedOrderDate || '',
          p.productIdentifier,
          p.sizeOrdered,
          'UNKNOWN',
        ].join(',')
      })
    ]

    const csv = csvRows.join('\n')
    const fileName = this.generateFileName()
    const fileKey = fileName

    return {
      csv,
      fileName,
      fileKey,
      products,
    }
  }
}

