import { createSupabaseServerClient } from "@/shared/lib/supabase/server"
import { BookclubEditClient } from "@/app/projects/bookclub/bookclub-edit-client"

export default async function BookclubEditPage({
  params,
}: {
  params: Promise<{ clubId: string }>
}) {
  const { clubId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BookclubEditClient clubId={clubId} isAuthed={Boolean(user)} />
}
