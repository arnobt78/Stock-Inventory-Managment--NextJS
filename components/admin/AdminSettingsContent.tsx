/**
 * Admin settings page shell — Navbar + header + SystemConfigSettings.
 * REQ-0024: optional initialConfigs from SSR avoids field pulse on first paint.
 */

"use client";

import { Settings } from "lucide-react";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper } from "@/components/shared";
import SystemConfigSettings from "@/components/admin/SystemConfigSettings";
import type { SystemConfigForPage } from "@/lib/server/system-config-data";

type AdminSettingsContentProps = {
  initialConfigs?: SystemConfigForPage | null;
};

export default function AdminSettingsContent({
  initialConfigs,
}: AdminSettingsContentProps) {
  return (
    <Navbar>
      <PageContentWrapper>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-medium tracking-tight">
                System Settings
              </h1>
              <p className="text-muted-foreground">
                Configure application-wide settings
              </p>
            </div>
          </div>
          <SystemConfigSettings initialConfigs={initialConfigs} />
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
