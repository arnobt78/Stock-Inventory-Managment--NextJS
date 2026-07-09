/**
 * Order Actions Component
 * Provides edit and delete actions for order table rows
 */

"use client";

import React, { useState } from "react";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { useDeleteOrder } from "@/hooks/queries";
import { useAuth } from "@/contexts";

interface OrderActionsProps {
  order: Order;
  onEdit: (order: Order) => void;
  /** When set (e.g. "/admin/orders"), View link goes to {detailHrefBase}/{order.id} */
  detailHrefBase?: string;
}

/**
 * Order Actions Component
 * Provides edit and delete actions for order table rows
 * Matches CategoryActions/ProductActions pattern
 */
export default function OrderActions({
  order,
  onEdit,
  detailHrefBase,
}: OrderActionsProps) {
  const { user } = useAuth();
  const deleteOrderMutation = useDeleteOrder();
  const isDeleting = deleteOrderMutation.isPending;
  const isSupplierRole = user?.role === "supplier";
  const isClientRole = user?.role === "client";
  const disableOrderActions = isSupplierRole || isClientRole;

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (
      window.confirm(
        `Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteOrderMutation.mutateAsync(order.id);
      } catch (error) {
        // Error toast is handled by the mutation hook
      }
    }
  };

  // Handle Edit Order
  const handleEditOrder = () => {
    try {
      onEdit(order);
    } catch (error) {
      // Error handling
    }
  };

  return (
    <DropdownMenu>
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
              detailHrefBase
                ? `${detailHrefBase}/${order.id}`
                : `/orders/${order.id}`
            }
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleEditOrder}
          disabled={disableOrderActions}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Order
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {order.paymentStatus === "paid" ? (
          <DropdownMenuItem asChild>
            <Link
              href={
                detailHrefBase
                  ? `${detailHrefBase}/${order.id}#reviews`
                  : `/orders/${order.id}#reviews`
              }
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Write / Edit review
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled
            className="flex items-center gap-2 text-muted-foreground"
            title="Available after order is paid"
          >
            <Star className="h-4 w-4" />
            Write / Edit review
          </DropdownMenuItem>
        )}
        {order.status !== "cancelled" && (
          <>
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={handleCancelOrder}
              disabled={isDeleting || disableOrderActions}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Cancelling..." : "Cancel Order"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
