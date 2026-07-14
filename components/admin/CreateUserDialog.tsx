/**
 * Create User Dialog (Admin)
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
  DeferredSelectGate,
  DialogSubmitButton,
  DIALOG_FORM_FIELD_BLUE,
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
} from "@/components/shared";
import { Plus, Eye, EyeOff, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateUser } from "@/hooks/queries";
import {
  createUserAdminSchema,
  type CreateUserAdminFormData,
} from "@/lib/validations/user-management";

const ROLE_OPTIONS = [
  { value: "user", label: "User", color: "text-gray-600 dark:text-gray-400" },
  { value: "admin", label: "Admin", color: "text-rose-600 dark:text-rose-400" },
  {
    value: "supplier",
    label: "Supplier",
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    value: "client",
    label: "Client",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "retailer",
    label: "Retailer",
    color: "text-amber-600 dark:text-amber-400",
  },
];

export default function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserAdminFormData>({
    resolver: zodResolver(createUserAdminSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      username: "",
      role: "user",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: CreateUserAdminFormData) => {
    createUserMutation.mutate(data, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setShowPassword(false);
    }
  };

  const isPending = createUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            GLASS_BUTTON_ICON_HOVER,
            GLASS_BUTTON_SHELL_RESET,
            "gap-2 h-10 font-medium",
            GLASS_ACTION_BUTTON.blue,
          )}
        >
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-blue-400/30 dark:border-blue-400/30 shadow-[0_30px_80px_rgba(59,130,246,0.35)] dark:shadow-[0_30px_80px_rgba(59,130,246,0.25)]">
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white flex items-center gap-2">
            <div className="p-2 rounded-xl border border-blue-300/30 bg-blue-100/50 dark:border-blue-400/30 dark:bg-blue-500/20">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Create New User
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Add a new user to the system with their details and role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-white/80"
              >
                Full Name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
                autoComplete="off"
                className={cn("h-11", DIALOG_FORM_FIELD_BLUE)}
              />
              {errors.name && (
                <p className="text-sm text-rose-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-white/80"
              >
                Username
              </Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="johndoe"
                autoComplete="off"
                className={cn("h-11", DIALOG_FORM_FIELD_BLUE)}
              />
              {errors.username && (
                <p className="text-sm text-rose-400">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-white/80"
            >
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john@example.com"
              autoComplete="off"
              className={cn("h-11", DIALOG_FORM_FIELD_BLUE)}
            />
            {errors.email && (
              <p className="text-sm text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-white/80"
            >
              Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn("h-11 pr-10", DIALOG_FORM_FIELD_BLUE)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2 py-2 hover:bg-transparent text-white/60 hover:text-white/80"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-white/80">
              User Role
            </Label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className="flex h-11 w-full items-center rounded-md border border-blue-400/30 bg-white/10 px-2 text-sm text-white/60"
                  aria-hidden
                >
                  {ROLE_OPTIONS.find((o) => o.value === selectedRole)?.label ??
                    "Select role"}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={selectedRole ?? "user"}
                  onValueChange={(val) =>
                    setValue("role", val as CreateUserAdminFormData["role"])
                  }
                >
                  <SelectTrigger
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_BLUE)}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(
                      DIALOG_SELECT_CONTENT_CLASS,
                      "border-blue-400/20",
                    )}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={cn(DIALOG_SELECT_ITEM_CLASS, opt.color)}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
            {errors.role && (
              <p className="text-sm text-rose-400">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className={cn("w-full sm:w-auto px-8", GLASS_GHOST_BUTTON)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogSubmitButton
              type="submit"
              isPending={isPending}
              pendingLabel="Creating…"
              label="Create User"
              hue="blue"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
