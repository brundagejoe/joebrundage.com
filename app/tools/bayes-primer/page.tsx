import { canAccessAi } from "@/shared/lib/auth/ai-access"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"
import { BayesPrimerClient } from "@/app/tools/bayes-primer/bayes-primer-client"

export default async function BayesPlaygroundPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const canUseAiCustom = user ? canAccessAi(user) : false

  return <BayesPrimerClient canUseAiCustom={canUseAiCustom} />
}
