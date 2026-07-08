"use client";

/**
 * Test Credentials Card Component
 * Displays Stripe test credentials for demo/development
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyableFieldProps {
  label: string;
  value: string;
  className?: string;
}

function CopyableField({ label, value, className }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-lg border border-border/50 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
        "dark:border-amber-500/40 dark:bg-amber-950/40 dark:hover:bg-amber-900/40",
        className,
      )}
      onClick={handleCopy}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-emerald-700 dark:text-emerald-400">
          {label}:
        </span>
        <span className="font-mono font-medium text-emerald-700  dark:text-emerald-400">
          {value}
        </span>
      </div>
      <button
        type="button"
        className="p-1 rounded hover:bg-muted transition-colors"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export default function TestCredentialsCard() {
  return (
    <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3 pt-4 px-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-base font-semibold text-amber-700 dark:text-amber-400">
            Note: Test Credentials
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700"
          >
            Test Mode
          </Badge>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
          Use these test credentials to complete payment without entering real
          card details:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-0">
        <CopyableField label="Card Number" value="4242424242424242" />
        <div className="grid grid-cols-2 gap-2">
          <CopyableField label="Expiry" value="12/34" />
          <CopyableField label="CVC" value="123" />
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-4 leading-relaxed">
          <strong>Note:</strong> In this demo project, we haven&apos;t
          implemented user address collection during checkout. For shipping
          label generation and tracking, we&apos;re using fallback test
          addresses. In production, customers would provide their shipping
          address during checkout.
        </p>
      </CardContent>
    </Card>
  );
}
