import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";

export const login = async ({ password }: { password: string }) => {
  //   const passwordHash = await bcrypt.hash("new password here", 10);
  const passwordHash =
    "$2a$10$NNGYI8wd27mMjU3gFJkG4.56qZxXpfqU8DkA6xAZs2cXgDnSB7pA.";
  const isCorrectPassword = await bcrypt.compare(password, passwordHash);

  return isCorrectPassword;
};

const storage = createCookieSessionStorage({
  cookie: {
    name: "Spencer_session",
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
  if (!userId || typeof userId !== "string") {
    return null;
  }
  return userId;
}

export async function requirePassword(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const password = session.get("password");
  if (!password || typeof password !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/spencer/login?${searchParams}`);
  }
  return password;
}

export async function createUserSession(redirectTo: string) {
  const session = await storage.getSession();
  session.set("password", "valid");
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
