'use client'

import Link from 'next/link'
import { Database, Mail } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">LocalStack Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/s3"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Database className="w-12 h-12 text-blue-500" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">S3 Buckets</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Visualizar e gerenciar buckets S3
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/ses"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Mail className="w-12 h-12 text-green-500" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">SES Emails</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Visualizar emails enviados via SES
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}

