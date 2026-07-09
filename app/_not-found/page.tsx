"use client";

import React from "react";

export const dynamic = "error"; // Ensure static rendering
export const revalidate = 0; // Disable ISR (Incremental Static Regeneration)
export const fetchCache = "only-no-store"; // Prevent caching

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-white">
        404 - Page Not Found
      </h1>
      <p className="text-lg mt-4">
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
