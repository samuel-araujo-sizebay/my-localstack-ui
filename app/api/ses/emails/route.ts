import { NextResponse } from 'next/server'
import { SESClient, ListIdentitiesCommand, GetSendStatisticsCommand } from '@aws-sdk/client-ses'
import { AWS_CONFIG } from '@/lib/aws-config'

// No LocalStack, os emails são armazenados em memória ou arquivos
// Vamos tentar listar identidades verificadas e estatísticas
export async function GET() {
  try {
    const client = new SESClient(AWS_CONFIG)
    
    // Listar identidades (emails/domínios verificados)
    const identitiesCommand = new ListIdentitiesCommand({})
    const identitiesResponse = await client.send(identitiesCommand)

    // Tentar obter estatísticas de envio
    let sendStats = null
    try {
      const statsCommand = new GetSendStatisticsCommand({})
      const statsResponse = await client.send(statsCommand)
      sendStats = statsResponse.SendDataPoints || []
    } catch (statsError) {
      console.log('Estatísticas não disponíveis:', statsError)
    }

    // Tentar acessar emails via endpoint do LocalStack
    let sentEmails: any[] = []
    try {
      const localstackEndpoint = AWS_CONFIG.endpoint
      
      // Tentar diferentes endpoints do LocalStack
      const endpoints = [
        `${localstackEndpoint}/_localstack/ses`,
        `${localstackEndpoint}/_aws/ses`,
        `${localstackEndpoint}/_localstack/ses/messages`,
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
            console.log('Dados recebidos do LocalStack:', JSON.stringify(data, null, 2))
            
            // O formato pode variar, tentar diferentes estruturas
            let emails: any[] = []
            if (data.messages) {
              emails = data.messages
            } else if (Array.isArray(data)) {
              emails = data
            } else if (data.Messages) {
              emails = data.Messages
            } else if (data.emails) {
              emails = data.emails
            } else if (data.items) {
              emails = data.items
            }
            
            // Processar e normalizar os emails
            sentEmails = emails.map((email: any) => {
              // Tentar extrair dados de diferentes formatos
              const normalized: any = {
                id: email.id || email.Id || email.messageId || email.MessageId,
                timestamp: email.timestamp || email.Timestamp || email.created || email.Created,
              }
              
              // Extrair remetente
              normalized.source = email.source || email.Source || email.from || email.From || email.sender || email.Sender
              
              // Extrair destinatários (pode estar em diferentes formatos)
              if (email.Destination?.ToAddresses) {
                // Formato do LocalStack: Destination: { ToAddresses: [...] }
                normalized.destination = Array.isArray(email.Destination.ToAddresses) 
                  ? email.Destination.ToAddresses 
                  : [email.Destination.ToAddresses]
              } else if (email.destination?.ToAddresses) {
                normalized.destination = Array.isArray(email.destination.ToAddresses) 
                  ? email.destination.ToAddresses 
                  : [email.destination.ToAddresses]
              } else if (email.destination) {
                normalized.destination = Array.isArray(email.destination) ? email.destination : [email.destination]
              } else if (email.Destination) {
                normalized.destination = Array.isArray(email.Destination) ? email.Destination : [email.Destination]
              } else if (email.DestinationToAddresses) {
                normalized.destination = Array.isArray(email.DestinationToAddresses) ? email.DestinationToAddresses : [email.DestinationToAddresses]
              } else if (email.to) {
                normalized.destination = Array.isArray(email.to) ? email.to : [email.to]
              } else if (email.To) {
                normalized.destination = Array.isArray(email.To) ? email.To : [email.To]
              } else if (email.recipients) {
                normalized.destination = Array.isArray(email.recipients) ? email.recipients : [email.recipients]
              }
              
              // Extrair assunto
              normalized.subject = email.subject || email.Subject || email.Subject?.Data || email.Message?.Subject?.Data
              
              // Extrair corpo do email (formato do LocalStack usa html_part e text_part)
              if (email.Body) {
                // Formato do LocalStack: Body: { html_part: "...", text_part: "..." }
                if (email.Body.html_part) {
                  normalized.Body = {
                    Html: { Data: email.Body.html_part },
                    Text: email.Body.text_part ? { Data: email.Body.text_part } : undefined,
                  }
                } else if (email.Body.Html?.Data) {
                  normalized.Body = email.Body
                } else {
                  normalized.Body = email.Body
                }
              } else if (email.Message?.Body) {
                normalized.Message = { Body: email.Message.Body }
              } else if (email.body) {
                normalized.body = email.body
              } else if (email.content) {
                normalized.body = email.content
              } else if (email.Content) {
                normalized.body = email.Content
              } else if (email.text) {
                normalized.body = email.text
              } else if (email.html) {
                normalized.body = email.html
              } else if (email.raw) {
                normalized.body = email.raw
              } else if (email.Raw?.Data) {
                normalized.body = email.Raw.Data
              }
              
              // Se o email tem uma estrutura completa do SES
              if (email.Message) {
                normalized.Message = email.Message
              }
              
              return normalized
            })
            
            if (sentEmails.length > 0) {
              console.log('Emails normalizados:', JSON.stringify(sentEmails, null, 2))
              break // Se encontrou emails, parar de tentar outros endpoints
            }
          }
        } catch (err) {
          // Continuar tentando outros endpoints
          continue
        }
      }
      
      // Se não encontrou via endpoint, tentar listar do S3 (se configurado para salvar lá)
      if (sentEmails.length === 0) {
        // Algumas configurações do LocalStack salvam emails em um bucket S3 específico
        // Isso seria uma implementação adicional se necessário
      }
    } catch (fetchError) {
      console.log('Erro ao acessar emails do LocalStack:', fetchError)
    }

    return NextResponse.json({
      identities: identitiesResponse.Identities || [],
      sendStatistics: sendStats,
      sentEmails: sentEmails,
      localstackEndpoint: AWS_CONFIG.endpoint,
      message: sentEmails.length > 0 
        ? 'Emails encontrados via endpoint do LocalStack'
        : 'No LocalStack, emails podem estar em /tmp/localstack/data/ses/ dentro do container. Use: docker exec <container> ls -la /tmp/localstack/data/ses/',
    })
  } catch (error: any) {
    console.error('Erro ao listar emails:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao listar emails' },
      { status: 500 }
    )
  }
}

