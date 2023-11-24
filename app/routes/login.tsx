import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { LoginResult, createUserSession, login } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");
  if (typeof username !== "string") throw new Error("Username not found");
  if (typeof password !== "string") throw new Error("Password not found");
  const loginResult = await login({ username, password });

  let returnVals = { incorrectPassword: false, userNotFound: false };

  if (loginResult === LoginResult.IncorrectPassword) {
    returnVals.incorrectPassword = true;
  } else if (loginResult === LoginResult.UserNotFound) {
    returnVals.userNotFound = true;
    returnVals.incorrectPassword = true;
  } else {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo");
    return createUserSession(loginResult.userId, redirectTo ?? "/");
  }

  return json(returnVals);
};

export default function Login() {
  const data = useActionData<typeof action>();
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);

  useEffect(() => {
    setInvalidUsername(data?.userNotFound ?? false);
    setInvalidPassword(data?.incorrectPassword ?? false);
  }, [data]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div className="flex flex-col">
        <Form method="POST">
          <div className="flex flex-col items-center">
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
                "border rounded w-full py-2 px-3 text-gray-700",
                invalidPassword
                  ? "focus:border-red-500 focus:outline-red-500 border-red-500"
                  : "border-gray-200 focus:border-blue-300 focus:outline-blue-300"
              )}
              name="password"
              type="password"
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  setInvalidPassword(false);
                }
              }}
            />
          </div>
          <button className="hidden" type="submit" />
        </Form>
        <Link
          className="font-semibold text-md text-blue-500 mt-2 hover:underline text-center"
          to={"/signup"}
        >
          Create an account
          <ArrowSmallRightIcon className="inline-block h-4 w-4 ml-1 -rotate-45" />
        </Link>
      </div>
    </div>
  );
}
