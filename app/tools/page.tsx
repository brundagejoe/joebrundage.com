import Link from "next/link"

import { TOOLS } from "@/shared/config"
import { Section } from "@/shared/ui/plate"

export default function ToolsPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-[60rem] px-6 pt-14 pb-32">
        <h1 className="text-[2.4rem] leading-tight">Tools</h1>
        <p className="mt-4 max-w-[38rem]">
          Calculators and explainers, mostly about probability and
          experimentation. Press Cmd+K to jump to one by code or title.
        </p>

        <Section>Index</Section>
        <table className="mt-3 w-full max-w-[44rem]">
          <thead>
            <tr className="plate-label border-b border-current/25 text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
              <th className="w-[6.5rem] py-1 text-left font-medium">Code</th>
              <th className="py-1 text-left font-medium">Tool</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((tool) => (
              <tr
                key={tool.code}
                className="border-b border-current/10 last:border-b-0"
              >
                <td className="plate-data py-2 align-baseline text-[0.8rem] font-medium tracking-[0.04em] opacity-70">
                  {tool.code}
                </td>
                <td className="py-2 align-baseline">
                  <Link
                    href={tool.href}
                    className="underline decoration-current/25 underline-offset-4 transition-colors hover:decoration-current"
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
