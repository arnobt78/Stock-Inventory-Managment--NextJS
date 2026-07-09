"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Loader2 } from "lucide-react";
import { DeferredSelectGate } from "@/components/shared";
import { useCreateSupportTicket } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { SupportTicketPriority } from "@/types";

export type ProductOwnerOption = { id: string; name: string; email: string };

const PRIORITIES: {
  value: SupportTicketPriority;
  label: string;
  color?: string;
}[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export type SupportTicketDialogProps = {
  /** When provided, show "Send to (product owner)" dropdown. Used for user/client/supplier and admin. */
  productOwners?: ProductOwnerOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  /** "sky" for user-facing pages, "violet" for admin panel */
  variant?: "sky" | "violet";
};

export default function SupportTicketDialog({
  productOwners = [],
  open: controlledOpen,
  onOpenChange,
  trigger,
  variant = "sky",
}: SupportTicketDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriority>("medium");
  const [assignedToId, setAssignedToId] = useState<string | null>(null);

  const createMutation = useCreateSupportTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
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

  const isPending = createMutation.isPending;
  const isViolet = variant === "violet";

  const borderClass = isViolet
    ? "border-violet-400/30 dark:border-violet-400/30"
    : "border-sky-400/30 dark:border-sky-400/30";
  const shadowClass = isViolet
    ? "shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)]"
    : "shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-[0_30px_80px_rgba(2,132,199,0.25)]";
  const iconBorderClass = isViolet
    ? "border-violet-300/30 bg-violet-100/50 dark:border-violet-400/30 dark:bg-violet-500/20"
    : "border-sky-300/30 bg-sky-100/50 dark:border-sky-400/30 dark:bg-sky-500/20";
  const iconColorClass = isViolet ? "text-violet-400" : "text-sky-400";
  const inputClass = isViolet
    ? "border border-violet-400/30 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/50 focus:outline-none focus:border focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 shadow-[0_10px_30px_rgba(139,92,246,0.15)]"
    : "border border-sky-400/30 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:border focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus:outline-none focus:border focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]";
  const labelClass = "text-white/80";
  const descClass = "text-white/50";
  const titleClass = "text-[22px] text-white";
  const submitButtonClass = isViolet
    ? "border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 text-white shadow-[0_15px_35px_rgba(139,92,246,0.45)] hover:border-violet-300/40 hover:from-violet-500/80"
    : "border-sky-400/30 bg-gradient-to-r from-sky-500/60 via-sky-500/50 to-sky-500/40 text-white shadow-[0_10px_30px_rgba(2,132,199,0.3)] hover:from-sky-500/70";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "p-4 p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto",
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
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", titleClass)}>
            <div className={cn("p-2 rounded-xl border", iconBorderClass)}>
              <MessageSquare className={cn("h-5 w-5", iconColorClass)} />
            </div>
            Create Support Ticket
          </DialogTitle>
          <DialogDescription className={descClass}>
            {productOwners.length > 0
              ? "Open a new support ticket. Add a subject, description, and choose who to send it to (product owner)."
              : "Open a new support ticket. Add a subject and description."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label
              htmlFor="support-ticket-subject"
              className={cn("text-sm font-medium", labelClass)}
            >
              Subject *
            </Label>
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
            <Label
              htmlFor="support-ticket-description"
              className={cn("text-sm font-medium", labelClass)}
            >
              Description *
            </Label>
            <Textarea
              id="support-ticket-description"
              placeholder="Describe the issue or request in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              className={cn("min-h-[120px] rounded-xl resize-none", inputClass)}
            />
          </div>
          {productOwners.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="support-ticket-send-to"
                className={cn("text-sm font-medium", labelClass)}
              >
                Send to (product owner)
              </Label>
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
                    {assignedToId
                      ? (productOwners.find((po) => po.id === assignedToId)
                          ?.name ?? "Select product owner")
                      : "Select product owner (optional)"}
                  </div>
                }
              >
                {({ selectRemountKey }) => (
                  <Select
                    key={selectRemountKey}
                    value={assignedToId ?? "none"}
                    onValueChange={(v) =>
                      setAssignedToId(v === "none" ? null : v)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="support-ticket-send-to"
                      className={cn("h-11 rounded-xl", inputClass)}
                    >
                      <SelectValue placeholder="Select product owner (optional)" />
                    </SelectTrigger>
                    <SelectContent
                      className="rounded-xl border-sky-400/20 dark:border-white/10 bg-white/95 dark:bg-popover/95 backdrop-blur-md"
                      position="popper"
                      sideOffset={5}
                    >
                      <SelectItem value="none" className="cursor-pointer">
                        — No specific owner —
                      </SelectItem>
                      {productOwners.map((po) => (
                        <SelectItem
                          key={po.id}
                          value={po.id}
                          className="cursor-pointer"
                        >
                          {po.name} ({po.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </DeferredSelectGate>
            </div>
          )}
          <div className="space-y-2">
            <Label
              htmlFor="support-ticket-priority"
              className={cn("text-sm font-medium", labelClass)}
            >
              Priority
            </Label>
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-xl border-sky-400/20 dark:border-white/10 bg-white/95 dark:bg-popover/95"
                    position="popper"
                    sideOffset={5}
                  >
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        key={p.value}
                        value={p.value}
                        className="cursor-pointer"
                      >
                        {p.label}
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
                className="h-11 rounded-xl border border-white/20 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md"
                disabled={isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending || !subject.trim() || !description.trim()}
              className={cn(
                "h-11 rounded-xl",
                submitButtonClass,
                "backdrop-blur-md transition duration-200 disabled:opacity-50",
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
