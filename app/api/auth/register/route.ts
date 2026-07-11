/**
 * Register API Route Handler
 * App Router route handler for user registration
 * Migrated from Pages API to App Router
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { registerSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";

import { scheduleInvalidateAllServerCaches } from "@/lib/cache";
/**
 * Attempt to insert a user document. If a non-sparse unique index on
 * `googleId` blocks the insert (E11000 dup key: { googleId: null }),
 * drop that index and retry once so the registration self-heals.
 */
async function insertUserWithRetry(
  userCollection: ReturnType<ReturnType<MongoClient["db"]>["collection"]>,
  doc: Record<string, unknown>,
) {
  try {
    await userCollection.insertOne(doc);
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; message?: string };
    if (
      mongoErr.code === 11000 &&
      typeof mongoErr.message === "string" &&
      mongoErr.message.includes("googleId")
    ) {
      logger.warn(
        "Non-sparse googleId unique index detected — dropping and recreating as sparse",
      );
      try {
        await userCollection.dropIndex("User_googleId_key");
      } catch {
        // Index may already have been dropped; ignore
      }
      await userCollection.createIndex(
        { googleId: 1 },
        { unique: true, sparse: true, name: "User_googleId_key" },
      );
      await userCollection.insertOne(doc);
      return;
    }
    throw err;
  }
}

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  let mongoClient: MongoClient | null = null;
  try {
    const body = await request.json();

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid registration data", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    mongoClient = new MongoClient(process.env.DATABASE_URL!);
    await mongoClient.connect();

    const db = mongoClient.db();
    const userCollection = db.collection("User");

    // Generate a unique username
    const baseUsername = email.split("@")[0];
    let username = baseUsername;
    let counter = 1;

    while (await userCollection.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Insert user (new signups get admin role for full manipulation power)
    await insertUserWithRetry(userCollection, {
      name,
      email,
      password: hashedPassword,
      username,
      role: "admin",
      createdAt: new Date(),
    });

    await mongoClient.close();
    mongoClient = null;

    // Get the created user from Prisma
    const createdUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!createdUser) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }
    scheduleInvalidateAllServerCaches();
    return NextResponse.json(
      {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error:", error);

    const message =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 }
    );
  } finally {
    if (mongoClient) {
      try { await mongoClient.close(); } catch { /* ignore */ }
    }
  }
}
