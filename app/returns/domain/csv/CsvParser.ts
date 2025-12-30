import { ParsedProduct, DateParseResult } from '../../interfaces/csv'

/**
 * Serviço de domínio para parsing de texto de pedidos em produtos estruturados
 * Seguindo princípios DDD - lógica de negócio isolada
 */
export class CsvParser {
  /**
   * Extrai Order ID do texto
   */
  static extractOrderId(text: string): string | null {
    const orderIdMatch = text.match(/ID:\s*([A-Z0-9]+)/i) || text.match(/(PREP\d+|XXX_\w+)/i)
    return orderIdMatch?.[1] || null
  }

  /**
   * Extrai e formata Order Date para DD/MM/YYYY
   */
  static extractAndFormatOrderDate(text: string): DateParseResult {
    const orderDateMatch = text.match(/Order date:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) || 
                           text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
    
    if (!orderDateMatch) {
      return { formattedDate: '', originalDate: '' }
    }

    const dateMatch = orderDateMatch[1].match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!dateMatch) {
      return { formattedDate: orderDateMatch[1], originalDate: orderDateMatch[1] }
    }

    // Assumir que a data extraída está em MM/DD/YYYY e converter para DD/MM/YYYY
    const month = dateMatch[1].padStart(2, '0')
    const day = dateMatch[2].padStart(2, '0')
    const year = dateMatch[3]
    const formattedDate = `${day}/${month}/${year}`

    return { formattedDate, originalDate: orderDateMatch[1] }
  }

  /**
   * Encontra o índice do cabeçalho da tabela de produtos
   */
  static findTableHeaderIndex(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('ID') && lines[i].includes('SKU') && lines[i].includes('Product')) {
        return i
      }
    }
    return -1
  }

  /**
   * Extrai tamanho comprado das linhas próximas ao SKU
   * Estrutura esperada:
   * - Linha com SKU: ID \t SKU
   * - Linha com "Product image"
   * - Linha com nome do produto
   * - Linha com: -- \t TAMANHO \t QUANTIDADE
   * 
   * Se não encontrar o padrão exato, retorna "One Size"
   */
  static extractPurchasedSize(lines: string[], startIndex: number): { size: string; quantity: string } {
    let purchasedSize = 'One Size'
    let quantity = '1'

    // Procurar nas próximas 6 linhas (SKU, Product image, Nome, Tamanho, Preço, Return)
    for (let j = startIndex; j < Math.min(startIndex + 6, lines.length); j++) {
      const nextLine = lines[j]
      if (!nextLine || nextLine.trim().length === 0) continue

      // Procurar apenas pelo padrão exato: -- \t TAMANHO \t QUANTIDADE
      const sizeQtyMatch = nextLine.match(/--\s*\t\s*([^\t\n]+?)\s*\t\s*(\d+)/)
      if (sizeQtyMatch) {
        const potentialSize = sizeQtyMatch[1].trim()
        if (potentialSize && potentialSize !== '--' && !potentialSize.match(/^\d+\.?\d*$/)) {
          purchasedSize = potentialSize
          quantity = sizeQtyMatch[2].trim()
          break
        }
      }
    }

    return { size: purchasedSize, quantity }
  }

  /**
   * Extrai produtos do texto usando estrutura tabular
   * Estrutura esperada:
   * - Linha com cabeçalho: ID | SKU | Product | ...
   * - Para cada produto:
   *   - Linha: ID \t SKU
   *   - Linha: "Product image"
   *   - Linha: Nome do produto
   *   - Linha: -- \t TAMANHO \t QUANTIDADE
   *   - Linha: Preço
   */
  static parseProductsFromTable(
    text: string,
    orderId: string | null,
    formattedDate: string
  ): ParsedProduct[] {
    // Não remover espaços/tabs, apenas quebrar em linhas e remover linhas vazias
    const lines = text.split('\n').map(l => l).filter(l => l.trim().length > 0)
    const products: ParsedProduct[] = []
    
    const headerIndex = this.findTableHeaderIndex(lines)
    if (headerIndex === -1) {
      return products
    }

    let i = headerIndex + 1
    while (i < lines.length) {
      const line = lines[i]
      if (!line || line.trim().length < 5) {
        i++
        continue
      }

      // Procurar por SKU completo no formato: 1017-002042-0008-579 ou 1704-000043-0179-000
      // Pode estar na linha com ID e SKU separados por tab
      const skuMatch = line.match(/(\d{4}-\d{6}-\d{4}(?:-\d{3})?)/)
      
      if (skuMatch) {
        const sku = skuMatch[1]
        const { size, quantity } = this.extractPurchasedSize(lines, i)

        products.push({
          orderId: orderId || 'UNKNOWN',
          orderDate: formattedDate,
          productIdentifier: sku,
          sizeOrdered: size,
          quantity: quantity,
        })

        // Pular as linhas do produto atual (SKU, Product image, Nome, Tamanho, Preço)
        // Avançar mais linhas para pegar o próximo produto
        i += 5
      } else {
        i++
      }
    }

    return products
  }

  /**
   * Fallback: busca genérica de SKUs no texto
   */
  static parseProductsFromGenericSearch(
    text: string,
    orderId: string | null,
    formattedDate: string
  ): ParsedProduct[] {
    const products: ParsedProduct[] = []
    const allSkus = text.matchAll(/(\d{4}-\d{6}-\d{4}-\d{3})/g)
    const skuArray = Array.from(allSkus)

    for (const skuMatch of skuArray) {
      const sku = skuMatch[1]
      products.push({
        orderId: orderId || 'UNKNOWN',
        orderDate: formattedDate,
        productIdentifier: sku,
        sizeOrdered: 'One Size',
        quantity: '1',
      })
    }

    return products
  }

  /**
   * Parse principal: extrai produtos do texto
   */
  static parse(text: string): ParsedProduct[] {
    const orderId = this.extractOrderId(text)
    const { formattedDate } = this.extractAndFormatOrderDate(text)

    // Tentar primeiro com estrutura tabular
    let products = this.parseProductsFromTable(text, orderId, formattedDate)

    // Se não encontrou, tentar busca genérica
    if (products.length === 0) {
      products = this.parseProductsFromGenericSearch(text, orderId, formattedDate)
    }

    return products
  }
}

