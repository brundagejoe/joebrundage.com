import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export function getSubmissionRound(phase: string, currentRound: number): number {
  return phase === "reading" ? currentRound + 1 : currentRound
}

export function getDisplayName(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) {
    return "Member"
  }

  const fullName = metadata.full_name
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName.trim()
  }

  const name = metadata.name
  if (typeof name === "string" && name.trim().length > 0) {
    return name.trim()
  }

  return "Member"
}

export async function getBookclubByInviteCode(inviteCode: string) {
  const supabase = await createSupabaseServerClient()
  return supabase
    .from("bookclubs")
    .select("id, name, invite_code, owner_user_id, phase, current_round, meeting_at, active_book_id")
    .eq("invite_code", inviteCode)
    .maybeSingle()
}
