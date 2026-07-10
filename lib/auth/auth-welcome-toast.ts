/**
 * REQ-0035 — shared welcome toast copy for email login and Google OAuth.
 */

import type { PostLoginWelcomePayload } from "@/lib/auth/post-login-welcome";
import type { User } from "@/types/auth";

export function buildWelcomePayloadFromUser(
  user: Pick<User, "name" | "email" | "role">,
): PostLoginWelcomePayload {
  const emailLocal = user.email?.split("@")[0];
  return {
    userName: user.name || emailLocal || "User",
    role: user.role ?? "user",
  };
}

export function getWelcomeToastContent(payload: PostLoginWelcomePayload): {
  title: string;
  description: string;
} {
  return {
    title: `Welcome back, ${payload.userName}! 👋`,
    description: "You have successfully logged in. Enjoy your stay!",
  };
}
