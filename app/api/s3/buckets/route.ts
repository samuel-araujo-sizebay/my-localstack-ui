import { NextResponse } from 'next/server'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '@/lib/aws-config'

export async function GET() {
  try {
    const client = new S3Client(AWS_CONFIG)
    const command = new ListBucketsCommand({})
    const response = await client.send(command)

    return NextResponse.json({
      buckets: response.Buckets || [],
    })
  } catch (error: any) {
    console.error('Erro ao listar buckets:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao listar buckets' },
      { status: 500 }
    )
  }
}

