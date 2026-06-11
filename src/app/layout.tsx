import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { LanguageProvider } from "@/contexts/language-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { AuthModal } from "@/components/auth-modal"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EchoLingo",
  description: "通过 YouTube 视频学英语，实时字幕同步，AI 生成学习笔记",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className={`${geist.variable} h-full`}>
      <body className="h-full flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <Header />
            {children}
            <AuthModal />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
