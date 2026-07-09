"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { Download, QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QRCodeProps {
  /**
   * QR code data (product info, URL, etc.)
   * If qrCodeUrl is provided, this will be used as fallback
   */
  data: string;
  /**
   * Pre-generated QR code URL from ImageKit (optional)
   * If provided, will use this instead of generating client-side
   */
  qrCodeUrl?: string | null;
  /**
   * Title for the QR code card
   */
  title?: string;
  /**
   * Size of QR code in pixels
   */
  size?: number;
  /**
   * Additional className for the card
   */
  className?: string;
  /**
   * Whether to show download button
   */
  showDownload?: boolean;
}

export function QRCodeComponent({
  data,
  qrCodeUrl: providedQrCodeUrl,
  title = "QR Code",
  size = 200,
  className,
  showDownload = true,
}: QRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    // If QR code URL is provided (from ImageKit), use it directly
    if (providedQrCodeUrl) {
      setQrCodeUrl(providedQrCodeUrl);
      setIsLoading(false);
      return;
    }

    // Otherwise, generate QR code client-side as fallback
    const generateQR = async () => {
      try {
        setIsLoading(true);
        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(url);
      } catch (error) {
        logger.error("Error generating QR code:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (data && isMounted) {
      generateQR();
    }
  }, [data, providedQrCodeUrl, size, isMounted]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const cardClassName = cn(
    "w-fit rounded-xl border border-white/20 dark:border-white/10",
    "bg-gradient-to-br from-gray-700/95 via-gray-600/90 to-gray-700/95 dark:from-white/10 dark:via-white/5 dark:to-white/5",
    "backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]",
    "p-4",
    className,
  );

  // Don't render QR code until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={cardClassName}>
        <div className=" flex items-center gap-2 text-white">
          <QrCode className="h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Skeleton
          className="w-full h-full rounded-lg bg-white/20 dark:bg-white/10"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return (
    <div className={cardClassName}>
      <div className=" flex items-center gap-2 text-white">
        <QrCode className="h-4 w-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex flex-col items-center gap-2 pt-0">
        {isLoading ? (
          <Skeleton
            className="w-full h-full rounded-lg bg-white/20 dark:bg-white/10"
            style={{ width: size, height: size }}
          />
        ) : (
          <Image
            src={qrCodeUrl}
            alt="QR Code"
            width={size}
            height={size}
            className="border border-white/20 dark:border-white/10 rounded-lg bg-white dark:bg-white/95"
          />
        )}
        {showDownload && qrCodeUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2 border-white/30 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-white"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
