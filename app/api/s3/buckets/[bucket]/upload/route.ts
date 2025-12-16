import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '@/lib/aws-config'

export async function POST(
  request: Request,
  { params }: { params: { bucket: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const prefix = formData.get('prefix') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = prefix ? `${prefix}${file.name}` : file.name

    const client = new S3Client(AWS_CONFIG)
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    })

    await client.send(command)

    return NextResponse.json({
      success: true,
      key,
      message: 'Arquivo enviado com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}

