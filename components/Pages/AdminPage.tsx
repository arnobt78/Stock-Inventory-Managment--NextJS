"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FiActivity,
  FiBarChart2,
  FiFileText,
  FiSettings,
  FiShoppingCart,
  FiUsers,
  FiServer,
  FiLock,
} from "react-icons/fi";
import Navbar from "@/components/layouts/Navbar";
import PageWithSidebar from "@/components/layouts/PageWithSidebar";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { PageContentWrapper } from "@/components/shared";
import { HelpTooltip } from "@/components/shared";

const linkCardClass =
  "block border border-white/10 dark:border-white/10 bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] rounded-lg transition-all duration-200 hover:border-sky-400/40 dark:hover:border-sky-400/30 hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-sky-500/20 dark:hover:via-sky-500/10 dark:hover:to-sky-500/5 hover:shadow-[0_10px_30px_rgba(2,132,199,0.2)] dark:hover:shadow-[0_10px_30px_rgba(2,132,199,0.2)]";

const disabledCardClass =
  "border border-white/10 dark:border-white/10 bg-gradient-to-br from-white/60 via-white/50 to-white/40 dark:from-white/5 dark:via-white/5 dark:to-white/5 rounded-lg opacity-75";

/**
 * Admin hub page — links to API Status, API Docs, Email Preferences, and placeholders for User Management and System Settings.
 */
export default function AdminPage() {
  return (
    <Navbar>
      <PageWithSidebar sidebarContent={<AdminSidebar />}>
        <PageContentWrapper>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-primary">
                  Admin
                </h1>
                <HelpTooltip
                  content="Quick links to system health, API docs, analytics, and notification settings."
                  ariaLabel="Admin hub help"
                />
              </div>
              <p className="text-lg text-muted-foreground">
                System administration, health, and settings
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Link href="/api-status" className={linkCardClass}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiActivity className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      <CardTitle className="text-lg">
                        API & Project Status
                      </CardTitle>
                    </div>
                    <CardDescription>
                      System health, services, uptime, and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    View health checks, database, Redis, ImageKit, Brevo
                  </CardContent>
                </Card>
              </Link>

              <Link href="/api-docs" className={linkCardClass}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiFileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      <CardTitle className="text-lg">API Docs</CardTitle>
                    </div>
                    <CardDescription>
                      OpenAPI spec, code examples, auth and rate limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Explore endpoints and copy request examples
                  </CardContent>
                </Card>
              </Link>

              <Link
                href="/settings/email-preferences"
                className={linkCardClass}
              >
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiSettings className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      <CardTitle className="text-lg">
                        Email Preferences
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Notification settings and email preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Manage in-app and email notification toggles
                  </CardContent>
                </Card>
              </Link>

              <Link href="/business-insights" className={linkCardClass}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiBarChart2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      <CardTitle className="text-lg">
                        Business Insights
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Analytics, charts, sales trends, and AI insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    View order trends, category and supplier performance
                  </CardContent>
                </Card>
              </Link>

              <Link href="/client" className={linkCardClass}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      <CardTitle className="text-lg">Client Portal</CardTitle>
                    </div>
                    <CardDescription>
                      Place orders, track shipments, manage account (coming
                      soon)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Entry point for future client catalog, cart, and checkout
                  </CardContent>
                </Card>
              </Link>

              <div className={disabledCardClass}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiUsers className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg text-muted-foreground">
                        User Management
                      </CardTitle>
                      <FiLock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>Manage users and roles</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Coming soon
                  </CardContent>
                </Card>
              </div>

              <div className={disabledCardClass}>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="">
                    <div className="flex items-center gap-2">
                      <FiServer className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg text-muted-foreground">
                        System Settings
                      </CardTitle>
                      <FiLock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>System configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Coming soon
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </PageContentWrapper>
      </PageWithSidebar>
    </Navbar>
  );
}
