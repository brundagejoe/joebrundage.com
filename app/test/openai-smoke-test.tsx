"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"

type TestState = "idle" | "loading" | "success" | "error"

export function OpenAISmokeTest() {
  const [state, setState] = useState<TestState>("idle")
  const [message, setMessage] = useState("")
  const [debug, setDebug] = useState("")

  async function runTest() {
    setState("loading")
    setMessage("")
    setDebug("")

    try {
      const response = await fetch("/api/test/openai", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Request failed."
        )
      }

      setMessage(
        typeof data?.text === "string" ? data.text : "Received an empty response."
      )
      if (Array.isArray(data?.debug?.keys)) {
        setDebug(`Response keys: ${data.debug.keys.join(", ")}`)
      }
      setState("success")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error.")
      setState("error")
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <Button
        type="button"
        size="sm"
        onClick={runTest}
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
