/**
 * Shared MongoDB wipe — dependency-safe delete order for all Prisma models.
 * Used by delete-all-data.ts and reset-demo-db.ts.
 */

import type { PrismaClient } from "@prisma/client";

type DeleteStep = {
  label: string;
  run: () => Promise<{ count: number }>;
};

/** Delete every collection (children before parents). Returns per-model counts. */
export async function deleteAllDbData(
  prisma: PrismaClient,
): Promise<Record<string, number>> {
  const steps: DeleteStep[] = [
    { label: "OrderItem", run: () => prisma.orderItem.deleteMany({}) },
    { label: "SupportTicketReply", run: () => prisma.supportTicketReply.deleteMany({}) },
    { label: "Invoice", run: () => prisma.invoice.deleteMany({}) },
    { label: "Notification", run: () => prisma.notification.deleteMany({}) },
    { label: "Order", run: () => prisma.order.deleteMany({}) },
    { label: "Product", run: () => prisma.product.deleteMany({}) },
    { label: "StockAllocation", run: () => prisma.stockAllocation.deleteMany({}) },
    { label: "StockTransfer", run: () => prisma.stockTransfer.deleteMany({}) },
    { label: "ImportHistory", run: () => prisma.importHistory.deleteMany({}) },
    { label: "SupportTicket", run: () => prisma.supportTicket.deleteMany({}) },
    { label: "ProductReview", run: () => prisma.productReview.deleteMany({}) },
    { label: "AuditLog", run: () => prisma.auditLog.deleteMany({}) },
    { label: "Category", run: () => prisma.category.deleteMany({}) },
    { label: "Supplier", run: () => prisma.supplier.deleteMany({}) },
    { label: "Warehouse", run: () => prisma.warehouse.deleteMany({}) },
    { label: "Session", run: () => prisma.session.deleteMany({}) },
    { label: "Permission", run: () => prisma.permission.deleteMany({}) },
    { label: "StockAlert", run: () => prisma.stockAlert.deleteMany({}) },
    { label: "UserAction", run: () => prisma.userAction.deleteMany({}) },
    { label: "VerificationToken", run: () => prisma.verificationToken.deleteMany({}) },
    { label: "Department", run: () => prisma.department.deleteMany({}) },
    { label: "SystemConfig", run: () => prisma.systemConfig.deleteMany({}) },
    { label: "User", run: () => prisma.user.deleteMany({}) },
  ];

  const counts: Record<string, number> = {};
  for (const step of steps) {
    const result = await step.run();
    counts[step.label] = result.count;
  }
  return counts;
}
