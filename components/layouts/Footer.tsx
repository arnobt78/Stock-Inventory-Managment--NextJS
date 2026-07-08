"use client";

import React from "react";
import Link from "next/link";

/**
 * Footer Component
 * Displays footer with copyright year and navigation links
 * Responsive design with mobile stacking
 * Matches navbar glassmorphic styling
 */
export default function Footer() {
  // Get current year dynamically
  const currentYear = new Date().getFullYear();

  // Footer navigation links (showcase only, no actual pages)
  const footerLinks = [
    { label: "About", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ];

  return (
    <footer className="w-full border-t border-gray-200/50 dark:border-white/10 bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(2,132,199,0.15)] dark:shadow-[0_-10px_30px_rgba(15,23,42,0.25)]">
      <div className="mx-auto w-full max-w-9xl px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left Section - Copyright and Brand */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-sm text-gray-700 dark:text-muted-foreground">
            <span className="font-medium text-gray-700 dark:text-foreground text-center sm:text-left">
              Stock Inventory Management
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="text-center sm:text-left">© {currentYear}</span>
          </div>

          {/* Right Section - Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-2 sm:gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-700 dark:text-muted-foreground hover:text-sky-600 dark:hover:text-foreground transition-colors duration-300 ease-in-out"
                onClick={(e) => {
                  // Prevent navigation for showcase links
                  e.preventDefault();
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
