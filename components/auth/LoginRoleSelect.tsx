"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { AUTH_FORM_FIELD_SKY } from "@/components/auth/auth-glass-styles";
import {
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  filterCommandPopoverClass,
} from "@/lib/ui/popover-readability-styles";
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
        className={cn("w-full gap-2", AUTH_FORM_FIELD_SKY)}
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
        className={cn(filterCommandPopoverClass("sky"))}
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
              className={DIALOG_SELECT_ITEM_CLASS}
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
            className={cn(DIALOG_SELECT_ITEM_CLASS, "opacity-60")}
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
