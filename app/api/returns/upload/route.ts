import { NextResponse } from 'next/server'
import { returnsApi } from '@/lib/returns-api'

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'x-session-id header is required' },
        { status: 401 }
      )
    }

    // Obter o FormData com o arquivo e fileKey
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileKey = formData.get('fileKey') as string

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!fileKey) {
      return NextResponse.json(
        { error: 'fileKey is required' },
        { status: 400 }
      )
    }

    // Set session ID and generate upload URL
    returnsApi.setSessionId(sessionId)
    const { uploadUrl } = await returnsApi.generateUploadUrl(fileKey)

    // Fazer upload do arquivo para S3 do lado do servidor (sem problemas de CORS)
    const fileBuffer = await file.arrayBuffer()
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'text/csv',
      },
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '')
      console.error('Erro no upload para S3:', uploadResponse.status, errorText)
      return NextResponse.json(
        { error: `Erro ao fazer upload para S3: ${uploadResponse.status}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Arquivo enviado com sucesso',
      fileKey 
    })
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}

