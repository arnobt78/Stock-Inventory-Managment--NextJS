/**
 * Product Image Upload Field Component
 * Handles product image upload to ImageKit
 */

"use client";

import { useState, useRef } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { DialogFormLabel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MdError } from "react-icons/md";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function ImageField() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Watch imageUrl and imageFileId values
  const imageUrl = watch("imageUrl");
  const imageFileId = watch("imageFileId");
  const sku = watch("sku");

  /**
   * Handle image file selection and upload
   */
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only JPEG, PNG, and WebP images are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);
      if (sku) {
        formData.append("sku", sku);
      }

      // Upload image to ImageKit via API
      const response = await fetch("/api/products/image", {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Upload failed");
      }

      // Update form values
      setValue("imageUrl", data.imageUrl, { shouldValidate: true });
      setValue("imageFileId", data.imageFileId, { shouldValidate: true });

      toast({
        title: "Image Uploaded!",
        description: "Product image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Handle image removal
   */
  const handleRemoveImage = async () => {
    if (imageFileId) {
      try {
        // Delete image from ImageKit
        await fetch(`/api/products/image?fileId=${imageFileId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (error) {
        // Log error but continue with removal
        console.error("Failed to delete image from ImageKit:", error);
      }
    }

    // Clear form values
    setValue("imageUrl", "", { shouldValidate: true });
    setValue("imageFileId", "", { shouldValidate: true });
  };

  return (
    <div className="mt-5 flex h-full flex-col gap-2">
      <DialogFormLabel htmlFor="product-image" icon={ImageIcon} optional>
        Product Image
      </DialogFormLabel>

      {/* Hidden input for form registration */}
      <Input {...register("imageUrl")} type="hidden" id="imageUrl" />
      <Input {...register("imageFileId")} type="hidden" id="imageFileId" />

      {/* Image Preview */}
      {imageUrl && (
        <div className="relative w-full">
          <SafeImage
            src={imageUrl}
            alt="Product preview"
            width={256}
            height={128}
            className="w-full h-32 object-cover rounded-lg border border-rose-400/30"
            unoptimized={imageUrl.includes("ik.imagekit.io")} // ImageKit handles optimization
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload control — match h-11 input height in product dialog grid */}
      {!imageUrl && (
        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-11 w-full rounded-xl border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-rose-500/15 dark:from-rose-500/30 dark:via-rose-500/20 dark:to-rose-500/15 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-md transition duration-200 hover:border-rose-300/40 hover:from-rose-500/40 hover:via-rose-500/30 hover:to-rose-500/20 dark:hover:border-rose-300/40 dark:hover:from-rose-500/40 dark:hover:via-rose-500/30 dark:hover:to-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
            id="product-image"
          />
        </div>
      )}

      {errors.imageUrl && (
        <div className="text-red-500 flex gap-1 items-center text-[13px]">
          <MdError />
          <p>{String(errors.imageUrl.message)}</p>
        </div>
      )}
    </div>
  );
}
