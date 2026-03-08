import { ExpectedValuePrimerClient } from "@/app/tools/expected-value-primer/expected-value-primer-client"
import { canAccessAi } from "@/shared/lib/auth"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export default async function ExpectedValuePrimerPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const canUseAiCustom = user ? canAccessAi(user) : false

  return <ExpectedValuePrimerClient canUseAiCustom={canUseAiCustom} />
}
