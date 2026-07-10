"use client";

import Link from "next/link";
import { AiFillProduct } from "react-icons/ai";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";

/**
 * REQ-0031 — Navbar-matched brand for auth left column.
 * Keep icon box + title classes in sync with components/layouts/Navbar.tsx.
 */
export function AuthBrandHeader() {
  return (
    <AuthAnimatedBlock delayMs={0}>
      <Link
        href="/"
        className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
        aria-label="Stockly — Stock Inventory Management"
      >
        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 dark:border-rose-400/30 bg-gradient-to-br from-rose-500/30 via-rose-500/15 to-rose-500/8 dark:from-rose-500/20 dark:via-rose-500/15 dark:to-rose-500/10 shadow-[0_5px_20px_rgba(225,29,72,0.3)] dark:shadow-[0_5px_20px_rgba(225,29,72,0.25)] backdrop-blur-md transition-all duration-200 group-hover:border-rose-400/60 dark:group-hover:border-rose-400/40 group-hover:from-rose-500/40 group-hover:via-rose-500/20 group-hover:to-rose-500/10 dark:group-hover:from-rose-500/30 dark:group-hover:via-rose-500/20 dark:group-hover:to-rose-500/15 group-hover:shadow-[0_10px_35px_rgba(225,29,72,0.5)] dark:group-hover:shadow-[0_10px_35px_rgba(225,29,72,0.4)]">
          <AiFillProduct className="text-lg sm:text-xl text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-lg font-medium tracking-tight bg-gradient-to-r from-rose-600 to-gray-900 dark:from-rose-400 dark:to-gray-100 bg-clip-text text-transparent lg:text-xl transition-all duration-300 ease-in-out group-hover:from-rose-700 group-hover:to-gray-950 dark:group-hover:from-rose-300 dark:group-hover:to-gray-50">
            Stockly
          </p>
          <p className="text-sm text-gray-600 dark:text-white/70 leading-snug">
            Stock Inventory Management
          </p>
        </div>
      </Link>
    </AuthAnimatedBlock>
  );
}
