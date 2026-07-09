/**
 * Product Import Dialog Component
 * Dialog for importing products from CSV/Excel files
 */

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAllRelatedQueries } from "@/lib/react-query";

interface ProductImportDialogProps {
  /**
   * Whether the dialog is open
   */
  open?: boolean;
  /**
   * Callback when dialog open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Product Import Dialog
 * Allows users to upload CSV/Excel files to import products
 */
export function ProductImportDialog({
  open: controlledOpen,
  onOpenChange,
}: ProductImportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors?: Array<{ rowNumber: number; field?: string; message: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  /**
   * Handle file selection
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Call import API
      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Import failed");
      }

      setImportResult({
        success: true,
        totalRows: data.totalRows,
        successRows: data.successRows,
        failedRows: data.failedRows,
        errors: data.errors,
      });

      invalidateAllRelatedQueries(queryClient);

      toast({
        title: "Import Successful!",
        description: `Successfully imported ${data.successRows} of ${data.totalRows} products.`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Close dialog after a short delay if all rows succeeded
      if (data.failedRows === 0) {
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [
          {
            rowNumber: 0,
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      });

      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handle dialog open/close state changes
   * Allows opening, but prevents closing while importing
   */
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Allow opening the dialog
      setIsOpen(true);
    } else if (!isImporting) {
      // Only allow closing if not currently importing
      setIsOpen(false);
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/30 via-amber-500/15 to-amber-500/5 dark:from-amber-500/30 dark:via-amber-500/15 dark:to-amber-500/5 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(245,158,11,0.2)] backdrop-blur-md transition duration-200 hover:border-amber-300/60 hover:from-amber-500/35 hover:via-amber-500/25 hover:to-amber-500/15 dark:hover:border-amber-300/60 dark:hover:from-amber-500/35 dark:hover:via-amber-500/25 dark:hover:to-amber-500/15"
        >
          <Upload className="h-4 w-4" />
          Import Products
        </Button>
      </DialogTrigger>
      <DialogContent
        className="p-4 p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-amber-400/30 dark:border-amber-400/30 shadow-[0_30px_80px_rgba(245,158,11,0.45)] dark:shadow-[0_30px_80px_rgba(245,158,11,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white">
            Import Products
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Upload a CSV or Excel file to import products. The file should
            include columns: Product Name, SKU, Price, Quantity, Status,
            Category, Supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-400/30 dark:border-amber-400/30 rounded-xl cursor-pointer bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 transition-colors shadow-[0_10px_30px_rgba(245,158,11,0.15)]"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isImporting ? (
                  <Loader2 className="w-8 h-8 mb-2 text-amber-400 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 mb-2 text-amber-400" />
                )}
                <p className="mb-2 text-sm text-white/80">
                  <span className="font-medium">
                    {isImporting ? "Importing..." : "Click to upload"}
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-white/50">
                  CSV or Excel (MAX. 10MB)
                </p>
              </div>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </label>
          </div>

          {/* Import Result */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border backdrop-blur-md ${
                importResult.success && importResult.failedRows === 0
                  ? "bg-emerald-500/10 border-emerald-400/30 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
                  : "bg-amber-500/10 border-amber-400/30 shadow-[0_10px_30px_rgba(245,158,11,0.15)]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Import Summary</span>
                </div>
                <div className="text-sm  text-white/80">
                  <p>
                    Total Rows:{" "}
                    <strong className="text-white">
                      {importResult.totalRows}
                    </strong>
                  </p>
                  <p className="text-emerald-400">
                    Successful: <strong>{importResult.successRows}</strong>
                  </p>
                  {importResult.failedRows > 0 && (
                    <p className="text-red-400">
                      Failed: <strong>{importResult.failedRows}</strong>
                    </p>
                  )}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium mb-1 text-white/70">
                      Errors:
                    </p>
                    <ul className="text-xs  list-disc list-inside">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-red-400">
                          Row {error.rowNumber}: {error.message}
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-white/50">
                          ... and {importResult.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-9 mb-4">
          <Button
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
            className="h-11 w-full sm:w-auto px-11 inline-flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-gray-400/40 via-gray-300/30 to-gray-400/40 dark:bg-background/50 backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.3)] dark:shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition duration-200 hover:bg-gradient-to-r hover:from-gray-400/60 hover:via-gray-300/50 hover:to-gray-400/60 dark:hover:bg-accent/50 hover:border-white/20 dark:hover:border-white/20 hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_20px_45px_rgba(255,255,255,0.4)] text-white"
          >
            {importResult ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
