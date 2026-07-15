/**
 * Check All Data Script
 * 
 * This script displays all products, suppliers, and categories in the database.
 * 
 * Usage:
 *   npx tsx scripts/check-all-data.ts
 *   or
 *   npm run script:check-all-data
 */

import { PrismaClient } from "@prisma/client";
import { formatStableDate } from "@/lib/format";

const prisma = new PrismaClient();

/**
 * Main function to check all data
 */
async function checkAllData() {
  try {
    console.log("🔍 Checking all data in database...\n");

    // Get all products
    console.log("📦 Products:");
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        price: true,
        status: true,
        categoryId: true,
        supplierId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`   Total: ${products.length} product(s)`);
    if (products.length > 0) {
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (SKU: ${product.sku}) - Qty: ${product.quantity}, Price: $${product.price}, Status: ${product.status}`);
        console.log(`      Category ID: ${product.categoryId || 'N/A'}, Supplier ID: ${product.supplierId || 'N/A'}`);
        console.log(`      Created: ${formatStableDate(product.createdAt)}`);
      });
    } else {
      console.log("   (No products found)");
    }
    console.log();

    // Get all suppliers
    console.log("🚚 Suppliers:");
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`   Total: ${suppliers.length} supplier(s)`);
    if (suppliers.length > 0) {
      suppliers.forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.name} - Status: ${supplier.status ? 'Active' : 'Inactive'}`);
        console.log(`      ID: ${supplier.id}`);
        if (supplier.description) {
          console.log(`      Description: ${supplier.description.substring(0, 50)}${supplier.description.length > 50 ? '...' : ''}`);
        }
        if (supplier.notes) {
          console.log(`      Notes: ${supplier.notes.substring(0, 50)}${supplier.notes.length > 50 ? '...' : ''}`);
        }
        console.log(`      Created: ${formatStableDate(supplier.createdAt)}`);
        if (supplier.updatedAt) {
          console.log(`      Updated: ${formatStableDate(supplier.updatedAt)}`);
        }
      });
    } else {
      console.log("   (No suppliers found)");
    }
    console.log();

    // Get all categories
    console.log("📁 Categories:");
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`   Total: ${categories.length} category(ies)`);
    if (categories.length > 0) {
      categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} - Status: ${category.status ? 'Active' : 'Inactive'}`);
        console.log(`      ID: ${category.id}`);
        if (category.description) {
          console.log(`      Description: ${category.description.substring(0, 50)}${category.description.length > 50 ? '...' : ''}`);
        }
        if (category.notes) {
          console.log(`      Notes: ${category.notes.substring(0, 50)}${category.notes.length > 50 ? '...' : ''}`);
        }
        console.log(`      Created: ${formatStableDate(category.createdAt)}`);
        if (category.updatedAt) {
          console.log(`      Updated: ${formatStableDate(category.updatedAt)}`);
        }
      });
    } else {
      console.log("   (No categories found)");
    }
    console.log();

    // Summary
    console.log("📊 Summary:");
    console.log(`   Products: ${products.length}`);
    console.log(`   Suppliers: ${suppliers.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Total Records: ${products.length + suppliers.length + categories.length}`);

    // Check for orphaned references
    console.log("\n🔗 Reference Check:");
    const productsWithInvalidSupplier = products.filter(p => p.supplierId && !suppliers.find(s => s.id === p.supplierId));
    const productsWithInvalidCategory = products.filter(p => p.categoryId && !categories.find(c => c.id === p.categoryId));
    
    if (productsWithInvalidSupplier.length > 0) {
      console.log(`   ⚠️  ${productsWithInvalidSupplier.length} product(s) reference non-existent suppliers`);
    }
    if (productsWithInvalidCategory.length > 0) {
      console.log(`   ⚠️  ${productsWithInvalidCategory.length} product(s) reference non-existent categories`);
    }
    if (productsWithInvalidSupplier.length === 0 && productsWithInvalidCategory.length === 0 && products.length > 0) {
      console.log("   ✓ All product references are valid");
    }

  } catch (error) {
    console.error("❌ Error checking data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAllData();

