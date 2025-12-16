import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '@/lib/aws-config'

export async function DELETE(
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

    // Se for uma pasta (termina com /), deletar todos os objetos com esse prefixo
    if (key.endsWith('/')) {
      // Listar todos os objetos com esse prefixo
      const listCommand = new ListObjectsV2Command({
        Bucket: params.bucket,
        Prefix: key,
      })
      
      const listResponse = await client.send(listCommand)
      const objectsToDelete = listResponse.Contents || []

      if (objectsToDelete.length === 0) {
        // Se não há objetos, apenas deletar a "pasta" (objeto vazio se existir)
        const deleteCommand = new DeleteObjectCommand({
          Bucket: params.bucket,
          Key: key,
        })
        await client.send(deleteCommand)
      } else {
        // Deletar todos os objetos em lotes
        const deletePromises = objectsToDelete.map(obj => {
          if (!obj.Key) return null
          const deleteCommand = new DeleteObjectCommand({
            Bucket: params.bucket,
            Key: obj.Key,
          })
          return client.send(deleteCommand)
        }).filter(Boolean)

        await Promise.all(deletePromises)
      }

      return NextResponse.json({
        success: true,
        message: `Pasta e ${objectsToDelete.length} objeto(s) deletado(s) com sucesso`,
        deletedCount: objectsToDelete.length,
      })
    } else {
      // Deletar arquivo único
      const deleteCommand = new DeleteObjectCommand({
        Bucket: params.bucket,
        Key: key,
      })

      await client.send(deleteCommand)

      return NextResponse.json({
        success: true,
        message: 'Arquivo deletado com sucesso',
      })
    }
  } catch (error: any) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar' },
      { status: 500 }
    )
  }
}

