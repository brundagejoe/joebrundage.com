import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { AppQueryProvider } from "@/shared/lib/query"
import {
  SITE_THEME_STORAGE_KEY,
  ThemeProvider,
  TOOLS_THEME_STORAGE_KEY,
} from "@/shared/lib/theme"
import { HeaderRouter } from "@/widgets/header"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Joe Brundage | Software Engineer",
  description: "Portfolio and projects from Joe Brundage, software engineer.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isToolsRoute = window.location.pathname === '/tools' || window.location.pathname.startsWith('/tools/');
                  var storageKey = isToolsRoute ? '${TOOLS_THEME_STORAGE_KEY}' : '${SITE_THEME_STORAGE_KEY}';
                  var defaultTheme = 'system';
                  var theme = localStorage.getItem(storageKey) || defaultTheme;

                  if (!isToolsRoute && theme === 'terminal') {
                    theme = 'light';
                    localStorage.setItem('${SITE_THEME_STORAGE_KEY}', 'light');
                  }

                  var resolvedTheme = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;

                  document.documentElement.classList.remove('dark', 'terminal');
                  if (resolvedTheme === 'terminal') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.add('terminal');
                  } else if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppQueryProvider>
          <ThemeProvider>
            <HeaderRouter />
            {children}
          </ThemeProvider>
        </AppQueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
