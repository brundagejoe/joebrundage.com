import { redirect } from "next/navigation"
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
    <main className="min-h-screen px-6 pt-24 pb-24">
      <div className="mx-auto max-w-[38rem]">
        <h1 className="text-[2.4rem] leading-tight font-normal">Success</h1>
        <p className="mt-3 opacity-70">
          You are logged in and allowed to view this protected test page. You
          can also <Link href="/change-password">change your password</Link>{" "}
          while logged in.
        </p>
      </div>
    </main>
  )
}
