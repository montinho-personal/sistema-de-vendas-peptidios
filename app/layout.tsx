import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VendaControl Pro',
  description: 'Sistema de Inteligência Comercial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full bg-[#0d0f1a] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
