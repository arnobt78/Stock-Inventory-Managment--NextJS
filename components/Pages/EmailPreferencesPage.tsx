"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts";
import Navbar from "@/components/layouts/Navbar";
import {
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  HelpTooltip,
  GlassCard,
  GlassCardBody,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useEmailPreferences,
  useUpdateEmailPreferences,
} from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import type { EmailPreferences } from "@/types";
import {
  Mail,
  Bell,
  Package,
  FileText,
  Truck,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Info,
  RotateCcw,
  Save,
} from "lucide-react";

export type EmailPreferencesPageProps = {
  /** When true, render only content (no Navbar) for use inside admin layout */
  embedded?: boolean;
  /** SSR-passed preferences for first-render hydration (REQ-0021) */
  initialPreferences?: EmailPreferences;
};

/**
 * Email Preferences Settings Page
 * Allows users to manage their email notification preferences
 */
export default function EmailPreferencesPage({
  embedded,
  initialPreferences,
}: EmailPreferencesPageProps = {}) {
  const { user } = useAuth();
  const preferencesQuery = useEmailPreferences(initialPreferences);
  const preferences = preferencesQuery.data ?? initialPreferences;
  const dataLoading = isDataSlotLoading(preferencesQuery, initialPreferences);
  const updateMutation = useUpdateEmailPreferences();

  const [localPreferences, setLocalPreferences] =
    useState<EmailPreferences | null>(preferences ?? null);

  useEffect(() => {
    if (preferences) {
      queueMicrotask(() => setLocalPreferences(preferences));
    }
  }, [preferences]);

  const handleToggle = (key: keyof EmailPreferences) => {
    if (!localPreferences) return;

    const updated = {
      ...localPreferences,
      [key]: !localPreferences[key],
    };
    setLocalPreferences(updated);

    updateMutation.mutate({
      preferences: {
        [key]: updated[key],
      },
    });
  };

  const handleSaveAll = () => {
    if (!localPreferences) return;
    updateMutation.mutate({
      preferences: localPreferences,
    });
  };

  const handleReset = () => {
    const defaults: EmailPreferences = {
      lowStockAlerts: true,
      stockOutNotifications: true,
      inventoryReports: true,
      productExpirationWarnings: true,
      orderConfirmations: true,
      invoiceEmails: true,
      shippingNotifications: true,
      orderStatusUpdates: true,
    };
    setLocalPreferences(defaults);
    updateMutation.mutate({
      preferences: defaults,
    });
  };

  const preferenceItems: Array<{
    key: keyof EmailPreferences;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: "lowStockAlerts",
      label: "Low Stock Alerts",
      description: "Get notified when product stock falls below threshold",
      icon: AlertTriangle,
    },
    {
      key: "stockOutNotifications",
      label: "Stock Out Notifications",
      description: "Receive alerts when products are completely out of stock",
      icon: Package,
    },
    {
      key: "inventoryReports",
      label: "Inventory Reports",
      description: "Daily, weekly, or monthly inventory summary reports",
      icon: BarChart3,
    },
    {
      key: "productExpirationWarnings",
      label: "Product Expiration Warnings",
      description: "Alerts for products approaching expiration dates",
      icon: Bell,
    },
    {
      key: "orderConfirmations",
      label: "Order Confirmations",
      description: "Email confirmations when orders are placed",
      icon: ShoppingCart,
    },
    {
      key: "invoiceEmails",
      label: "Invoice Emails",
      description: "Receive invoices and payment reminders via email",
      icon: FileText,
    },
    {
      key: "shippingNotifications",
      label: "Shipping Notifications",
      description: "Get tracking information when orders are shipped",
      icon: Truck,
    },
    {
      key: "orderStatusUpdates",
      label: "Order Status Updates",
      description: "Notifications when order status changes",
      icon: Mail,
    },
  ];

  const content = (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h1"
          icon={Mail}
          tone="sky"
          title="Email Preferences"
          description="Manage your email notification preferences. Choose which types of emails you want to receive."
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
        />

        <GlassCard variant="sky">
          <GlassCardBody>
            <SectionCardHeader
              icon={Mail}
              tone="sky"
              title="Notification Settings"
              description="Toggle email notifications on or off. Changes are saved automatically."
              className="mb-4"
              titleTrailing={
                <HelpTooltip
                  content="Toggle each type of email on or off. Changes are saved automatically."
                  side="top"
                  ariaLabel="Notification settings help"
                  className="shrink-0"
                />
              }
            />
            <div className="space-y-2">
              {preferenceItems.map((item) => {
                const Icon = item.icon;
                const isEnabled = localPreferences?.[item.key] ?? false;

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={item.key}
                          className="text-xs sm:text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
                        >
                          {item.label}
                        </Label>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {dataLoading ? (
                      <DataSlotPulse variant="badge" className="h-5 w-9" />
                    ) : (
                      <Switch
                        id={item.key}
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(item.key)}
                        disabled={updateMutation.isPending || !localPreferences}
                        className="shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {!dataLoading && localPreferences && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={updateMutation.isPending}
                  className={cn(GLASS_BUTTON_ICON_HOVER, GLASS_GHOST_BUTTON)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={updateMutation.isPending}
                  className={cn(
                    GLASS_BUTTON_ICON_HOVER,
                    "gap-2",
                    GLASS_PRIMARY_BUTTON.sky,
                  )}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            )}
          </GlassCardBody>
        </GlassCard>

        <GlassCard variant="violet">
          <GlassCardBody>
            <SectionCardHeader
              icon={Info}
              tone="violet"
              title="About Email Preferences"
              className="mb-3"
            />
            <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <p>
                • All preferences are saved automatically when you toggle them.
              </p>
              <p>• You can always change these settings later.</p>
              <p>
                • Critical system alerts may still be sent regardless of
                preferences.
              </p>
              <p>
                • Email notifications are sent to:{" "}
                <span className="font-medium text-gray-700 dark:text-white">
                  {user?.email}
                </span>
              </p>
            </div>
          </GlassCardBody>
        </GlassCard>
      </div>
    </PageContentWrapper>
  );

  if (embedded) return content;
  return <Navbar>{content}</Navbar>;
}
