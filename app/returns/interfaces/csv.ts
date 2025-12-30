export type ProductFieldType = 'product_id' | 'product_sku' | 'product_url'

export type ProcessType = 'PRODUCT_ID' | 'PRODUCT_SKU' | 'PRODUCT_ID_ON_ORDER_PERMALINK'

export type ReturnReason = 'UNKNOWN' | 'SMALL' | 'BIG'

/**
 * Produto parseado do texto de pedido
 */
export interface ParsedProduct {
  orderId: string
  orderDate: string
  productIdentifier: string
  sizeOrdered: string
  quantity: string
}

/**
 * Resultado do parsing de data
 */
export interface DateParseResult {
  formattedDate: string
  originalDate: string
}

/**
 * @deprecated Use ParsedProduct ao invés de CsvProduct
 * Mantido para compatibilidade
 */
export interface CsvProduct extends ParsedProduct {}

/**
 * Resultado da geração de CSV
 */
export interface CsvGenerationResult {
  csv: string
  fileName: string
  fileKey: string
  products: ParsedProduct[]
}

/**
 * Parâmetros para processamento de CSV
 */
export interface ProcessCsvParams {
  returnsFileKey: string
  domain: string
  processType: ProcessType
  ignoreOrderedSize: boolean
  notification?: {
    recipientEmail: string
    recipientName: string
    locale?: 'pt' | 'en' | 'es'
  }
}

