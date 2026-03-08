"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { createSupabaseBrowserClient } from "@/shared/lib/supabase-browser"
import { Button } from "@/shared/ui/button"
import {
  Field,
  FieldDescription,
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

export function ChangePasswordForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setConfirmPasswordError(null)

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setPassword("")
    setConfirmPassword("")
    setSuccessMessage("Password updated successfully.")
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FieldSet className="gap-4">
        <FieldGroup className="gap-4">
          <div className="space-y-3">
            <Field className="gap-2">
              <FieldLabel htmlFor="password">New password</FieldLabel>
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
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
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

          {successMessage ? (
            <Field>
              <FieldDescription>{successMessage}</FieldDescription>
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
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  )
}
