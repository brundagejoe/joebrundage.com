import { EB_Garamond } from "next/font/google"

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-plate-serif",
  display: "swap",
})

export default function BetaBernoulliInferenceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={ebGaramond.variable}>{children}</div>
}
