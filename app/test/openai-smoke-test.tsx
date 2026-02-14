"use client"

import { useMutation } from "@tanstack/react-query"
import { Button } from "@/shared/ui/button"

type TestResponse = {
  text?: string
  error?: string
  debug?: { keys?: string[] }
}

export function OpenAISmokeTest() {
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/test/openai", {
        method: "POST",
      })
      const data = (await response.json()) as TestResponse

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Request failed."
        )
      }

      return data
    },
  })

  const state =
    mutation.isPending
      ? "loading"
      : mutation.isError
        ? "error"
        : mutation.isSuccess
          ? "success"
          : "idle"
  const message = mutation.isError
    ? mutation.error instanceof Error
      ? mutation.error.message
      : "Unknown error."
    : typeof mutation.data?.text === "string"
      ? mutation.data.text
      : ""
  const debug = Array.isArray(mutation.data?.debug?.keys)
    ? `Response keys: ${mutation.data?.debug?.keys?.join(", ")}`
    : ""

  return (
    <div className="mt-6 space-y-3">
      <Button
        type="button"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Generating..." : "Generate test text"}
      </Button>

      <p className="text-sm text-muted-foreground">
        {state === "idle" && "Click the button to test your OpenAI connection."}
        {state === "success" && message}
        {state === "error" && `Error: ${message}`}
      </p>
      {debug && <p className="text-xs text-muted-foreground">{debug}</p>}
    </div>
  )
}
