"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { useHistoryItem } from "@/hooks/queries";
import { PageContentWrapper, DataSlotPulse } from "@/components/shared";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { format } from "date-fns";
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
 * Shell-first: layout always visible; pulse dynamic slots only (REQ-0023).
 */
export default function AdminHistoryDetailContent({
  backHref = "/admin/activity-history",
  initialRecord,
}: AdminHistoryDetailContentProps = {}) {
  const params = useParams();
  const id = params?.id as string;
  const recordQuery = useHistoryItem(id, initialRecord);
  const record = recordQuery.data;
  const dataLoading = isDataSlotLoading(recordQuery, initialRecord);
  const { isError, error } = recordQuery;

  useSyncSsrQueryData(queryKeys.history.detail(id), initialRecord);

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Record not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !record) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                The import record you are looking for does not exist or was
                removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    );
  }

  const r = record as ImportHistoryForPage | undefined;
  const hasErrors = !dataLoading && r?.errors != null && r.errors.length > 0;

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref} className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-sm sm:text-lg font-medium text-foreground">
              Import History Details
            </h1>
            <p className="text-sm text-muted-foreground">
              View import run:{" "}
              {dataLoading ? (
                <DataSlotPulse variant="text-sm" className="w-48" />
              ) : (
                <>
                  {r!.importType} — {r!.fileName}
                </>
              )}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import Information
                </h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Import Type</dt>
                    <dd className="mt-1">
                      {dataLoading ? (
                        <DataSlotPulse
                          variant="badge"
                          className="h-6 w-24 rounded-full"
                        />
                      ) : (
                        <ImportTypeBadge
                          status={r!.importType}
                          label={formatSemanticLabel(r!.importType)}
                          size="detail"
                        />
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">File Name</dt>
                    <dd className="font-mono text-xs break-all">
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-full" />
                      ) : (
                        r!.fileName
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">File Size</dt>
                    <dd>
                      {dataLoading ? (
                        <DataSlotPulse variant="text-sm" className="w-16" />
                      ) : (
                        `${(r!.fileSize / 1024).toFixed(2)} KB`
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      {dataLoading ? (
                        <DataSlotPulse
                          variant="badge"
                          className="h-6 w-20 rounded-full"
                        />
                      ) : (
                        <ImportStatusBadge status={r!.status} size="detail" />
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Date</dt>
                    <dd>
                      {dataLoading ? (
                        <DataSlotPulse variant="date" />
                      ) : (
                        format(
                          new Date(r!.createdAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )
                      )}
                    </dd>
                  </div>
                  {!dataLoading && r!.completedAt && (
                    <div>
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd>
                        {format(
                          new Date(r!.completedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-medium mb-4">Row Summary</h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Total Rows</dt>
                    <dd className="font-medium">
                      {dataLoading ? (
                        <DataSlotPulse variant="metric" />
                      ) : (
                        r!.totalRows
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Successful</dt>
                    <dd className="text-green-600 dark:text-green-400 font-medium">
                      {dataLoading ? (
                        <DataSlotPulse variant="metric" />
                      ) : (
                        r!.successRows
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Failed</dt>
                    <dd className="text-red-600 dark:text-red-400 font-medium">
                      {dataLoading ? (
                        <DataSlotPulse variant="metric" />
                      ) : (
                        r!.failedRows
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasErrors && r && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error Details ({r.errors!.length} failed row(s))
              </CardTitle>
              <CardDescription>
                Row-level errors from the import. Use these to fix the file and
                re-import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {r.errors!.map((err, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 p-2 text-sm"
                  >
                    <span className="font-mono font-medium">
                      Row {err.rowNumber}
                    </span>
                    {err.field && (
                      <span className="text-muted-foreground mx-2">
                        • {err.field}
                      </span>
                    )}
                    <p className="mt-1 text-muted-foreground">{err.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContentWrapper>
  );
}
