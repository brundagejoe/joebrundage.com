import type { Metadata } from "next"
import {
  Source_Code_Pro,
  Source_Sans_3,
  Source_Serif_4,
} from "next/font/google"
import "./globals.css"
import { SITE_NAME, SITE_URL } from "@/shared/lib/metadata"
import { AppQueryProvider } from "@/shared/lib/query"
import {
  SITE_THEME_STORAGE_KEY,
  ThemeProvider,
  TOOLS_THEME_STORAGE_KEY,
} from "@/shared/lib/theme"
import { HeaderRouter } from "@/widgets/header"
import { Analytics } from "@vercel/analytics/react"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-plate-serif",
  display: "swap",
})

const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
})

const HOME_TITLE = "Joe Brundage — Software Engineer"
const HOME_DESCRIPTION =
  "Joe Brundage is a software engineer at Neighbor working on performance, experimentation, and technical SEO for large consumer-facing systems."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceCode.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
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
      <body className="plate antialiased">
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
