/**
 * Root layout: fonts, metadata (SEO), and providers (Query, Auth, Theme, Toaster).
 * Wraps all pages; force-dynamic so useSearchParams and server session work correctly.
 */
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KeyboardShortcutsProvider } from "@/components/providers/KeyboardShortcutsProvider";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import React from "react";
import { AuthProvider } from "@/contexts";
import { ShellSsrProvider } from "@/contexts/shell-ssr-context";
import { getSession } from "@/lib/auth-server";
import { mapSessionToAppUser } from "@/lib/auth/map-session-user";
import { getShellNotificationsForUser } from "@/lib/server/notifications-data";
import { QueryProvider } from "@/lib/react-query";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AuthSessionToasts } from "@/components/shared/AuthSessionToasts";
import { SuppressApiErrorOverlay } from "@/components/shared/SuppressApiErrorOverlay";
import { RouteWarmPrefetch } from "@/components/providers/RouteWarmPrefetch";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

/** Force dynamic rendering for all routes so useSearchParams etc. work without Suspense and pages render instantly. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Stockly — Warehouse & Stock Inventory Management System",
    template: "%s | Stockly — Warehouse & Stock Inventory Management System",
  },
  description:
    "Stockly is a full-stack warehouse and stock inventory management system built with Next.js. Manage products, categories, suppliers, orders, invoices, and warehouses. Role-based access for admin, client, and supplier. Analytics dashboard, QR codes, export, and secure JWT authentication. By Arnob Mahmud.",
  authors: [
    {
      name: "Arnob Mahmud",
      url: "https://www.arnobmahmud.com",
      email: "contact@arnobmahmud.com",
    },
  ],
  creator: "Arnob Mahmud",
  publisher: "Arnob Mahmud",
  applicationName: "Stockly",
  keywords: [
    "stock inventory",
    "inventory management",
    "warehouse management",
    "stock management system",
    "Next.js",
    "React",
    "Prisma",
    "product catalog",
    "orders",
    "invoices",
    "suppliers",
    "categories",
    "JWT authentication",
    "responsive web app",
    "business dashboard",
    "Arnob Mahmud",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
    other: [{ rel: "icon", url: "/favicon.ico" }],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://stockly-inventory.vercel.app",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Stockly — Warehouse & Stock Inventory Management System",
    description:
      "Efficiently manage products, orders, invoices, and warehouses with Stockly. Secure, responsive, role-based inventory system. By Arnob Mahmud.",
    url: "https://stockly-inventory.vercel.app",
    siteName: "Stockly",
    images: [
      {
        url: "/favicon.ico",
        width: 32,
        height: 32,
        alt: "Stockly — Stock Inventory Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stockly — Warehouse & Stock Inventory Management System",
    description:
      "Efficiently manage products, orders, invoices, and warehouses. Secure, responsive inventory system. By Arnob Mahmud.",
    images: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Optional: set NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE=true on Vercel prod only (blocks Chrome Translate). */
const disableBrowserTranslate =
  process.env.NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE === "true";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const initialUser = session ? mapSessionToAppUser(session) : null;
  const shellNotifications = session
    ? await getShellNotificationsForUser(session.id)
    : null;

  return (
    <html
      lang="en"
      {...(disableBrowserTranslate ? { translate: "no" as const } : {})}
      suppressHydrationWarning
      style={{ overscrollBehavior: "none" }}
      data-scroll-behavior="smooth"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
        suppressHydrationWarning
        style={{ overscrollBehavior: "none" }}
      >
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider initialUser={initialUser}>
              <ShellSsrProvider
                value={
                  shellNotifications ?? {
                    initialNotifications: undefined,
                    initialUnreadCount: undefined,
                  }
                }
              >
              <RouteWarmPrefetch />
              <SuppressApiErrorOverlay />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <TooltipProvider delayDuration={200}>
                  <KeyboardShortcutsProvider>
                    {children}
                  </KeyboardShortcutsProvider>
                </TooltipProvider>
              </ThemeProvider>
              <AuthSessionToasts />
              <Toaster />
              </ShellSsrProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
