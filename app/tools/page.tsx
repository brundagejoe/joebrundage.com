import { Card, CardContent } from "@/shared/ui/card"

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background pt-16">
      <section className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-semibold">Tools</h2>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Placeholder for tools. Subroutes will be added under{" "}
                <code>/tools</code>.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
