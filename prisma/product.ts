/**
 * Product repository: create, get, update products with Prisma.
 * Detail fetch uses lib/server/product-detail-data.ts (prisma.product.findFirst + productInclude).
 */
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";

/**
 * Create a new product with audit fields
 */
export const createProduct = async (data: {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  status: string;
  userId: string;
  categoryId: string;
  supplierId: string;
  createdAt: Date;
}) => {
  return prisma.product.create({
    data: {
      ...data,
      createdBy: data.userId, // Set createdBy same as userId
    },
  });
};

export const getProductsByUser = async (userId: string) => {
  return prisma.product.findMany({
    where: mergeProductListWhere({ userId }),
  });
};

/**
 * Update a product with audit fields
 */
export const updateProduct = async (
  id: string,
  data: {
    name?: string;
    sku?: string;
    price?: number;
    quantity?: number;
    status?: string;
    categoryId?: string;
    supplierId?: string;
    updatedBy?: string;
  }
) => {
  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(data.updatedBy && { updatedBy: data.updatedBy }),
      updatedAt: new Date(), // Always update timestamp
    },
  });
};

export const deleteProduct = async (id: string) => {
  return prisma.product.delete({
    where: { id },
  });
};
