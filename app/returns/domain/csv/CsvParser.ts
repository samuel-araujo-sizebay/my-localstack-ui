import { ParsedProduct } from "../../interfaces/csv";

/**
 * Serviço de domínio para parsing de CSV estruturado
 * Seguindo princípios DDD - lógica de negócio isolada
 *
 * Formato de entrada único: CSV estruturado com cabeçalho
 * Exemplo: order_id,order_date,product_id,id,price,product,purchased_size,quantity,recommended_size,return,return_date,sku
 */
export class CsvParser {
  /**
   * Parse uma linha CSV respeitando vírgulas dentro de aspas
   */
  static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parser para CSV estruturado
   * Input: CSV com colunas separadas por vírgula
   * Formato esperado: order_id,order_date,product_id,id,price,product,purchased_size,quantity,recommended_size,return,return_date,sku
   * Output: Array de produtos parseados
   */
  static parseFromStructuredCsv(
    text: string,
    orderId: string | null,
    formattedDate: string
  ): ParsedProduct[] {
    const products: ParsedProduct[] = [];
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return products;
    }

    // Parse do cabeçalho
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map((h) => h.trim());

    // Encontrar índices das colunas necessárias
    const orderIdIndex = headers.indexOf("order_id");
    const orderDateIndex = headers.indexOf("order_date");
    const productIdIndex = headers.indexOf("product_id");
    const productSkuIndex = headers.indexOf("product_sku");
    const skuIndex = headers.indexOf("sku");
    const purchasedSizeIndex = headers.indexOf("purchased_size");
    const quantityIndex = headers.indexOf("quantity");
    
    console.log("🔍 Headers encontrados:", headers);
    console.log("🔍 Índices:", { orderIdIndex, orderDateIndex, productIdIndex, productSkuIndex, skuIndex, purchasedSizeIndex, quantityIndex });

    // Set para evitar duplicatas (usando product_id/sku como chave)
    const seenProducts = new Set<string>();

    // Processar cada linha de dados (pular cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Parse da linha CSV
      const columns = this.parseCsvLine(line);
      if (columns.length === 0) continue;
      
      console.log(`📦 Linha ${i} parseada:`, { columns, columnsLength: columns.length });

      // Extrair order_id
      const csvOrderId =
        orderIdIndex >= 0 && columns[orderIdIndex]
          ? columns[orderIdIndex].trim()
          : orderId || "UNKNOWN";

      // Extrair order_date
      const csvOrderDate =
        orderDateIndex >= 0 && columns[orderDateIndex]
          ? columns[orderDateIndex].trim()
          : formattedDate;

      // Extrair product identifier (preferir product_id, depois product_sku, depois sku)
      let productIdentifier = "";
      if (productIdIndex >= 0 && columns[productIdIndex]) {
        productIdentifier = columns[productIdIndex].trim();
      } else if (productSkuIndex >= 0 && columns[productSkuIndex]) {
        productIdentifier = columns[productSkuIndex].trim();
      } else if (skuIndex >= 0 && columns[skuIndex]) {
        productIdentifier = columns[skuIndex].trim();
      }

      if (!productIdentifier) continue;

      // Evitar duplicatas
      if (seenProducts.has(productIdentifier)) {
        continue;
      }
      seenProducts.add(productIdentifier);

      // Extrair purchased_size
      let purchasedSize = "One Size";
      if (purchasedSizeIndex >= 0 && columns[purchasedSizeIndex]) {
        const sizeValue = columns[purchasedSizeIndex].trim();
        console.log("📏 Tamanho encontrado:", { sizeValue, index: purchasedSizeIndex, rawColumn: columns[purchasedSizeIndex], allColumns: columns });
        if (
          sizeValue &&
          sizeValue !== "" &&
          sizeValue !== "--" &&
          sizeValue.toLowerCase() !== "one size"
        ) {
          purchasedSize = sizeValue;
          console.log("✅ Tamanho aceito:", purchasedSize);
        } else {
          console.log("❌ Tamanho rejeitado:", sizeValue);
        }
      } else {
        console.log("⚠️ Índice purchased_size não encontrado ou coluna vazia:", { purchasedSizeIndex, columnValue: purchasedSizeIndex >= 0 ? columns[purchasedSizeIndex] : "N/A" });
      }

      // Extrair quantity
      const quantity =
        quantityIndex >= 0 &&
        columns[quantityIndex] &&
        columns[quantityIndex].trim()
          ? columns[quantityIndex].trim()
          : "1";

      const product = {
        orderId: csvOrderId,
        orderDate: csvOrderDate,
        productIdentifier: productIdentifier,
        sizeOrdered: purchasedSize,
        quantity: quantity,
      };
      
      console.log("✅ Produto adicionado:", product);
      products.push(product);
    }

    console.log("📊 Total de produtos parseados:", products.length);
    return products;
  }

  /**
   * Parse principal: extrai produtos do CSV estruturado
   * Formato único de entrada: CSV com cabeçalho e linhas de dados
   */
  static parse(text: string): ParsedProduct[] {
    // Extrair order_id e order_date da primeira linha de dados (se não estiver no CSV)
    // Ou usar valores padrão se não encontrar
    let orderId: string | null = null;
    let formattedDate = "";

    // Tentar extrair da primeira linha de dados
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 1) {
      const firstDataLine = this.parseCsvLine(lines[1]);
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(",").map((h) => h.trim());

      const orderIdIndex = headers.indexOf("order_id");
      const orderDateIndex = headers.indexOf("order_date");

      if (orderIdIndex >= 0 && firstDataLine[orderIdIndex]) {
        orderId = firstDataLine[orderIdIndex].trim();
      }
      if (orderDateIndex >= 0 && firstDataLine[orderDateIndex]) {
        formattedDate = firstDataLine[orderDateIndex].trim();
      }
    }

    return this.parseFromStructuredCsv(text, orderId, formattedDate);
  }
}
