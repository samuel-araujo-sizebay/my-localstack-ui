import { NextResponse } from 'next/server'
import { AWS_CONFIG } from '@/lib/aws-config'

// Endpoint de debug para ver a estrutura real dos dados do LocalStack
export async function GET() {
  try {
    const localstackEndpoint = AWS_CONFIG.endpoint
    
    const endpoints = [
      `${localstackEndpoint}/_localstack/ses`,
      `${localstackEndpoint}/_aws/ses`,
      `${localstackEndpoint}/_localstack/ses/messages`,
    ]
    
    const results: any[] = []
    
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
          results.push({
            endpoint,
            status: response.status,
            data,
            dataString: JSON.stringify(data, null, 2),
          })
        } else {
          results.push({
            endpoint,
            status: response.status,
            error: `Status ${response.status}`,
          })
        }
      } catch (err: any) {
        results.push({
          endpoint,
          error: err.message,
        })
      }
    }
    
    return NextResponse.json({
      localstackEndpoint,
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

