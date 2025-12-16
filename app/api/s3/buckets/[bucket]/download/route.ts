import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '@/lib/aws-config'

export async function GET(
  request: Request,
  { params }: { params: { bucket: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Chave do objeto não fornecida' },
        { status: 400 }
      )
    }

    const client = new S3Client(AWS_CONFIG)
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: key,
    })

    const response = await client.send(command)

    if (!response.Body) {
      return NextResponse.json(
        { error: 'Objeto não encontrado' },
        { status: 404 }
      )
    }

    // Converter o stream em buffer usando o método do SDK v3
    const bytes = await response.Body.transformToByteArray()
    const buffer = Buffer.from(bytes)
    
    // Extrair nome do arquivo da chave
    const fileName = key.split('/').pop() || 'download'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Erro ao fazer download:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer download' },
      { status: 500 }
    )
  }
}

