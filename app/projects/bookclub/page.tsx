import { createSupabaseServerClient } from "@/shared/lib/supabase-server"
import { BookclubHomeClient } from "@/app/projects/bookclub/bookclub-home-client"
import { pageMetadata } from "@/shared/lib/metadata"

export const metadata = pageMetadata({
  title: "Bookclub",
  description:
    "Start a private book club, share an invite link, collect book pitches, run ranked-choice voting, and add the next meeting to Google Calendar or iCal.",
  path: "/projects/bookclub",
})

export default async function BookclubHomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BookclubHomeClient isAuthed={Boolean(user)} />
}
