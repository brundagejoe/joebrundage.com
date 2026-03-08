import { createSupabaseServerClient } from "@/shared/lib/supabase"
import { BookclubJoinClient } from "@/app/projects/bookclub/join/[inviteCode]/bookclub-join-client"

export default async function BookclubJoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>
}) {
  const { inviteCode } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BookclubJoinClient inviteCode={inviteCode} isAuthed={Boolean(user)} />
}
