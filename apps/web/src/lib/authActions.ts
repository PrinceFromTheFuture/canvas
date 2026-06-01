"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@arb/db";
import { clearSessionCookie, hashPassword, setSessionCookie, verifyPassword } from "./auth";

export interface AuthResult {
  error?: string;
}

export async function signupAction(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) return { error: "Email and a 6+ char password are required" };

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with that email already exists" };

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: hashPassword(password) })
    .returning({ id: users.id });
  await setSessionCookie(user!.id);
  redirect("/");
}

export async function loginAction(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password" };
  }
  await setSessionCookie(user.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
