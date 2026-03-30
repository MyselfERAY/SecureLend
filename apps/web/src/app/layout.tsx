import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SecureLend - Güvenli Kredi Platformu',
  description: 'Blockchain tabanlı güvenli kredi ve mortgage platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}