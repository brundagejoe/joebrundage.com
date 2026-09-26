import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"
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
    <main className="min-h-screen px-6 pt-24 pb-24">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-[2.4rem] leading-tight font-normal">Change password</h1>
        <p className="mt-3 opacity-70">Update your password while logged in.</p>
        <ChangePasswordForm />
      </div>
    </main>
  )
}
