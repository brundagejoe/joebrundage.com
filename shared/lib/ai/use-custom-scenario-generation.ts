"use client"

import * as React from "react"

type UseCustomScenarioGenerationOptions = {
  endpoint: string
  buildRequest?: (situation: string) => unknown
  defaultErrorMessage: string
}

type ApiErrorResponse = {
  error?: string
}

export function useCustomScenarioGeneration<TResponse>({
  endpoint,
  buildRequest,
  defaultErrorMessage,
}: UseCustomScenarioGenerationOptions) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [situation, setSituation] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const openDialog = React.useCallback(() => {
    setError(null)
    setIsDialogOpen(true)
  }, [])

  const closeDialog = React.useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  const submit = React.useCallback(async (): Promise<TResponse> => {
    const trimmedSituation = situation.trim()
    if (trimmedSituation.length === 0) {
      const message = "Please describe a situation first."
      setError(message)
      throw new Error(message)
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          buildRequest ? buildRequest(trimmedSituation) : { situation: trimmedSituation }
        ),
      })

      const data = (await response.json()) as TResponse & ApiErrorResponse

      if (!response.ok) {
        throw new Error(data.error || defaultErrorMessage)
      }

      setSituation("")
      setIsDialogOpen(false)
      return data
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : defaultErrorMessage
      setError(message)
      throw submitError
    } finally {
      setIsGenerating(false)
    }
  }, [buildRequest, defaultErrorMessage, endpoint, situation])

  return {
    isDialogOpen,
    setIsDialogOpen,
    situation,
    setSituation,
    error,
    setError,
    isGenerating,
    openDialog,
    closeDialog,
    submit,
  }
}
