"use client";

import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
  ShoppingCart,
  FileText,
  DollarSign,
  Package,
  Truck,
  Tag,
  Building2,
} from "lucide-react";
import { useUser, useUpdateUser, useDeleteUser } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { DeferredSelectGate, PageContentWrapper } from "@/components/shared";
import { format } from "date-fns";
import type { UserForAdmin, UserRole } from "@/types";
import { cn } from "@/lib/utils";

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
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-sm transition-all duration-300 bg-white/60 dark:bg-white/5",
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

function getRoleColor(role: string | null): string {
  switch (role ?? "") {
    case "admin":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
    case "supplier":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "client":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
    case "retailer":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

export default function AdminUserManagementDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const id = params?.id as string;
  const { data: user, isLoading, isError, error } = useUser(id);
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const isOwner = currentUser?.id != null && currentUser.id === id;
  const isProtected = user
    ? PROTECTED_EMAILS.includes((user.email ?? "").toLowerCase())
    : false;
  const canDelete = isOwner && !isProtected;

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
        router.push("/admin/user-management");
      },
    });
  }, [id, deleteMutation, router]);

  if (isError || (!isLoading && !user)) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/user-management" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to User Management
            </Link>
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

  if (isLoading || !user) {
    return (
      <PageContentWrapper>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContentWrapper>
    );
  }

  const u = user as UserForAdmin;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const nameValue = nameTouched ? name : u.name;
  const overview = u.overview;

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/user-management" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
              User Details
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {u.name} · {u.email}
            </p>
          </div>
        </div>

        <GlassCard variant="violet">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                "p-2 rounded-xl border",
                variantConfig.violet.iconBg,
                "dark:border-violet-400/30 dark:bg-violet-500/20",
              )}
            >
              <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                Profile
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                View and update name and role. Email and username are read-only.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Email
                  </Label>
                  <p className="font-medium mt-1 text-gray-700 dark:text-white">
                    {u.email}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Username
                  </Label>
                  <p className="font-medium mt-1 text-gray-700 dark:text-white">
                    {getDisplayUsername(u)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Joined
                  </Label>
                  <p className="font-medium mt-1 text-gray-700 dark:text-white">
                    {format(new Date(u.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Last Updated
                  </Label>
                  <p className="font-medium mt-1 text-gray-700 dark:text-white">
                    {u.updatedAt
                      ? format(
                          new Date(u.updatedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="um-name"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Name
                  </Label>
                  {isProtected ? (
                    <p className="font-medium mt-1 text-gray-700 dark:text-white">
                      {u.name ?? "—"}
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
                        disabled={isUpdating}
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
                <div>
                  <Label
                    htmlFor="um-role"
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Role
                  </Label>
                  <DeferredSelectGate
                    placeholder={
                      <div
                        id="um-role"
                        className={cn(
                          "w-[140px] h-9 rounded-[28px] mt-1 border flex items-center px-2 text-sm",
                          getRoleColor(u.role),
                        )}
                        aria-hidden
                      >
                        {u.role
                          ? (ROLE_OPTIONS.find((o) => o.value === u.role)
                              ?.label ?? u.role)
                          : "(none)"}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={u.role ?? "null"}
                        onValueChange={handleRoleChange}
                        disabled={isUpdating || isProtected}
                      >
                        <SelectTrigger
                          id="um-role"
                          className={cn(
                            "w-[140px] rounded-[28px] mt-1",
                            getRoleColor(u.role),
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
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Overview */}
        {overview && (
          <GlassCard variant="sky">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.sky.iconBg,
                  "dark:border-sky-400/30 dark:bg-sky-500/20",
                )}
              >
                <DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-white">
                  Overview
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Orders, invoices, and activity linked to this user. Revenue =
                  orders you created + sales from your supplier products;
                  Spent/Due = orders/invoices where you are the buyer (userId or
                  clientId).
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 p-2 rounded-xl border border-sky-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                    {overview.orderCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Orders
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/invoices"
                className="flex items-center gap-2 p-2 rounded-xl border border-sky-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                    {overview.invoiceCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Invoices
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
                <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                    ${(overview.totalRevenue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-emerald-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                    ${overview.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Spent
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-amber-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white">
                    ${overview.totalDue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Due
                  </p>
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
                  <p className="text-xl font-semibold text-gray-700 dark:text-white">
                    {overview.productCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Products
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/supplier-portal"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className="text-xl font-semibold text-gray-700 dark:text-white">
                    {overview.supplierCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Suppliers
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Tag className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className="text-xl font-semibold text-gray-700 dark:text-white">
                    {overview.categoryCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Categories
                  </p>
                </div>
              </Link>
              <Link
                href="/admin/warehouses"
                className="flex items-center gap-2 p-2 rounded-xl border border-violet-200/40 dark:border-white/10 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
              >
                <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <p className="text-xl font-semibold text-gray-700 dark:text-white">
                    {overview.warehouseCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Warehouses
                  </p>
                </div>
              </Link>
            </div>
          </GlassCard>
        )}

        {/* Danger Zone */}
        <GlassCard variant="rose" className="border-rose-300/30">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                "p-2 rounded-xl border border-rose-300/30 bg-rose-100/50",
                "dark:border-rose-400/30 dark:bg-rose-500/20",
              )}
            >
              <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                Danger Zone
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Permanently delete this user. Only the account owner can delete
                their account. This action cannot be undone.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={!canDelete || isDeleting || isUpdating}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{u.name}</span> ({u.email})?
                  This action cannot be undone.
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
        </GlassCard>
      </div>
    </PageContentWrapper>
  );
}
