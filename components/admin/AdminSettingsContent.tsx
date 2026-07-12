/**
 * Admin settings page shell — Navbar + header + SystemConfigSettings.
 * REQ-0024: optional initialConfigs from SSR avoids field pulse on first paint.
 */

"use client";

import { Settings } from "lucide-react";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper, PageSectionHeader } from "@/components/shared";
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
          <PageSectionHeader
            as="h1"
            icon={Settings}
            tone="blue"
            title="System Settings"
            description="Configure application-wide settings"
          />
          <SystemConfigSettings initialConfigs={initialConfigs} />
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
