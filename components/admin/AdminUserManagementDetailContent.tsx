"use client";

import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  User,
  UserCog,
  ShoppingCart,
  FileText,
  DollarSign,
  Package,
  Truck,
  Tag,
  Building2,
  Shield,
} from "lucide-react";
import { useUser, useUpdateUser, useDeleteUser } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import {
  DeferredSelectGate,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
  DialogSubmitButton,
} from "@/components/shared";
import { TYPO_BODY, TYPO_BODY_MUTED, TYPO_STAT_VALUE } from "@/lib/ui/typography-scale";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { format } from "date-fns";
import type { UserForAdmin, UserRole } from "@/types";
import type { UserDetailForPage } from "@/hooks/queries/use-user-management";
import { cn } from "@/lib/utils";
import { UserRoleBadge, userRoleBadgeClass } from "@/lib/ui/semantic-badges";

type CardVariant = "violet" | "sky" | "emerald" | "amber" | "rose" | "blue";

const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = {
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
    hoverBorder: "hover:border-violet-300/40",
    iconBg: "border-violet-300/30 bg-violet-100/50",
  },
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
    hoverBorder: "hover:border-sky-300/40",
    iconBg: "border-sky-300/30 bg-sky-100/50",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient:
      "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)]",
    hoverBorder: "hover:border-emerald-300/40",
    iconBg: "border-emerald-300/30 bg-emerald-100/50",
  },
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    hoverBorder: "hover:border-amber-300/40",
    iconBg: "border-amber-300/30 bg-amber-100/50",
  },
  rose: {
    border: "border-rose-400/20",
    gradient:
      "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(225,29,72,0.15)] dark:shadow-[0_15px_40px_rgba(225,29,72,0.1)]",
    hoverBorder: "hover:border-rose-300/40",
    iconBg: "border-rose-300/30 bg-rose-100/50",
  },
  blue: {
    border: "border-blue-400/20",
    gradient:
      "bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(59,130,246,0.15)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.1)]",
    hoverBorder: "hover:border-blue-300/40",
    iconBg: "border-blue-300/30 bg-blue-100/50",
  },
};

function GlassCard({
  children,
  variant = "violet",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-md transition-all duration-300 bg-white/60 dark:bg-white/5",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

const PROTECTED_EMAILS = [
  "test@admin.com",
  "test@supplier.com",
  "test@client.com",
];

function getDisplayUsername(u: UserForAdmin): string {
  if (u.username?.trim()) return u.username.trim();
  const email = u.email ?? "";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : "—";
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "supplier", label: "Supplier" },
  { value: "client", label: "Client" },
  { value: "retailer", label: "Retailer" },
];

export type AdminUserManagementDetailContentProps = {
  initialUser?: UserDetailForPage;
};

export default function AdminUserManagementDetailContent({
  initialUser,
}: AdminUserManagementDetailContentProps = {}) {
  const params = useParams();
  const { navigateTo, handleBack } = useBackWithRefresh("user");
  const { user: currentUser } = useAuth();
  const id = params?.id as string;
  const userQuery = useUser(id, initialUser);
  const user = userQuery.data;
  const dataLoading = isDataSlotLoading(userQuery, initialUser);
  const { isError, error } = userQuery;

  useSyncSsrQueryData(queryKeys.userManagement.detail(id), initialUser);

  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const isOwner = currentUser?.id != null && currentUser.id === id;
  const isProtected = user
    ? PROTECTED_EMAILS.includes((user.email ?? "").toLowerCase())
    : false;

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!user || nameTouched) return;
    queueMicrotask(() => setName((user as UserForAdmin).name ?? ""));
  }, [user, nameTouched]);

  const handleRoleChange = useCallback(
    (newRole: string) => {
      if (!id) return;
      const v = newRole === "null" ? null : (newRole as UserRole);
      if (v === (user?.role ?? null)) return;
      updateMutation.mutate({ id, data: { role: v } });
    },
    [id, user?.role, updateMutation],
  );

  const handleSaveName = useCallback(() => {
    if (!id) return;
    updateMutation.mutate(
      { id, data: { name: name.trim() } },
      {
        onSuccess: () => {
          setNameTouched(false);
        },
      },
    );
  }, [id, name, updateMutation]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        navigateTo("/admin/user-management");
      },
    });
  }, [id, deleteMutation, navigateTo]);

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to User Management
          </Button>
          <GlassCard variant="violet">
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "User not found"}
              </p>
            </div>
          </GlassCard>
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !user) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to User Management
          </Button>
          <GlassCard variant="violet">
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                The user you are looking for does not exist or was removed.
              </p>
            </div>
          </GlassCard>
        </div>
      </PageContentWrapper>
    );
  }

  const u = user as UserForAdmin | undefined;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const nameValue = nameTouched ? name : (u?.name ?? "");
  const overview = u?.overview;
  const actionsDisabled = dataLoading || !user;
  const isProtectedResolved =
    !dataLoading && u
      ? PROTECTED_EMAILS.includes((u.email ?? "").toLowerCase())
      : false;
  const canDeleteResolved = !dataLoading && isOwner && !isProtectedResolved;

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <PageSectionHeader
          as="h1"
          tone="violet"
          icon={UserCog}
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 shrink-0 self-center rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          }
          title="User Details"
          description={
            dataLoading ? (
              <DataSlotPulse variant="text-sm" className="w-48" />
            ) : (
              <>
                {u!.name} · {u!.email}
              </>
            )
          }
        />

        <GlassCard variant="violet">
          <SectionCardHeader
            title="Profile"
            description="View and update name. Email and username are read-only."
            icon={User}
            tone="violet"
            className="mb-4"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-4">
                <div>
                  <Label className={TYPO_BODY_MUTED}>Email</Label>
                  <p className={cn("font-medium mt-1", TYPO_BODY)}>
                    {dataLoading ? (
                      <DataSlotPulse variant="text-md" className="w-48" />
                    ) : (
                      u!.email
                    )}
                  </p>
                </div>
                <div>
                  <Label className={TYPO_BODY_MUTED}>Username</Label>
                  <p className={cn("font-medium mt-1", TYPO_BODY)}>
                    {dataLoading ? (
                      <DataSlotPulse variant="text-sm" className="w-32" />
                    ) : (
                      getDisplayUsername(u!)
                    )}
                  </p>
                </div>
                <div>
                  <Label className={TYPO_BODY_MUTED}>Joined</Label>
                  <p className={cn("font-medium mt-1", TYPO_BODY)}>
                    {dataLoading ? (
                      <DataSlotPulse variant="date" />
                    ) : (
                      format(new Date(u!.createdAt), "MMMM d, yyyy 'at' h:mm a")
                    )}
                  </p>
                </div>
                <div>
                  <Label className={TYPO_BODY_MUTED}>Last Updated</Label>
                  <p className={cn("font-medium mt-1", TYPO_BODY)}>
                    {dataLoading ? (
                      <DataSlotPulse variant="date" />
                    ) : u!.updatedAt ? (
                      format(new Date(u!.updatedAt), "MMMM d, yyyy 'at' h:mm a")
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="um-name" className={TYPO_BODY_MUTED}>
                    Name
                  </Label>
                  {isProtectedResolved ? (
                    <p className={cn("font-medium mt-1", TYPO_BODY)}>
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-32" />
                      ) : (
                        (u!.name ?? "—")
                      )}
                    </p>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="um-name"
                        value={nameValue}
                        onChange={(e) => {
                          setName(e.target.value);
                          setNameTouched(true);
                        }}
                        disabled={isUpdating || actionsDisabled}
                        className="rounded-[28px] border-violet-200/50 dark:border-white/10"
                      />
                      {nameTouched && (
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="violet">
          <SectionCardHeader
            title="Role"
            description="Changes apply immediately"
            icon={Shield}
            tone="violet"
            className="mb-4"
          />
          {dataLoading ? (
            <DataSlotPulse
              variant="badge"
              className="h-9 w-[140px] rounded-[28px]"
            />
          ) : (
            <DeferredSelectGate
              placeholder={
                <div id="um-role" aria-hidden>
                  <UserRoleBadge role={u!.role ?? "user"} />
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={u!.role ?? "null"}
                  onValueChange={handleRoleChange}
                  disabled={
                    isUpdating || isProtectedResolved || actionsDisabled
                  }
                >
                  <SelectTrigger
                    id="um-role"
                    className={cn(
                      "w-auto min-w-[140px] rounded-full h-auto py-1 px-2",
                      userRoleBadgeClass(u!.role),
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="null">(none)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          )}
        </GlassCard>

        {(dataLoading || overview) && (
          <GlassCard variant="sky">
            <SectionCardHeader
              title="Overview"
              description="Orders, invoices, and activity linked to this user. Revenue = orders you created + sales from your supplier products; Spent/Due = orders/invoices where you are the buyer (userId or clientId)."
              icon={DollarSign}
              tone="sky"
              className="mb-4"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 p-2 rounded-xl border border-sky-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      overview!.orderCount
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Orders</p>
                </div>
              </Link>
              <Link
                href="/admin/invoices"
                className="flex items-center gap-2 p-2 rounded-xl border border-sky-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      overview!.invoiceCount
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Invoices</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
                <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${(overview!.totalRevenue ?? 0).toLocaleString()}`
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Total Revenue</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-emerald-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${overview!.totalSpent.toLocaleString()}`
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Total Spent</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-amber-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="currency" />
                    ) : (
                      `$${overview!.totalDue.toLocaleString()}`
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Total Due</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-sky-200/40 dark:border-white/10">
              <Link
                href="/admin/products"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      overview!.productCount
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Products</p>
                </div>
              </Link>
              <Link
                href="/admin/supplier-portal"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      overview!.supplierCount
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Suppliers</p>
                </div>
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Tag className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      overview!.categoryCount
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Categories</p>
                </div>
              </Link>
              <Link
                href="/admin/warehouses"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className={TYPO_STAT_VALUE}>
                    {dataLoading ? (
                      <DataSlotPulse variant="metric" />
                    ) : (
                      overview!.warehouseCount
                    )}
                  </p>
                  <p className={cn("text-xs", TYPO_BODY_MUTED)}>Warehouses</p>
                </div>
              </Link>
            </div>
          </GlassCard>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            className={cn("w-full sm:w-auto gap-2 px-8", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DialogSubmitButton
                type="button"
                isPending={isDeleting}
                pendingLabel="Deleting…"
                label="Delete User"
                hue="rose"
                disabled={!canDeleteResolved || isUpdating}
                className="w-full sm:w-auto gap-2 px-8"
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-medium">{u?.name ?? "—"}</span> (
                  {u?.email ?? "—"})? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </PageContentWrapper>
  );
}
