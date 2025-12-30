import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LocalStack Dashboard',
  description: 'Dashboard para gerenciar S3 e SES no LocalStack',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  )
}

