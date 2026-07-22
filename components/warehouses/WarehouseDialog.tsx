"use client";

import { useState, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_TEAL,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogFormLabel,
  DialogHeaderBrand,
  GLASS_GHOST_BUTTON,
  DialogSubmitButton,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { Building2, MapPin, Layers, Plus, X } from "lucide-react";
import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/queries";
import { useSyncDialogOpenState } from "@/hooks/use-sync-dialog-open-state";
import { WarehouseTypeBadge } from "@/lib/ui/semantic-badges";
import { WAREHOUSE_TYPE_OPTIONS } from "@/lib/ui/warehouse-type-styles";
import { Warehouse } from "@/types";

interface WarehouseDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editingWarehouse?: Warehouse | null;
  onEditWarehouse?: (warehouse: Warehouse) => void;
}

export default function WarehouseDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editingWarehouse: externalEditingWarehouse,
  onEditWarehouse,
}: WarehouseDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(value);
      } else {
        setInternalOpen(value);
        controlledOnOpenChange?.(value);
      }
    },
    [isControlled, controlledOnOpenChange],
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState(true);

  const [internalEditing, setInternalEditing] = useState<Warehouse | null>(
    null,
  );
  const editingWarehouse =
    externalEditingWarehouse !== undefined
      ? externalEditingWarehouse
      : internalEditing;
  const setEditingWarehouse =
    externalEditingWarehouse !== undefined && onEditWarehouse
      ? onEditWarehouse
      : setInternalEditing;

  // REQ-0198 — sync fields on open / edit target (no queueMicrotask bounce)
  useSyncDialogOpenState(
    open,
    () => {
      if (editingWarehouse) {
        setName(editingWarehouse.name);
        setAddress(editingWarehouse.address || "");
        setType(editingWarehouse.type || "");
        setStatus(editingWarehouse.status ?? true);
      } else {
        setName("");
        setAddress("");
        setType("");
        setStatus(true);
      }
    },
    editingWarehouse?.id ?? "create",
  );

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isValid = name.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingWarehouse) {
      await updateMutation.mutateAsync({
        id: editingWarehouse.id,
        name: name.trim(),
        address: address.trim() || null,
        type: type.trim() || null,
        status,
      });
      setOpen(false);
      setEditingWarehouse(null as unknown as Warehouse);
    } else {
      await createMutation.mutateAsync({
        name: name.trim(),
        address: address.trim() || null,
        type: type.trim() || null,
        status,
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-teal-400/30 dark:border-teal-400/30 shadow-[0_30px_80px_rgba(20,184,166,0.35)] dark:shadow-[0_30px_80px_rgba(20,184,166,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeaderBrand
          icon={Building2}
          tone="teal"
          title={editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
          description={
            editingWarehouse
              ? "Update warehouse details below."
              : "Enter the details for the new warehouse location."
          }
        />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <DialogFormLabel htmlFor="warehouse-name" icon={Building2} required>
              Warehouse Name
            </DialogFormLabel>
            <Input
              id="warehouse-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Warehouse, NYC Distribution Center"
              required
              className={cn("h-11", DIALOG_FORM_FIELD_TEAL)}
            />
          </div>
          <div className="space-y-2">
            <DialogFormLabel htmlFor="warehouse-address" icon={MapPin} optional>
              Address
            </DialogFormLabel>
            <Textarea
              id="warehouse-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full street address, city, state, ZIP code"
              rows={3}
              className={cn("resize-none", DIALOG_FORM_FIELD_TEAL)}
            />
          </div>
          <div className="space-y-2">
            <DialogFormLabel htmlFor="warehouse-type" icon={Layers} optional>
              Warehouse Type
            </DialogFormLabel>
            {/* REQ-0186 — solid trigger / opaque items (ticket Status Select parity) */}
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className={cn(
                    "flex h-11 w-full items-center rounded-md px-2 text-sm",
                    DIALOG_FORM_FIELD_TEAL,
                  )}
                  aria-hidden
                >
                  {type ? (
                    <WarehouseTypeBadge
                      type={type}
                      size="compact"
                      contrast="solid"
                    />
                  ) : (
                    <span className="text-white/60">Select type</span>
                  )}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  // REQ-0186 — always string so Radix stays controlled (never undefined)
                  value={type}
                  onValueChange={setType}
                >
                  <SelectTrigger
                    id="warehouse-type"
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_TEAL)}
                  >
                    <SelectValue placeholder="Select type">
                      {type ? (
                        <WarehouseTypeBadge
                          type={type}
                          size="compact"
                          contrast="solid"
                        />
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {WAREHOUSE_TYPE_OPTIONS.map((wt) => (
                      <SelectItem
                        key={wt.value}
                        value={wt.value}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        <WarehouseTypeBadge
                          type={wt.value}
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
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-teal-400/20">
            <Switch
              id="warehouse-status"
              checked={status}
              onCheckedChange={setStatus}
              className="data-[state=checked]:bg-teal-500"
            />
            <div className="flex flex-col">
              <DialogFormLabel
                htmlFor="warehouse-status"
                className="cursor-pointer"
              >
                Active Status
              </DialogFormLabel>
              <span className="text-xs text-white/50">
                {status
                  ? "Warehouse is currently active"
                  : "Warehouse is inactive"}
              </span>
            </div>
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className={cn("h-11 w-full sm:w-auto px-8 gap-2", GLASS_GHOST_BUTTON)}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
            </DialogClose>
            <DialogSubmitButton
              isPending={isSubmitting}
              pendingLabel={
                editingWarehouse ? "Saving…" : "Creating warehouse…"
              }
              label={
                editingWarehouse ? "Update Warehouse" : "Create Warehouse"
              }
              icon={Plus}
              hue="teal"
              disabled={!isValid}
              className="h-11 px-8"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
