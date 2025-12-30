import { NextResponse } from 'next/server'
import { returnsApi } from '@/lib/returns-api'

// Forçar rota dinâmica (usa request.url)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sessionId = request.headers.get('x-session-id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'x-session-id header is required' },
        { status: 401 }
      )
    }

    // Set session ID and make API call
    returnsApi.setSessionId(sessionId)
    const data = await returnsApi.getProcessingStatus({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}

