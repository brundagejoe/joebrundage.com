"use client"

import { Suspense, useMemo, useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/shared/lib/supabase-browser"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import {
  Field,
  FieldDescription as FormFieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group"
import { Input } from "@/shared/ui/input"

function getSafeRedirectPath(next: string | null) {
  if (!next) {
    return "/test"
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/test"
  }

  return next
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen px-6 pt-24 pb-24" />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const next = getSafeRedirectPath(searchParams?.get("next") ?? null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <main className="min-h-screen px-6 pt-24 pb-24">
      <div className="mx-auto max-w-[24rem]">
        <h1 className="text-[2.4rem] leading-tight font-normal">Log in</h1>
        <p className="mt-3 opacity-70">Use your email and password.</p>
        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <FieldSet>
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </Field>

              <Field data-invalid={!!errorMessage} className="gap-2">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    aria-invalid={!!errorMessage}
                    required
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((current) => !current)}
                      size="icon-xs"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FormFieldDescription className="mt-1">
                  Enter the password for your existing account.
                </FormFieldDescription>
                <FieldError>{errorMessage}</FieldError>
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button disabled={isSubmitting} type="submit" className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        <p className="mt-8 text-[0.95rem] opacity-70">
          Need an account? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create one</Link>
        </p>
      </div>
    </main>
  )
}
