"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Calendar,
  HardDrive,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react";
import { useHistoryItem } from "@/hooks/queries";
import {
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  GLASS_GHOST_BUTTON,
  glassDetailBackButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  ClientDateTime,
} from "@/components/shared";
import { GlassCard, DetailInfoRow } from "@/components/orders/detail";
import { APP_SHELL_DETAIL_CLASS } from "@/lib/ui/shell-layout-styles";
import { cn } from "@/lib/utils";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import {
  ImportStatusBadge,
  ImportTypeBadge,
  formatSemanticLabel,
} from "@/lib/ui/semantic-badges";
import type { ImportHistoryForPage } from "@/types";

export type AdminHistoryDetailContentProps = {
  /** Back link target (e.g. "/admin/activity-history") */
  backHref?: string;
  initialRecord?: ImportHistoryForPage;
};

/**
 * Admin History Detail — view a single import history record.
 * REQ-0075 AC4 — PageSectionHeader + GlassCard + DetailInfoRow parity.
 * REQ-0077 — footer Back uses glassDetailBackButtonClass (admin embed parity).
 */
export default function AdminHistoryDetailContent({
  backHref = "/admin/activity-history",
  initialRecord,
}: AdminHistoryDetailContentProps = {}) {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const recordQuery = useHistoryItem(id, initialRecord);
  const record = recordQuery.data;
  const dataLoading = isDataSlotLoading(recordQuery, initialRecord);
  const { isError, error } = recordQuery;

  useSyncSsrQueryData(queryKeys.history.detail(id), initialRecord);

  /** Narrow invalidation — refresh history list when returning (read-only detail). */
  const handleBack = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.history.lists() });
    router.push(backHref);
  };

  const footerBackRow = (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
      <Button
        onClick={handleBack}
        className={glassDetailBackButtonClass("w-full sm:w-auto gap-2 px-8")}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        Back
      </Button>
    </div>
  );

  if (isError) {
    return (
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <Button size="sm" asChild className={cn("gap-2", GLASS_GHOST_BUTTON)}>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>
          </Button>
          <GlassCard variant="rose">
            <p className="py-8 text-center text-gray-600 dark:text-white/70">
              {error instanceof Error ? error.message : "Record not found"}
            </p>
          </GlassCard>
          {footerBackRow}
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !record) {
    return (
      <PageContentWrapper>
        <div className={APP_SHELL_DETAIL_CLASS}>
          <Button size="sm" asChild className={cn("gap-2", GLASS_GHOST_BUTTON)}>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>
          </Button>
          <GlassCard variant="rose">
            <p className="py-8 text-center text-gray-600 dark:text-white/70">
              The import record you are looking for does not exist or was removed.
            </p>
          </GlassCard>
          {footerBackRow}
        </div>
      </PageContentWrapper>
    );
  }

  const r = record as ImportHistoryForPage | undefined;
  const hasErrors = !dataLoading && r?.errors != null && r.errors.length > 0;

  return (
    <PageContentWrapper>
      <div className={APP_SHELL_DETAIL_CLASS}>
        <PageSectionHeader
          as="h1"
          tone="violet"
          icon={FileText}
          leading={
            <Button variant="ghost" size="icon" asChild>
              <Link href={backHref} className={DETAIL_HEADER_BACK_ICON_CLASS}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          }
          title="Import History Details"
          description={
            dataLoading ? (
              <DataSlotPulse variant="text-sm" className="w-48" />
            ) : (
              <>
                {r!.importType} — {r!.fileName}
              </>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          <GlassCard variant="violet">
            <SectionCardHeader
              icon={FileText}
              tone="violet"
              title="Import Information"
            />
            <div className="space-y-2 mt-4">
              <DetailInfoRow icon={Layers} label="Import Type:" tone="violet" loading={dataLoading}>
                {!dataLoading && (
                  <ImportTypeBadge
                    status={r!.importType}
                    label={formatSemanticLabel(r!.importType)}
                    size="detail"
                  />
                )}
              </DetailInfoRow>
              <DetailInfoRow icon={FileText} label="File Name:" tone="sky" loading={dataLoading}>
                {!dataLoading && (
                  <span className="font-mono text-xs break-all">{r!.fileName}</span>
                )}
              </DetailInfoRow>
              <DetailInfoRow icon={HardDrive} label="File Size:" tone="blue" loading={dataLoading}>
                {!dataLoading && `${(r!.fileSize / 1024).toFixed(2)} KB`}
              </DetailInfoRow>
              <DetailInfoRow icon={CheckCircle} label="Status:" tone="emerald" loading={dataLoading}>
                {!dataLoading && <ImportStatusBadge status={r!.status} size="detail" />}
              </DetailInfoRow>
              <DetailInfoRow icon={Calendar} label="Date:" tone="orange" loading={dataLoading}>
                {!dataLoading && <ClientDateTime date={new Date(r!.createdAt)} />}
              </DetailInfoRow>
              {!dataLoading && r!.completedAt && (
                <DetailInfoRow icon={Calendar} label="Completed:" tone="amber">
                  <ClientDateTime date={new Date(r!.completedAt)} />
                </DetailInfoRow>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="teal">
            <SectionCardHeader icon={Layers} tone="teal" title="Row Summary" />
            <div className="space-y-2 mt-4">
              <DetailInfoRow icon={Layers} label="Total Rows:" tone="teal" loading={dataLoading}>
                {!dataLoading && r!.totalRows}
              </DetailInfoRow>
              <DetailInfoRow icon={CheckCircle} label="Successful:" tone="emerald" loading={dataLoading}>
                {!dataLoading && (
                  <span className="text-green-600 dark:text-green-400">{r!.successRows}</span>
                )}
              </DetailInfoRow>
              <DetailInfoRow icon={XCircle} label="Failed:" tone="rose" loading={dataLoading}>
                {!dataLoading && (
                  <span className="text-red-600 dark:text-red-400">{r!.failedRows}</span>
                )}
              </DetailInfoRow>
            </div>
          </GlassCard>
        </div>

        {hasErrors && r && (
          <GlassCard variant="rose">
            <SectionCardHeader
              icon={AlertCircle}
              tone="rose"
              title={`Error Details (${r.errors!.length} failed row(s))`}
              description="Row-level errors from the import. Use these to fix the file and re-import."
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4">
              {r.errors!.map((err, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 p-2 text-sm"
                >
                  <span className="font-mono font-medium">Row {err.rowNumber}</span>
                  {err.field && (
                    <span className="text-gray-500 dark:text-gray-400 mx-2">
                      • {err.field}
                    </span>
                  )}
                  <p className="mt-1 text-gray-600 dark:text-white/70">{err.message}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {footerBackRow}
      </div>
    </PageContentWrapper>
  );
}
