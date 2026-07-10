"use client";

import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { AuthInfoListItem } from "@/components/auth/AuthInfoListItem";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";
import { AUTH_STAGGER_MS } from "@/components/auth/auth-animation";
import { getAuthPanelCopy } from "@/lib/auth/auth-panel-copy";
import type { AuthGlassVariant } from "@/components/auth/auth-glass-styles";

type AuthInfoPanelProps = {
  variant: AuthGlassVariant;
};

/**
 * REQ-0032 — flat left column: brand + intro + staggered list rows (no outer card).
 * REQ-0033 — tighter space-y-1 stack between intro and list rows.
 */
export function AuthInfoPanel({ variant }: AuthInfoPanelProps) {
  const { sectionTitle, sectionLead, items } = getAuthPanelCopy(variant);

  return (
    <div className="flex w-full flex-col space-y-1">
      <AuthBrandHeader />

      <AuthAnimatedBlock delayMs={AUTH_STAGGER_MS * 2}>
        <div className="space-y-1 px-1 text-left">
          <h2 className="text-lg font-medium text-gray-700 dark:text-white tracking-tight">
            {sectionTitle}
          </h2>
          <p className="text-sm text-gray-600 dark:text-white/75 leading-snug">
            {sectionLead}
          </p>
        </div>
      </AuthAnimatedBlock>

      <div className="flex flex-col space-y-1">
        {items.map((item, index) => (
          <AuthInfoListItem
            key={item.id}
            item={item}
            staggerIndex={3 + index}
          />
        ))}
      </div>
    </div>
  );
}
