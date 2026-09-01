import type { Metadata } from "next"

import { geistMono, geistSans } from "@/assets/font"
import { ThemeProvider } from "@/components/shell/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "@/assets/styles/globals.css"

export const metadata: Metadata = {
  title: "Edukmoko",
  description: "Campus LMS for classes, modules, and grading.",
}

export default function RootLayout({
  children,
  dean,
  depthead,
  instructor,
  students,
}: Readonly<{
  children: React.ReactNode
  dean: React.ReactNode
  depthead: React.ReactNode
  instructor: React.ReactNode
  students: React.ReactNode
}>) {
  void dean
  void depthead
  void instructor
  void students

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
