import { createSupabaseServerClient } from "@/shared/lib/supabase"
import { BookclubClubClient } from "@/app/projects/bookclub/bookclub-club-client"

export default async function BookclubClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>
}) {
  const { clubId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BookclubClubClient clubId={clubId} isAuthed={Boolean(user)} />
}
