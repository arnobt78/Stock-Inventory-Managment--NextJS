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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeferredSelectGate } from "@/components/shared";
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
      if (isControlled && controlledOnOpenChange) {
        controlledOnOpenChange(value);
      } else {
        setInternalOpen(value);
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
        className="p-4 sm:p-7 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-teal-400/30 dark:border-teal-400/30 shadow-[0_30px_80px_rgba(20,184,166,0.35)] dark:shadow-[0_30px_80px_rgba(20,184,166,0.25)]"
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
            <Label
              htmlFor="warehouse-name"
              className="text-sm font-medium text-white/80"
            >
              Warehouse Name *
            </Label>
            <Input
              id="warehouse-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Warehouse, NYC Distribution Center"
              required
              className="h-11 border-teal-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-teal-400 focus:ring-teal-500/50 shadow-[0_10px_30px_rgba(20,184,166,0.15)]"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="warehouse-address"
              className="text-sm font-medium text-white/80"
            >
              Address
            </Label>
            <Textarea
              id="warehouse-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full street address, city, state, ZIP code"
              rows={3}
              className="border-teal-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-teal-400 focus:ring-teal-500/50 shadow-[0_10px_30px_rgba(20,184,166,0.15)] resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="warehouse-type"
              className="text-sm font-medium text-white/80"
            >
              Warehouse Type
            </Label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className="flex h-11 w-full items-center rounded-md border border-teal-400/30 bg-white/10 px-3 text-sm text-white/60"
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
                  <SelectTrigger className="h-11 w-full border-teal-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-teal-400 focus:ring-teal-500/50 shadow-[0_10px_30px_rgba(20,184,166,0.15)]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent
                    className="border-teal-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm z-[100]"
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
              <Label
                htmlFor="warehouse-status"
                className="text-sm font-medium text-white/80 cursor-pointer"
              >
                Active Status
              </Label>
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
                className="h-11 w-full sm:w-auto px-8 inline-flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-sm shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full sm:w-auto px-8 inline-flex items-center justify-center rounded-xl border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/70 via-teal-500/50 to-teal-500/30 dark:from-teal-500/70 dark:via-teal-500/50 dark:to-teal-500/30 text-white shadow-[0_15px_35px_rgba(20,184,166,0.45)] backdrop-blur-sm transition duration-200 hover:border-teal-300/40 hover:from-teal-500/80 hover:via-teal-500/60 hover:to-teal-500/40 dark:hover:border-teal-300/40 dark:hover:from-teal-500/80 dark:hover:via-teal-500/60 dark:hover:to-teal-500/40 hover:shadow-[0_20px_45px_rgba(20,184,166,0.6)]"
            >
              {isSubmitting
                ? "Saving..."
                : editingWarehouse
                  ? "Update Warehouse"
                  : "Create Warehouse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
