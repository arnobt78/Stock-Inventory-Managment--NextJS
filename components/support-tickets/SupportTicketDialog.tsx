"use client";

/**
 * REQ-0185 / REQ-0188 — Create / Edit support ticket dialog.
 * Client/supplier: assignedTo required; densify owner Select; Priority solid/opaque badges.
 * REQ-0188 — Send-to trigger: no line-clamp clip; dual-surface owner text.
 * REQ-0190 — Edit: Send-to read-only (all roles); omit assignedToId on PUT. Create Select unchanged.
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  Pencil,
  Send,
  User,
  X,
} from "lucide-react";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_FIELD_SKY,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogFormLabel,
  DialogHeaderBrand,
  GLASS_GHOST_BUTTON,
  DialogSubmitButton,
} from "@/components/shared";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";
import {
  useCreateSupportTicket,
  useUpdateSupportTicket,
} from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";
import { TicketPriorityBadge } from "@/lib/ui/semantic-badges";
import type {
  ProductOwnerOption,
  SupportTicket,
  SupportTicketPriority,
} from "@/types";

export type { ProductOwnerOption };

const PRIORITIES: { value: SupportTicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/**
 * REQ-0185 densify Send-to row; REQ-0188 — dual surface text + circle overflow only.
 * trigger = dark glass SelectTrigger; item = light readable popover.
 * Exported for admin Reassign Select (REQ-0190).
 */
export function OwnerSelectRow({
  owner,
  avatarSize = 28,
  surface = "item",
}: {
  owner: ProductOwnerOption;
  avatarSize?: number;
  surface?: "trigger" | "item";
}) {
  const avatar = resolveAvatarSourcesFromSeed(owner.id, owner.image);
  const count = owner.productCount;
  const nameClass =
    surface === "trigger"
      ? "truncate text-sm text-white"
      : "truncate text-sm text-gray-800 dark:text-white";
  const metaClass =
    surface === "trigger"
      ? "truncate text-xs text-white/75"
      : "truncate text-xs text-muted-foreground dark:text-white/70";
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
      {/* overflow-hidden on circle only — clip image to round, no extra padding */}
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          AVATAR_RING_CLASS,
        )}
        style={{ width: avatarSize, height: avatarSize }}
      >
        <SafeAvatarImage
          src={avatar.src}
          fallbackSrc={avatar.fallbackSrc}
          alt=""
          width={avatarSize}
          height={avatarSize}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className={nameClass}>{owner.name}</span>
        <span className={metaClass}>
          {owner.email}
          {typeof count === "number"
            ? ` · ${count} product${count === 1 ? "" : "s"}`
            : ""}
        </span>
      </span>
    </span>
  );
}

export type SupportTicketDialogProps = {
  productOwners?: ProductOwnerOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  variant?: "sky" | "violet";
  /** REQ-0185 — when set, dialog is Edit mode */
  existingTicket?: SupportTicket | null;
};

export default function SupportTicketDialog({
  productOwners = [],
  open: controlledOpen,
  onOpenChange,
  trigger,
  variant = "sky",
  existingTicket = null,
}: SupportTicketDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };

  const isEdit = !!existingTicket;
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriority>("medium");
  const [assignedToId, setAssignedToId] = useState<string | null>(null);

  const createMutation = useCreateSupportTicket();
  const updateMutation = useUpdateSupportTicket();

  const role = user?.role;
  const requireAssignee =
    (role === "client" || role === "supplier") && productOwners.length > 0;
  const allowNoneOwner = role === "admin" || !requireAssignee;

  // Sync form when dialog opens (queueMicrotask — avoid set-state-in-effect lint)
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (existingTicket) {
        setSubject(existingTicket.subject ?? "");
        setDescription(existingTicket.description ?? "");
        setPriority(existingTicket.priority ?? "medium");
        setAssignedToId(existingTicket.assignedToId ?? null);
      } else {
        setSubject("");
        setDescription("");
        setPriority("medium");
        setAssignedToId(null);
      }
    });
  }, [
    open,
    existingTicket?.id,
    existingTicket?.subject,
    existingTicket?.description,
    existingTicket?.priority,
    existingTicket?.assignedToId,
  ]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isViolet = variant === "violet";
  const selectedOwner = productOwners.find((po) => po.id === assignedToId);
  // REQ-0190 — edit read-only row may use list enrich when owners list omits assignee
  const editAssigneeOwner: ProductOwnerOption | null = (() => {
    if (!isEdit || !existingTicket?.assignedToId) return selectedOwner ?? null;
    if (selectedOwner) return selectedOwner;
    return {
      id: existingTicket.assignedToId,
      name:
        existingTicket.assignedToName?.trim() ||
        existingTicket.assignedToEmail ||
        "Owner",
      email: existingTicket.assignedToEmail ?? "",
      image: existingTicket.assignedToImage ?? null,
    };
  })();

  // Create still requires assignee for client/supplier; edit never gates on Send-to
  const canSubmit =
    !!subject.trim() &&
    !!description.trim() &&
    (isEdit || !requireAssignee || !!assignedToId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (isEdit && existingTicket) {
      // REQ-0190 — never send assignedToId from edit (admin Reassign is separate)
      updateMutation.mutate(
        {
          id: existingTicket.id,
          data: {
            subject: subject.trim(),
            description: description.trim(),
            priority,
          },
        },
        {
          onSuccess: () => setOpen(false),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        assignedToId: assignedToId ?? undefined,
      },
      {
        onSuccess: () => {
          setSubject("");
          setDescription("");
          setPriority("medium");
          setAssignedToId(null);
          setOpen(false);
        },
      },
    );
  };

  const borderClass = isViolet
    ? "border-violet-400/30 dark:border-violet-400/30"
    : "border-sky-400/30 dark:border-sky-400/30";
  const shadowClass = isViolet
    ? "shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]"
    : "shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]";
  const inputClass = isViolet
    ? DIALOG_FORM_FIELD_VIOLET
    : DIALOG_FORM_FIELD_SKY;
  const submitHue = isViolet ? "violet" : "sky";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto",
          "bg-gradient-to-br from-slate-800/98 to-slate-900/98 dark:from-slate-800/98 dark:to-slate-900/98",
          borderClass,
          shadowClass,
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const first = document.getElementById("support-ticket-subject");
          if (first && first instanceof HTMLElement) first.focus();
        }}
      >
        <DialogHeaderBrand
          icon={isEdit ? Pencil : MessageSquare}
          tone={isViolet ? "violet" : "sky"}
          title={isEdit ? "Edit Support Ticket" : "Create Support Ticket"}
          description={
            isEdit
              ? "Update subject, description, or priority. Send-to cannot be changed here."
              : productOwners.length > 0
                ? "Open a new support ticket. Add a subject, description, and choose who to send it to (product owner)."
                : "Open a new support ticket. Add a subject and description."
          }
        />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-subject"
              icon={MessageSquare}
              required
            >
              Subject
            </DialogFormLabel>
            <Input
              id="support-ticket-subject"
              placeholder="Brief subject of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPending}
              className={cn("h-11 rounded-xl", inputClass)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-description"
              icon={FileText}
              required
            >
              Description
            </DialogFormLabel>
            <Textarea
              id="support-ticket-description"
              placeholder="Describe the issue or request in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className={cn("min-h-[120px] rounded-xl resize-none", inputClass)}
            />
          </div>
          {/* REQ-0190 — edit: always show Send-to as read-only; create: Select when owners exist */}
          {(isEdit || productOwners.length > 0) && (
            <div className="space-y-2">
              <DialogFormLabel
                htmlFor="support-ticket-send-to"
                icon={User}
                required={!isEdit && requireAssignee}
                optional={!isEdit && !requireAssignee}
              >
                Send to (product owner)
              </DialogFormLabel>
              {isEdit ? (
                <div
                  id="support-ticket-send-to"
                  className={cn(
                    "flex h-auto min-h-11 w-full items-center rounded-xl px-3 py-1.5",
                    inputClass,
                    "opacity-90",
                  )}
                  aria-readonly="true"
                >
                  {editAssigneeOwner ? (
                    <OwnerSelectRow
                      owner={editAssigneeOwner}
                      surface="trigger"
                    />
                  ) : (
                    <span className="text-sm text-white/75">
                      — No specific owner —
                    </span>
                  )}
                </div>
              ) : (
                <DeferredSelectGate
                  enabled={open}
                  placeholder={
                    <div
                      className={cn(
                        "flex h-11 w-full items-center rounded-xl px-2 text-sm text-white/60",
                        inputClass,
                      )}
                      aria-hidden
                    >
                      {selectedOwner ? (
                        <OwnerSelectRow
                          owner={selectedOwner}
                          surface="trigger"
                        />
                      ) : requireAssignee ? (
                        "Select product owner"
                      ) : (
                        "Select product owner (optional)"
                      )}
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      value={
                        assignedToId ?? (allowNoneOwner ? "none" : undefined)
                      }
                      onValueChange={(v) =>
                        setAssignedToId(v === "none" || !v ? null : v)
                      }
                      disabled={isPending}
                    >
                      {/* REQ-0188 — kill Radix line-clamp so avatar/meta are not clipped */}
                      <SelectTrigger
                        id="support-ticket-send-to"
                        className={cn(
                          "h-auto min-h-11 rounded-xl py-1.5",
                          "overflow-visible [&>span]:line-clamp-none [&>span]:overflow-visible [&>span]:min-w-0",
                          inputClass,
                        )}
                      >
                        <SelectValue
                          placeholder={
                            requireAssignee
                              ? "Select product owner"
                              : "Select product owner (optional)"
                          }
                        >
                          {selectedOwner ? (
                            <OwnerSelectRow
                              owner={selectedOwner}
                              surface="trigger"
                            />
                          ) : allowNoneOwner && !assignedToId ? (
                            "— No specific owner —"
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        className={cn(DIALOG_SELECT_CONTENT_CLASS, "rounded-xl")}
                        position="popper"
                        sideOffset={5}
                      >
                        {allowNoneOwner ? (
                          <SelectItem
                            value="none"
                            className={DIALOG_SELECT_ITEM_CLASS}
                          >
                            — No specific owner —
                          </SelectItem>
                        ) : null}
                        {productOwners.map((po) => (
                          <SelectItem
                            key={po.id}
                            value={po.id}
                            className={cn(DIALOG_SELECT_ITEM_CLASS, "py-2")}
                          >
                            <OwnerSelectRow owner={po} surface="item" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
              )}
            </div>
          )}
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="support-ticket-priority"
              icon={AlertTriangle}
              required
            >
              Priority
            </DialogFormLabel>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-xl px-2 text-sm text-white/60",
                    inputClass,
                  )}
                  aria-hidden
                >
                  {PRIORITIES.find((p) => p.value === priority)?.label ??
                    "Priority"}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={priority}
                  onValueChange={(v) => setPriority(v as SupportTicketPriority)}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="support-ticket-priority"
                    className={cn("h-11 rounded-xl w-full", inputClass)}
                  >
                    <SelectValue>
                      <TicketPriorityBadge
                        status={priority}
                        size="compact"
                        contrast="solid"
                      />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "rounded-xl")}
                    position="popper"
                    sideOffset={5}
                  >
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        key={p.value}
                        value={p.value}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        <TicketPriorityBadge
                          status={p.value}
                          size="compact"
                          contrast="opaque"
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className={cn("h-11 rounded-xl gap-2", GLASS_GHOST_BUTTON)}
                disabled={isPending}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
            </DialogClose>
            <DialogSubmitButton
              isPending={isPending}
              pendingLabel={isEdit ? "Saving ticket…" : "Creating ticket…"}
              label={isEdit ? "Save" : "Create Ticket"}
              icon={isEdit ? Pencil : Send}
              hue={submitHue}
              disabled={!canSubmit}
              className="h-11 rounded-xl"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
