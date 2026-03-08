"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"

type AiFeatureGateButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
> & {
  canUseAi: boolean
  onAllowedClick: () => void
  featureLabel?: string
  signupLabel?: string
}

export function AiFeatureGateButton({
  canUseAi,
  onAllowedClick,
  featureLabel = "this AI feature",
  signupLabel = "Sign up",
  ...buttonProps
}: AiFeatureGateButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLockedDialogOpen, setIsLockedDialogOpen] = React.useState(false)

  const nextPath = React.useMemo(() => {
    const params = searchParams?.toString()
    if (!pathname) {
      return "/tools"
    }

    return params ? `${pathname}?${params}` : pathname
  }, [pathname, searchParams])

  const handleClick = React.useCallback(() => {
    if (canUseAi) {
      onAllowedClick()
      return
    }

    setIsLockedDialogOpen(true)
  }, [canUseAi, onAllowedClick])

  const handleSignupClick = React.useCallback(() => {
    router.push(`/signup?next=${encodeURIComponent(nextPath)}`)
  }, [nextPath, router])

  return (
    <>
      <Button {...buttonProps} onClick={handleClick} />

      <AlertDialog open={isLockedDialogOpen} onOpenChange={setIsLockedDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign up required</AlertDialogTitle>
            <AlertDialogDescription>
              You need an eligible account to use {featureLabel}. Create an
              account to unlock AI-powered custom tools.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <Button type="button" onClick={handleSignupClick}>
              {signupLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
