// Configuração do AWS SDK para LocalStack
export const AWS_CONFIG = {
  region: 'us-east-1',
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
  forcePathStyle: true, // Necessário para S3 no LocalStack
}

