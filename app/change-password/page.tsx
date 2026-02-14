import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { ChangePasswordForm } from "@/app/change-password/change-password-form"

export default async function ChangePasswordPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=%2Fchange-password")
  }

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update your password while logged in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
