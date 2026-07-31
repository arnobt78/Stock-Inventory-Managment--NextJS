"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeComponent } from "@/components/ui/qr-code";
import { cn } from "@/lib/utils";
import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";

interface QRCodeHoverProps {
  /**
   * QR code data (product info, URL, etc.)
   * Used as fallback if qrCodeUrl is not provided
   */
  data: string;
  /**
   * Pre-generated QR code URL from ImageKit (optional)
   * If provided, will use this instead of generating client-side
   */
  qrCodeUrl?: string | null;
  /**
   * Title for the QR code
   */
  title: string;
  /**
   * Size of QR code in pixels
   */
  size?: number;
  /** REQ-0127 — icon-only trigger (e.g. product table stock column) */
  iconOnly?: boolean;
}

export function QRCodeHover({
  data,
  qrCodeUrl,
  title,
  size = 200,
  iconOnly = false,
}: QRCodeHoverProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  // REQ-0139 — light sky border matching QR icon hue
  const iconOnlyBoxClass =
    "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-50/80 dark:border-sky-400/30 dark:bg-sky-950/30";

  if (!isMounted) {
    return iconOnly ? (
      <div className={iconOnlyBoxClass} aria-hidden>
        <QrCode className="h-5 w-5 text-sky-600 dark:text-sky-400" />
      </div>
    ) : (
      <div className="flex items-center gap-1 text-sky-600">
        <QrCode className="h-4 w-4" />
        {title}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 cursor-pointer transition-colors",
          iconOnly
            ? iconOnlyBoxClass
            : "flex items-center gap-1 min-w-0 max-w-full",
        )}
        onClick={() => setIsDialogOpen(true)}
        aria-label={`View QR code for ${title}`}
      >
        <QrCode className={cn("shrink-0", iconOnly ? "h-5 w-5" : "h-4 w-4")} />
        {!iconOnly && (
          <span className="truncate max-w-[7rem] sm:max-w-[9rem]">{title}</span>
        )}
      </button>

      {/* Dialog — same glassmorphic style as Product/Category dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-violet-400/30 dark:border-violet-400/30 shadow-[0_30px_80px_rgba(139,92,246,0.35)] dark:shadow-[0_30px_80px_rgba(139,92,246,0.25)] bg-gradient-to-br from-gray-700/98 via-gray-700/95 to-gray-700/98 dark:from-black/20 dark:via-black/10 dark:to-black/5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[22px] text-white">
              <QrCode className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Scan this QR code to view product details
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <QRCodeComponent
              data={data}
              qrCodeUrl={qrCodeUrl}
              title={title}
              size={size}
              showDownload={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
