import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HYBE CORP - KYC Verifizierung",
  description: "Sichere Identitätsverifizierung für HYBE CORP. DSGVO-konform und verschlüsselt.",
  applicationName: "HYBE CORP",
  generator: "v0.app",
  keywords: ["HYBE CORP", "KYC", "Identitätsprüfung", "Verifizierung", "DSGVO"],
  authors: [{ name: "HYBE CORP" }],
  category: "finance",
  openGraph: {
    type: "website",
    url: "/",
    title: "HYBE CORP - KYC Verifizierung",
    siteName: "HYBE CORP",
    description: "Sichere Identitätsverifizierung für HYBE CORP.",
    locale: "de_DE",
    images: [
      {
        url: "/placeholder-logo.svg",
        width: 1200,
        height: 630,
        alt: "HYBE CORP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HYBE CORP - KYC Verifizierung",
    description: "Sichere Identitätsverifizierung für HYBE CORP.",
    images: ["/placeholder-logo.svg"],
  },
  icons: {
    icon: "/placeholder-logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
