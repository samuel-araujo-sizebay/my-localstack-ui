import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '@/lib/aws-config'

export async function GET(
  request: Request,
  { params }: { params: { bucket: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || ''

    const client = new S3Client(AWS_CONFIG)
    const command = new ListObjectsV2Command({
      Bucket: params.bucket,
      Prefix: prefix,
      Delimiter: '/', // Usar delimitador para listar pastas corretamente
    })
    const response = await client.send(command)

    // Combinar objetos e prefixos comuns (pastas)
    const objects: any[] = []
    const seenKeys = new Set<string>()
    
    // Adicionar prefixos comuns como pastas
    if (response.CommonPrefixes) {
      response.CommonPrefixes.forEach(prefixItem => {
        if (prefixItem.Prefix) {
          const key = prefixItem.Prefix
          
          // Não adicionar se for exatamente o prefixo atual (a própria pasta)
          if (key === prefix) return
          
          // Não adicionar se já foi visto
          if (!seenKeys.has(key)) {
            seenKeys.add(key)
            objects.push({
              Key: key,
              Size: 0,
              LastModified: undefined,
              StorageClass: undefined,
            })
          }
        }
      })
    }
    
    // Adicionar objetos (arquivos)
    if (response.Contents) {
      response.Contents.forEach(obj => {
        if (!obj.Key) return
        
        // Não adicionar se for exatamente o prefixo atual (a própria pasta)
        // Isso acontece quando a pasta foi criada explicitamente como objeto vazio
        // Comparar normalizando (remover espaços, garantir que ambos terminam com / se necessário)
        const normalizedKey = obj.Key.trim()
        const normalizedPrefix = prefix.trim()
        
        if (normalizedKey === normalizedPrefix) {
          return
        }
        
        // Não adicionar se já existe como pasta (prefixo comum)
        if (!seenKeys.has(obj.Key)) {
          seenKeys.add(obj.Key)
          objects.push(obj)
        }
      })
    }

    return NextResponse.json({
      objects: objects,
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    })
  } catch (error: any) {
    console.error('Erro ao listar objetos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao listar objetos' },
      { status: 500 }
    )
  }
}

