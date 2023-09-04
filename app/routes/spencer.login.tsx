import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Form, useActionData } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { createUserSession, login } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const password = form.get("password");
  if (typeof password !== "string") throw new Error("Password not found");
  const loginSuccessful = await login({ password });
  if (loginSuccessful) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo");
    return createUserSession(redirectTo ?? "/spencer/1-nephi");
  }
  return json({ incorrectPassword: true });
};

export default function SpencerLogin() {
  const data = useActionData<typeof action>();
  const [invalidSubmission, setInvalidSubmission] = useState(false);

  useEffect(() => {
    setInvalidSubmission(data?.incorrectPassword ?? false);
  }, [data]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div>
        <Form method="POST">
          <div className="flex flex-col items-center gap-4">
            <input
              className={clsx(
                "border rounded w-full py-2 px-3 text-gray-700",
                invalidSubmission
                  ? "focus:border-red-500 focus:outline-red-500 border-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300"
              )}
              name="password"
              type="password"
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setInvalidSubmission(false);
                }
              }}
            />
          </div>
          <button className="hidden" type="submit" />
        </Form>
      </div>
    </div>
  );
}
