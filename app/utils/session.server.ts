import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { fetchUser } from "~/supabase/users.server";

export enum LoginResult {
  UserNotFound = "userNotFound",
  IncorrectPassword = "incorrectPassword",
}

export const login = async ({
  username,
  password,
}: {
  username: string;
  password: string;
}) => {
  const userData = await fetchUser(username);
  if (userData?.userNotFound || !userData?.userId)
    return LoginResult.UserNotFound;
  //   const passwordHash = await bcrypt.hash("new password here", 10);
  // const passwordHash =
  //   "$2a$10$NNGYI8wd27mMjU3gFJkG4.56qZxXpfqU8DkA6xAZs2cXgDnSB7pA.";
  const isCorrectPassword = await bcrypt.compare(
    password,
    userData.passwordHash as string
  );

  return isCorrectPassword
    ? { userId: userData.userId }
    : LoginResult.IncorrectPassword;
};

const storage = createCookieSessionStorage({
  cookie: {
    name: "User_session",
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    // secure: process.env.NODE_ENV === "production",
    secrets: ["sec1"],
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    httpOnly: true,
  },
});

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "number") {
    return undefined;
  }
  return userId;
}

export async function requireUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "number") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
