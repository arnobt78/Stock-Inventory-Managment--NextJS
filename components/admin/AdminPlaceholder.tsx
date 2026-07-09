"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContentWrapper } from "@/components/shared";
import { Info } from "lucide-react";

type AdminPlaceholderProps = {
  title: string;
  description: string;
};

/**
 * Placeholder for admin sections not yet implemented (History, Support Tickets, etc.).
 */
export default function AdminPlaceholder({
  title,
  description,
}: AdminPlaceholderProps) {
  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-medium text-primary">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
        <Card className="border border-white/10 dark:border-white/10">
          <CardHeader className="flex flex-row items-center gap-2">
            <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <CardTitle>Coming soon</CardTitle>
            <CardDescription>
              This section is under development. It will match the style and
              functionality of the codebook-ecommerce project (e.g. search,
              filters, table view).
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </PageContentWrapper>
  );
}
