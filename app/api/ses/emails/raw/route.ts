import { NextResponse } from 'next/server'
import { AWS_CONFIG } from '@/lib/aws-config'

// Rota alternativa para buscar emails diretamente do endpoint do LocalStack
export async function GET() {
  try {
    const localstackEndpoint = AWS_CONFIG.endpoint
    
    // Tentar diferentes endpoints do LocalStack para emails
    const endpoints = [
      `${localstackEndpoint}/_localstack/ses`,
      `${localstackEndpoint}/_aws/ses`,
      `${localstackEndpoint}/_localstack/ses/messages`,
      `${localstackEndpoint}/_localstack/ses/emails`,
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            success: true,
            endpoint,
            data,
          })
        }
      } catch (err) {
        continue
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Nenhum endpoint de emails encontrado no LocalStack',
      hint: 'Verifique se o LocalStack está configurado para salvar emails. Alguns emails podem estar em /tmp/localstack/data/ses/ dentro do container.',
    })
  } catch (error: any) {
    console.error('Erro ao buscar emails:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar emails' },
      { status: 500 }
    )
  }
}

