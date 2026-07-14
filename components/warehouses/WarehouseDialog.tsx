"use client";

import { useState, useCallback, useEffect } from "react";
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
  DialogFormLabel,
  GLASS_GHOST_BUTTON,
  DialogSubmitButton,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { Building2, MapPin, Layers, Plus, X } from "lucide-react";
import { useCreateWarehouse, useUpdateWarehouse } from "@/hooks/queries";
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

  useEffect(() => {
    if (externalEditingWarehouse) {
      queueMicrotask(() => {
        setName(externalEditingWarehouse.name);
        setAddress(externalEditingWarehouse.address || "");
        setType(externalEditingWarehouse.type || "");
        setStatus(externalEditingWarehouse.status ?? true);
      });
    } else if (externalEditingWarehouse === null) {
      queueMicrotask(() => {
        setName("");
        setAddress("");
        setType("");
        setStatus(true);
      });
    }
  }, [externalEditingWarehouse]);

  useEffect(() => {
    if (!open && !editingWarehouse) {
      queueMicrotask(() => {
        setName("");
        setAddress("");
        setType("");
        setStatus(true);
      });
    }
  }, [open, editingWarehouse]);

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

  // Predefined warehouse types
  const warehouseTypes = [
    { value: "main", label: "Main Warehouse" },
    { value: "secondary", label: "Secondary" },
    { value: "storage", label: "Storage" },
    { value: "distribution", label: "Distribution Center" },
    { value: "retail", label: "Retail Store" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-teal-400/30 dark:border-teal-400/30 shadow-[0_30px_80px_rgba(20,184,166,0.35)] dark:shadow-[0_30px_80px_rgba(20,184,166,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white">
            {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {editingWarehouse
              ? "Update warehouse details below."
              : "Enter the details for the new warehouse location."}
          </DialogDescription>
        </DialogHeader>
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
            <DialogFormLabel htmlFor="warehouse-type" icon={Layers}>
              Warehouse Type
            </DialogFormLabel>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className="flex h-11 w-full items-center rounded-md border border-teal-400/30 bg-white/10 px-2 text-sm text-white/60"
                  aria-hidden
                >
                  {warehouseTypes.find((wt) => wt.value === type)?.label ??
                    "Select type"}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={type}
                  onValueChange={setType}
                >
                  <SelectTrigger
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_TEAL)}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent
                    className="border-teal-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {warehouseTypes.map((wt) => (
                      <SelectItem
                        key={wt.value}
                        value={wt.value}
                        className="cursor-pointer text-gray-700 dark:text-white focus:bg-teal-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                      >
                        {wt.label}
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
