# LocalStack Dashboard

Dashboard web para visualizar e gerenciar serviços AWS no LocalStack (S3 e SES).

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (opcional):
```bash
# .env.local
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse [http://localhost:3000](http://localhost:3000)

## Funcionalidades

- **S3**: Visualizar buckets e objetos armazenados
- **SES**: Visualizar identidades verificadas e estatísticas de envio de emails

## Requisitos

- Node.js 18+
- LocalStack rodando em `http://localhost:4566` (ou configure via `LOCALSTACK_ENDPOINT`)

