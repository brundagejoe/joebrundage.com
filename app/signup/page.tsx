"use client"

import { Suspense, useMemo, useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/shared/lib/supabase-browser"
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 px-6" />}>
      <SignupPageContent />
    </Suspense>
  )
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const next = getSafeRedirectPath(searchParams?.get("next") ?? null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setDisplayNameError(null)
    setConfirmPasswordError(null)
    setInfoMessage(null)

    const trimmedDisplayName = displayName.trim()
    if (trimmedDisplayName.length < 2 || trimmedDisplayName.length > 80) {
      setDisplayNameError("Display name must be between 2 and 80 characters.")
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: trimmedDisplayName,
          name: trimmedDisplayName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message)
      return
    }

    if (data.session) {
      router.push(next)
      router.refresh()
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (signInError) {
      setIsSubmitting(false)
      setInfoMessage(
        "Account created, but your project may require email confirmation before login. Check your email, then log in."
      )
      setErrorMessage(signInError.message)
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
            <CardTitle>Create account</CardTitle>
            <CardDescription>Use your email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <FieldSet className="gap-4">
                <FieldGroup className="gap-4">
                  <Field data-invalid={!!displayNameError}>
                    <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                    <Input
                      id="display-name"
                      type="text"
                      className="rounded-md"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      aria-invalid={!!displayNameError}
                      required
                    />
                    <FieldError>{displayNameError}</FieldError>
                  </Field>

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

                  <div className="space-y-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <InputGroup className="rounded-md">
                        <InputGroupInput
                          id="password"
                          type={showPasswords ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="new-password"
                          required
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                            onClick={() => setShowPasswords((current) => !current)}
                            className="rounded-md"
                            size="icon-xs"
                          >
                            {showPasswords ? <EyeOff /> : <Eye />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>

                    <Field data-invalid={!!confirmPasswordError} className="gap-2">
                      <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                      <InputGroup className="rounded-md">
                        <InputGroupInput
                          id="confirm-password"
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          autoComplete="new-password"
                          aria-invalid={!!confirmPasswordError}
                          required
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                            onClick={() => setShowPasswords((current) => !current)}
                            className="rounded-md"
                            size="icon-xs"
                          >
                            {showPasswords ? <EyeOff /> : <Eye />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError>{confirmPasswordError}</FieldError>
                    </Field>
                  </div>

                  {infoMessage ? (
                    <Field>
                      <FormFieldDescription>{infoMessage}</FormFieldDescription>
                    </Field>
                  ) : null}

                  {errorMessage ? (
                    <Field data-invalid>
                      <FieldError>{errorMessage}</FieldError>
                    </Field>
                  ) : null}
                </FieldGroup>
              </FieldSet>

              <Button disabled={isSubmitting} type="submit" className="w-full rounded-md">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-4">
              Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
