/**
 * Google OAuth Callback Route
 * Handles OAuth callback from Google and creates/authenticates user
 */

import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/utils/auth";
import {
  getGoogleClientId,
  getGoogleClientSecret,
  isGoogleOAuthConfigured,
} from "@/lib/auth/oauth";
import { logger } from "@/lib/logger";
import { generateUniqueUsername } from "@/lib/auth/unique-username";
import { prisma } from "@/prisma/client";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";

type GoogleOAuthProfile = {
  email: string;
  name?: string | null;
  googleId: string;
  userImage: string | null;
};

/** Create OAuth user with unique username; recover from P2002 race / username collision */
async function createGoogleOAuthUser(
  profile: GoogleOAuthProfile,
): Promise<User> {
  const { email, name, googleId, userImage } = profile;
  const randomPassword = Buffer.from(Math.random().toString(36)).toString(
    "base64",
  );
  const hashedPassword = await bcrypt.hash(randomPassword, 10);
  const username = await generateUniqueUsername(
    email.split("@")[0] || name || "user",
  );

  const displayName = name?.trim() || email.split("@")[0] || "user";

  const createData = {
    email,
    name: displayName,
    password: hashedPassword,
    googleId,
    image: userImage,
    role: "admin",
    username,
    createdAt: new Date(),
  };

  try {
    return await prisma.user.create({ data: createData });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return existing;
      }
      const retryUsername = await generateUniqueUsername(
        `${username}${Date.now().toString(36).slice(-4)}`,
      );
      return await prisma.user.create({
        data: { ...createData, username: retryUsername },
      });
    }
    throw error;
  }
}

/** Merge Google profile into an existing user when fields are missing */
async function updateGoogleOAuthUser(
  user: User,
  profile: GoogleOAuthProfile,
): Promise<User> {
  const { googleId, userImage, name } = profile;
  const updateData: {
    googleId?: string;
    image?: string | null;
    name?: string;
    role?: string;
  } = {};

  if (!user.googleId) {
    updateData.googleId = googleId;
  }
  if (userImage && userImage !== user.image) {
    updateData.image = userImage;
  }
  if (name && name !== user.name && !user.name) {
    updateData.name = name;
  }
  if (!user.role || (typeof user.role === "string" && user.role.trim() === "")) {
    updateData.role = "admin";
  }

  if (Object.keys(updateData).length === 0) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });
}

/**
 * GET /api/auth/oauth/google/callback
 * Handle Google OAuth callback
 * Creates user if doesn't exist, then authenticates
 */
export async function GET(request: NextRequest) {
  try {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_not_configured", request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors — access_denied means the user cancelled the Google consent screen;
    // this is expected UX, not a system error, so it must not be sent to Sentry
    if (error) {
      if (error !== "access_denied") {
        // Only log unexpected OAuth errors (e.g. server_error from Google)
        logger.warn("Google OAuth error:", error);
      }
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", request.url)
      );
    }

    // Validate state (CSRF protection). Warn only — expired cookie, back-button, or
    // interrupted OAuth are expected UX paths, not server failures (no Sentry).
    const storedState = request.cookies.get("oauth_state")?.value;
    if (!state || !storedState || state !== storedState) {
      logger.warn("OAuth state mismatch - possible CSRF attack");
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/login?error=no_code", request.url)
      );
    }

    // Exchange authorization code for access token
    const clientId = getGoogleClientId()!;
    const clientSecret = getGoogleClientSecret()!;
    const redirectUri = new URL(
      "/api/auth/oauth/google/callback",
      request.url
    ).toString();

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        logger.error("Failed to exchange OAuth code for token:", errorData);
        return NextResponse.redirect(
          new URL("/login?error=token_exchange_failed", request.url)
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        logger.error("Failed to fetch user info from Google");
        return NextResponse.redirect(
          new URL("/login?error=fetch_user_failed", request.url)
        );
      }

      const googleUser = await userInfoResponse.json();
      // Extract user data from Google OAuth response
      // Note: Google uses 'picture' field, but we map it to 'image' for consistency
      const { id: googleId, email, name, picture: googleImage } = googleUser;

      if (!email) {
        logger.error("Google user info missing email");
        return NextResponse.redirect(
          new URL("/login?error=no_email", request.url)
        );
      }

      // Map Google's 'picture' field to our 'image' field for consistency
      const userImage = googleImage || null;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email },
      });

      const profile: GoogleOAuthProfile = {
        email,
        name,
        googleId,
        userImage,
      };

      if (!user) {
        user = await createGoogleOAuthUser(profile);
        logger.info(`New user created via Google OAuth: ${email}`);
        const { invalidateAllServerCaches } = await import("@/lib/cache");
        await invalidateAllServerCaches().catch(() => {});
      } else {
        user = await updateGoogleOAuthUser(user, profile);
      }

      if (!user.id) {
        logger.error("User data corrupted: id missing");
        return NextResponse.redirect(
          new URL("/login?error=user_data_error", request.url)
        );
      }

      // Generate JWT token
      const token = generateToken(user.id);
      if (!token) {
        logger.error("Failed to generate token");
        return NextResponse.redirect(
          new URL("/login?error=token_generation_failed", request.url)
        );
      }

      // Redirect to role-appropriate page directly (avoids double-redirect chain through /)
      const roleDest =
        user.role === "client"
          ? "/client"
          : user.role === "supplier"
            ? "/supplier"
            : "/";

      const redirectUrl = new URL(roleDest, request.url);
      redirectUrl.searchParams.set("oauth_success", "true");

      // Create response and set cookies
      const response = NextResponse.redirect(redirectUrl);

      // Set session cookie
      response.cookies.set("session_id", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // Clear OAuth cookies
      response.cookies.delete("oauth_state");
      response.cookies.delete("oauth_callback");

      const { invalidateAllServerCaches } = await import("@/lib/cache");
      await invalidateAllServerCaches().catch(() => {});

      logger.info(`User authenticated via Google OAuth: ${email}`);
      return response;
    } catch (error) {
      logger.error("Error processing Google OAuth callback:", error);
      return NextResponse.redirect(
        new URL("/login?error=oauth_processing_failed", request.url)
      );
    }
  } catch (error) {
    logger.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_error", request.url)
    );
  }
}
