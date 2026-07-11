import { Product } from "@/types";
import { useProductStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateProduct,
  useDeleteProduct,
  useReviewEligibility,
  useReviewsByProduct,
  useDeleteProductReview,
} from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { logger } from "@/lib/logger";
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AlertDialogWrapper } from "@/components/dialogs";
import WriteEditReviewDialog from "@/components/product-reviews/WriteEditReviewDialog";
import type { ProductReview } from "@/types";

interface ProductsDropDownProps {
  row: {
    original: Product;
  };
  /** Base path for detail link (e.g. "/admin" when on admin products page). */
  detailBase?: string;
}

export default function ProductsDropDown({
  row,
  detailBase = "",
}: ProductsDropDownProps) {
  // Keep UI state in Zustand (setSelectedProduct, setOpenProductDialog)
  const { setSelectedProduct, setOpenProductDialog } = useProductStore();
  const { user } = useAuth();

  // Use TanStack Query mutations
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Alert dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(
    null,
  );
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const productId = row.original.id;
  const productName = row.original.name;
  const { data: eligibility } = useReviewEligibility(productId, undefined, {
    enabled: menuOpen,
  });
  const { data: reviews = [] } = useReviewsByProduct(productId, {
    status: "all",
    enabled: menuOpen,
  });
  const deleteReviewMutation = useDeleteProductReview();

  const eligible = eligibility?.eligible ?? false;
  const firstSlot = eligibility?.slots?.[0];
  const myReviews = user ? reviews.filter((r) => r.userId === user.id) : [];
  const canWriteReview = eligible && firstSlot != null;
  const canEditOrDeleteReview = myReviews.length > 0;

  // Determine loading states from mutations
  const isCopying = createProductMutation.isPending;
  const isDeleting = deleteProductMutation.isPending;
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";

  // Debug log removed to prevent payload errors

  // Handle Copy Product
  const handleCopyProduct = async () => {
    try {
      const uniqueSku = `${row.original.sku}-${Date.now()}`;

      // Create product copy using TanStack Query mutation
      await createProductMutation.mutateAsync({
        name: `${row.original.name} (copy)`,
        sku: uniqueSku,
        price: row.original.price,
        quantity: row.original.quantity,
        status: row.original.status || "Available",
        categoryId: row.original.categoryId,
        supplierId: row.original.supplierId,
        userId: row.original.userId,
      });

    } catch (error) {
      // Error toast is handled by the mutation hook
      logger.error("Error copying product:", error);
    }
  };

  // Handle Edit Product
  const handleEditProduct = () => {
    try {
      setSelectedProduct(row.original);
      setOpenProductDialog(true);
    } catch (error) {
      logger.error("Error opening edit dialog:", error);
    }
  };

  const handleOpenWriteReview = () => {
    setEditingReview(null);
    setReviewDialogOpen(true);
  };
  const handleOpenEditReview = () => {
    const first = myReviews[0];
    if (first) {
      setEditingReview(first);
      setReviewDialogOpen(true);
    }
  };
  const handleReviewDialogClose = (open: boolean) => {
    setReviewDialogOpen(open);
    if (!open) setEditingReview(null);
  };
  const handleConfirmDeleteReview = () => {
    if (!deleteReviewId) return;
    deleteReviewMutation.mutate(deleteReviewId, {
      onSuccess: () => setDeleteReviewId(null),
      onError: () => setDeleteReviewId(null),
    });
  };

  // Handle Delete Product Confirmation — use mutate() with callbacks so no unhandled
  // promise rejection occurs when delete fails (e.g. 409 active orders). The dialog
  // does not await onAction, so mutateAsync would leave a rejected promise and
  // trigger the Next.js "1 Issue" overlay. Callbacks keep handling silent/graceful.
  const handleConfirmDeleteProduct = () => {
    // useDeleteProduct.onSuccess already calls cancelOrRemoveDetailQuery + invalidateAllRelatedQueries
    deleteProductMutation.mutate(row.original.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
      },
      onError: () => {
        // Toast already shown by useDeleteProduct onError; close dialog gracefully
        setDeleteDialogOpen(false);
      },
    });
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-md shadow-lg"
        >
          <DropdownMenuItem asChild>
            <Link
              href={
                detailBase
                  ? `${detailBase}/products/${row.original.id}`
                  : `/products/${row.original.id}`
              }
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCopyProduct}
            disabled={isCopying || isSupplierRole || isClientRole}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {isCopying ? "Duplicating..." : "Create Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEditProduct}
            disabled={isSupplierRole || isClientRole}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Product
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting || isSupplierRole || isClientRole}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Product"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleOpenWriteReview}
            disabled={!canWriteReview}
            className="flex items-center gap-2"
            title={
              canWriteReview
                ? undefined
                : "Purchase this product to write a review"
            }
          >
            <Star className="h-4 w-4" />
            Write review
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleOpenEditReview}
            disabled={!canEditOrDeleteReview}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit review
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => myReviews[0] && setDeleteReviewId(myReviews[0].id)}
            disabled={!canEditOrDeleteReview}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Delete review
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Write / Edit Review Dialog */}
      <WriteEditReviewDialog
        open={reviewDialogOpen}
        onOpenChange={handleReviewDialogClose}
        productId={productId}
        productName={productName}
        orderId={editingReview ? undefined : firstSlot?.orderId}
        orderItemId={
          editingReview ? undefined : (firstSlot?.orderItemId ?? undefined)
        }
        existingReview={editingReview}
      />

      {/* Delete Review Confirmation */}
      <AlertDialogWrapper
        open={!!deleteReviewId}
        onOpenChange={(open) => !open && setDeleteReviewId(null)}
        title="Delete review"
        description="Are you sure you want to delete this review? This cannot be undone."
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={deleteReviewMutation.isPending}
        onAction={handleConfirmDeleteReview}
        onCancel={() => setDeleteReviewId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${row.original.name}"? This action cannot be undone.`}
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={isDeleting}
        onAction={handleConfirmDeleteProduct}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
