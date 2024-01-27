import type { ActionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Form, useActionData } from "@remix-run/react"
import clsx from "clsx"
import { useEffect, useState } from "react"
import { Button } from "~/shadcn-ui-components/ui/button"
import { createUserSession, signup } from "~/utils/session.server"

export const action = async ({ request }: ActionArgs) => {
  const { username, password, confirmPassword } = Object.fromEntries(
    await request.formData(),
  )
  if (typeof username !== "string") throw new Error("Username not found")
  if (typeof password !== "string") throw new Error("Password not found")
  if (typeof confirmPassword !== "string")
    throw new Error("Confirm password not found")

  if (password !== confirmPassword)
    return json({ error: "Passwords do not match" })

  const { userId, error } = await signup({ username, password })

  if (error || !userId) {
    return json({ error: error?.message })
  } else {
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get("redirectTo")
    return createUserSession(userId, redirectTo ?? "/")
  }
}

export default function Signup() {
  const data = useActionData<typeof action>()
  const [invalidUsername, setInvalidUsername] = useState(false)
  const [passwordsDontMatch, setPasswordsDontMatch] = useState(false)

  useEffect(() => {
    if (!data?.error) {
      setInvalidUsername(false)
      setPasswordsDontMatch(false)
      return
    }

    if (data.error === "Passwords do not match") {
      setPasswordsDontMatch(true)
      setInvalidUsername(false)
      return
    } else {
      setPasswordsDontMatch(false)
      setInvalidUsername(true)
    }
  }, [data])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="flex flex-col">
        <Form method="POST">
          <div className="mb-4 flex flex-col items-center">
            <input
              className={clsx(
                "mb-4 w-full rounded border px-3 py-2 text-gray-700",
                invalidUsername
                  ? "border-red-500 focus:border-red-500 focus:outline-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300",
              )}
              name="username"
              type="text"
              placeholder="Username"
            />
            <input
              className={clsx(
                "mb-4 w-full rounded border px-3 py-2 text-gray-700",
                passwordsDontMatch
                  ? "border-red-500 focus:border-red-500 focus:outline-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300",
              )}
              name="password"
              type="password"
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setPasswordsDontMatch(false)
                }
              }}
            />
            <input
              className={clsx(
                "w-full rounded border px-3 py-2 text-gray-700",
                passwordsDontMatch
                  ? "border-red-500 focus:border-red-500 focus:outline-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300",
              )}
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setPasswordsDontMatch(false)
                }
              }}
            />
          </div>
          <Button className="w-full" type="submit">
            Create account
          </Button>
        </Form>
      </div>
    </div>
  )
}
