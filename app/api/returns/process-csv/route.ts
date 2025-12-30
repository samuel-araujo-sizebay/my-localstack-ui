import { NextResponse } from 'next/server'
import { returnsApi, ProcessCsvRequest } from '@/lib/returns-api'

// Forçar rota dinâmica (usa request.headers e request.json)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = request.headers.get('x-session-id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'x-session-id header is required' },
        { status: 401 }
      )
    }

    // Converter o body para o formato esperado pela API
    // O frontend envia notification como objeto, que é o formato correto
    const processRequest: ProcessCsvRequest = {
      returnsFileKey: body.returnsFileKey,
      domain: body.domain,
      processType: body.processType || 'PRODUCT_ID',
      ignoreOrderedSize: body.ignoreOrderedSize || false,
    }

    // Adicionar notification se fornecido
    if (body.notification) {
      processRequest.notification = {
        recipientEmail: body.notification.recipientEmail,
        recipientName: body.notification.recipientName,
      }
    } else if (body.recipientEmail && body.recipientName) {
      // Compatibilidade: se vier nos campos antigos, converter para notification
      processRequest.notification = {
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
      }
    }

    // Set session ID and make API call
    returnsApi.setSessionId(sessionId)
    const data = await returnsApi.processCsv(processRequest)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao processar CSV:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar CSV' },
      { status: 500 }
    )
  }
}

