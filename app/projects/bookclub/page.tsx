import { createSupabaseServerClient } from "@/shared/lib/supabase-server"
import { BookclubHomeClient } from "@/app/projects/bookclub/bookclub-home-client"

export default async function BookclubHomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BookclubHomeClient isAuthed={Boolean(user)} />
}
