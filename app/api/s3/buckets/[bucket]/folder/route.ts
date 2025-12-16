import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '@/lib/aws-config'

export async function POST(
  request: Request,
  { params }: { params: { bucket: string } }
) {
  try {
    const { folderName, prefix } = await request.json()

    if (!folderName || !folderName.trim()) {
      return NextResponse.json(
        { error: 'Nome da pasta não fornecido' },
        { status: 400 }
      )
    }

    // No S3, pastas são apenas prefixos. Criamos um objeto vazio com o nome da pasta terminando em /
    const folderKey = prefix 
      ? `${prefix}${folderName.trim()}/`
      : `${folderName.trim()}/`

    const client = new S3Client(AWS_CONFIG)
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: folderKey,
      Body: '',
    })

    await client.send(command)

    return NextResponse.json({
      success: true,
      key: folderKey,
      message: 'Pasta criada com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao criar pasta:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pasta' },
      { status: 500 }
    )
  }
}

