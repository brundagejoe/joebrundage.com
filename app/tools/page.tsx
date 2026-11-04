import Link from "next/link"

import { TOOLS } from "@/shared/config"
import { Section } from "@/shared/ui/plate"

export default function ToolsPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-[60rem] px-6 pt-14 pb-32">
        <h1 className="text-[1.9rem] leading-tight">Tools</h1>
        <p className="mt-4 max-w-[32em]">
          Calculators and explainers, mostly about probability and
          experimentation. Press ⌘K to jump to one by code or title.
        </p>

        <Section>Index</Section>
        <table className="mt-3 w-full max-w-[44rem] border-b border-current/25">
          <thead>
            <tr className="plate-label border-b border-current/25 text-[0.72rem] uppercase tracking-[0.1em] opacity-70">
              <th className="w-[6.5rem] py-1 text-left font-medium">Code</th>
              <th className="py-1 text-left font-medium">Tool</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((tool) => (
              <tr key={tool.code}>
                <td className="plate-data py-2 pr-4 align-baseline text-[0.875rem] font-medium tracking-[0.06em] opacity-80">
                  {tool.code}
                </td>
                <td className="py-2 align-baseline">
                  <Link
                    href={tool.href}
                    className="underline decoration-current/35 underline-offset-4 transition-colors hover:decoration-current"
                  >
                    {tool.title}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
