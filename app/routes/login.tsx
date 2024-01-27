import { ArrowSmallRightIcon } from "@heroicons/react/24/outline"
import type { ActionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react"
import clsx from "clsx"
import { useEffect, useState } from "react"
import { LoginResult, createUserSession, login } from "~/utils/session.server"

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData()
  const username = form.get("username")
  const password = form.get("password")
  if (typeof username !== "string") throw new Error("Username not found")
  if (typeof password !== "string") throw new Error("Password not found")
  const loginResult = await login({ username, password })

  let returnVals = { incorrectPassword: false, userNotFound: false }

  if (loginResult === LoginResult.IncorrectPassword) {
    returnVals.incorrectPassword = true
  } else if (loginResult === LoginResult.UserNotFound) {
    returnVals.userNotFound = true
    returnVals.incorrectPassword = true
  } else {
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get("redirectTo")
    return createUserSession(loginResult.userId, redirectTo ?? "/")
  }

  return json(returnVals)
}

export default function Login() {
  const data = useActionData<typeof action>()
  const [invalidUsername, setInvalidUsername] = useState(false)
  const [invalidPassword, setInvalidPassword] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    setInvalidUsername(data?.userNotFound ?? false)
    setInvalidPassword(data?.incorrectPassword ?? false)
  }, [data])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="flex flex-col">
        <Form method="POST">
          <div className="flex flex-col items-center">
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
                "w-full rounded border px-3 py-2 text-gray-700",
                invalidPassword
                  ? "border-red-500 focus:border-red-500 focus:outline-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300",
              )}
              name="password"
              type="password"
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setInvalidPassword(false)
                }
              }}
            />
          </div>
          <button className="hidden" type="submit" />
        </Form>
        <Link
          className="text-md mt-2 text-center font-semibold text-blue-500 hover:underline"
          to={`/signup?${searchParams.toString()}`}
        >
          Create an account
          <ArrowSmallRightIcon className="ml-1 inline-block h-4 w-4 -rotate-45" />
        </Link>
      </div>
    </div>
  )
}
