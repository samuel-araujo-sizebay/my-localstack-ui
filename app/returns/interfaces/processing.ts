export interface ProcessingStatus {
  processingId: string
  status: string
  executionDate: string
  domain: string
  inputFileUrl: string
  outputFileUrl?: string
  durationMs?: number
  errorMessage?: string
  stats?: ProcessingStats
}

export interface ProcessingStats {
  totalProcessed: number
  totalCreated: number
  totalErrors: number
  successRate: number
  errorsByType?: Array<{
    code: string
    count: number
  }>
}

