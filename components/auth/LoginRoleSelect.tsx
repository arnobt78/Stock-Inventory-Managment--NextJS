"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  roleMeta,
  roleIconClassByHue,
  testAccountRoleKeys,
  type TestAccountRoleKey,
} from "@/lib/auth/test-accounts";

type LoginRoleSelectProps = {
  selectedRole: string;
  onRoleSelect: (value: string) => void;
  disabled?: boolean;
};

/**
 * REQ-0030 — test-account role Select with icons in trigger and menu items.
 * Static /login route — mount immediately (REQ-0028; no DeferredSelectGate).
 */
export function LoginRoleSelect({
  selectedRole,
  onRoleSelect,
  disabled = false,
}: LoginRoleSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedKey = selectedRole as TestAccountRoleKey;
  const selectedMeta = selectedRole ? roleMeta[selectedKey] : undefined;
  const TriggerIcon = selectedMeta?.icon ?? Users;

  return (
    <Select
      value={selectedRole}
      onValueChange={onRoleSelect}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger
        data-login-role-select
        className="w-full gap-2 border-sky-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-sky-400 focus:ring-sky-500/50"
      >
        <TriggerIcon
          className={cn(
            "h-4 w-4 shrink-0",
            selectedMeta
              ? roleIconClassByHue[selectedMeta.hue]
              : "text-gray-500 dark:text-white/50",
          )}
        />
        <span className="flex-1 truncate text-left">
          {selectedMeta?.label ?? "Select Role Based Test Account"}
        </span>
      </SelectTrigger>
      <SelectContent
        className="border-sky-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
        position="popper"
        sideOffset={5}
        align="start"
      >
        {testAccountRoleKeys.map((key) => {
          const { icon: Icon, label, hue } = roleMeta[key];
          return (
            <SelectItem
              key={key}
              value={key}
              className="cursor-pointer text-gray-700 dark:text-white focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
            >
              <span className="flex items-center gap-2">
                <Icon
                  className={cn("h-4 w-4 shrink-0", roleIconClassByHue[hue])}
                />
                <span className="truncate">{label}</span>
              </span>
            </SelectItem>
          );
        })}
        {selectedRole ? (
          <SelectItem
            value="clear"
            className="cursor-pointer text-gray-500 dark:text-white/60 opacity-60 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-500 dark:focus:text-white/60"
          >
            <span className="flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />
              <span>Clear Selection</span>
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}
