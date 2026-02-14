"use client"

import { Suspense, useMemo, useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
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
    <Suspense fallback={<div className="min-h-screen pt-24 px-6" />}>
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
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Use your email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <FieldSet className="gap-4">
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      className="rounded-md"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                    />
                  </Field>

                  <Field data-invalid={!!errorMessage} className="gap-2">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <InputGroup className="rounded-md">
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
                          className="rounded-md"
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

              <Button disabled={isSubmitting} type="submit" className="w-full rounded-md">
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

            <p className="text-sm text-muted-foreground mt-4">
              Need an account? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create one</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
