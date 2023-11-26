import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Button } from "~/shadcn-ui-components/ui/button";
import { createUserSession, signup } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  const { username, password, confirmPassword } = Object.fromEntries(
    await request.formData()
  );
  if (typeof username !== "string") throw new Error("Username not found");
  if (typeof password !== "string") throw new Error("Password not found");
  if (typeof confirmPassword !== "string")
    throw new Error("Confirm password not found");

  if (password !== confirmPassword)
    return json({ error: "Passwords do not match" });

  const { userId, error } = await signup({ username, password });

  if (error || !userId) {
    return json({ error: error?.message });
  } else {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo");
    return createUserSession(userId, redirectTo ?? "/");
  }
};

export default function Signup() {
  const data = useActionData<typeof action>();
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [passwordsDontMatch, setPasswordsDontMatch] = useState(false);

  useEffect(() => {
    if (!data?.error) {
      setInvalidUsername(false);
      setPasswordsDontMatch(false);
      return;
    }

    if (data.error === "Passwords do not match") {
      setPasswordsDontMatch(true);
      setInvalidUsername(false);
      return;
    } else {
      setPasswordsDontMatch(false);
      setInvalidUsername(true);
    }
  }, [data]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div className="flex flex-col">
        <Form method="POST">
          <div className="flex flex-col items-center mb-4">
            <input
              className={clsx(
                "border rounded w-full py-2 px-3 text-gray-700 mb-4",
                invalidUsername
                  ? "focus:border-red-500 focus:outline-red-500 border-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300"
              )}
              name="username"
              type="text"
              placeholder="Username"
            />
            <input
              className={clsx(
                "border rounded w-full py-2 mb-4 px-3 text-gray-700",
                passwordsDontMatch
                  ? "focus:border-red-500 focus:outline-red-500 border-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300"
              )}
              name="password"
              type="password"
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setPasswordsDontMatch(false);
                }
              }}
            />
            <input
              className={clsx(
                "border rounded w-full py-2 px-3 text-gray-700",
                passwordsDontMatch
                  ? "focus:border-red-500 focus:outline-red-500 border-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300"
              )}
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setPasswordsDontMatch(false);
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
  );
}
