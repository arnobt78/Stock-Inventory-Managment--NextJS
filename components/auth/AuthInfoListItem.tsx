"use client";

import type { AuthPanelListItem } from "@/lib/auth/auth-panel-copy";
import { cn } from "@/lib/utils";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";
import { AUTH_STAGGER_MS } from "@/components/auth/auth-animation";
import { AUTH_LIST_ICON_STYLES } from "@/components/auth/auth-list-styles";
import { AUTH_LIST_ROW_GLASS } from "@/components/auth/auth-glass-styles";

type AuthInfoListItemProps = {
  item: AuthPanelListItem;
  /** Stagger index — list rows start after brand + intro. */
  staggerIndex: number;
};

/**
 * REQ-0032 — single flat list row with micro-glass + icon pill.
 * REQ-0033 — glass glow icon wrap + tighter title/description spacing.
 */
export function AuthInfoListItem({
  item,
  staggerIndex,
}: AuthInfoListItemProps) {
  const { icon: Icon, hue, title, description } = item;
  const styles = AUTH_LIST_ICON_STYLES[hue];

  return (
    <AuthAnimatedBlock delayMs={staggerIndex * AUTH_STAGGER_MS}>
      <div className={cn("flex gap-3", AUTH_LIST_ROW_GLASS)}>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            styles.wrap,
          )}
        >
          <Icon className={cn("h-5 w-5", styles.icon)} />
        </div>
        <div className="min-w-0 space-y-0.5 text-left">
          <h3 className="text-sm font-medium leading-snug text-gray-700 dark:text-white">
            {title}
          </h3>
          <p className="text-sm leading-snug text-gray-600 dark:text-white/80">
            {description}
          </p>
        </div>
      </div>
    </AuthAnimatedBlock>
  );
}
