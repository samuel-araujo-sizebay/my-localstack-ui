/**
 * Centralized API service for Returns API
 * All API calls should go through this service
 */

const RETURNS_API_BASE_URL = 'https://returns.internalsizebay.com'

export interface GenerateUploadUrlRequest {
  fileKey: string
}

export interface GenerateUploadUrlResponse {
  uploadUrl: string
}

export interface ProcessCsvRequest {
  returnsFileKey: string
  domain: string
  notification?: {
    recipientEmail: string
    recipientName: string
  }
  processType?: 'PRODUCT_ID' | 'PRODUCT_SKU' | 'PRODUCT_ID_ON_ORDER_PERMALINK'
  ignoreOrderedSize?: boolean
}

export interface ProcessCsvResponse {
  processingId: string
  status: string
}

export interface ProcessingStatus {
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

export interface GetProcessingStatusParams {
  startDate?: string
  endDate?: string
}

class ReturnsApiService {
  private baseUrl: string
  private sessionId: string | null = null

  constructor(baseUrl: string = RETURNS_API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    }

    if (this.sessionId) {
      headers['x-session-id'] = this.sessionId
    }

    return headers
  }

  /**
   * Generate upload URL for a file
   */
  async generateUploadUrl(fileKey: string): Promise<GenerateUploadUrlResponse> {
    if (!this.sessionId) {
      throw new Error('Session ID is required')
    }

    const response = await fetch(`${this.baseUrl}/returns/generate-upload-url`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ fileKey }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate upload URL' }))
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Process CSV file
   */
  async processCsv(params: ProcessCsvRequest): Promise<ProcessCsvResponse> {
    if (!this.sessionId) {
      throw new Error('Session ID is required')
    }

    const requestBody: any = {
      returnsFileKey: params.returnsFileKey,
      domain: params.domain,
      processType: params.processType || 'PRODUCT_ID',
      ignoreOrderedSize: params.ignoreOrderedSize || false,
    }

    // Adicionar notification se fornecido
    if (params.notification) {
      requestBody.notification = {
        recipientEmail: params.notification.recipientEmail,
        recipientName: params.notification.recipientName,
      }
    }

    const response = await fetch(`${this.baseUrl}/returns/process-csv`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to process CSV' }))
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(params?: GetProcessingStatusParams): Promise<ProcessingStatus[]> {
    if (!this.sessionId) {
      throw new Error('Session ID is required')
    }

    const queryParams = new URLSearchParams()
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate)
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate)
    }

    const url = `${this.baseUrl}/returns/processing-status${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-session-id': this.sessionId,
        'accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get processing status' }))
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const returnsApi = new ReturnsApiService()

