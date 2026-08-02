import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"
import { Link } from "@/shared/ui/link"

export default async function TestPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=%2Ftest")
  }

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Success</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are logged in and allowed to view this protected test page.
              {" "}
              You can also{" "}
              <Link href="/change-password">change your password</Link> while
              logged in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
