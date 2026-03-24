"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

function safeRedirectPath(path: unknown): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }
  return path;
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required." };
  }
  if (typeof password !== "string" || !password) {
    return { error: "Password is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const displayName = formData.get("displayName");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required." };
  }
  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return { error: passwordResult.error.issues[0].message };
  }
  if (typeof displayName !== "string" || !displayName.trim()) {
    return { error: "Display name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: passwordResult.data,
    options: { data: { display_name: displayName.trim() } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/auth/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return { error: passwordResult.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: passwordResult.data });
  if (error) return { error: error.message };
  redirect("/");
}
