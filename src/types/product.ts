/**
 * Universal Product Type & Zod Schema
 * 
 * Define your own product structure by extending this type.
 * This is the final, validated object that gets persisted to database.
 */

import { z } from 'zod';

/**
 * Stock status enum
 */
export const StockStatusEnum = z.enum(['in_stock', 'out_of_stock', 'unknown']);
export type StockStatus = z.infer<typeof StockStatusEnum>;

/**
 * Core Product Schema - Base structure
 * 
 * Extend this for your specific B2B portal needs:
 * 
 * const MyPortalProductSchema = ProductSchema.extend({
 *   manufacturerCode: z.string(),
 *   warrantyMonths: z.number().positive(),
 *   certifications: z.array(z.string()).optional(),
 * });
 */
export const ProductSchema = z.object({
  // ========== IDENTIFICATION ==========
  
  /** SKU or product code (unique identifier) */
  sku: z.string()
    .min(1, 'SKU cannot be empty')
    .max(50, 'SKU too long'),

  /** Product name */
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(500, 'Product name too long'),

  // ========== PRICING ==========
  
  /** Current/active price */
  price: z.number()
    .positive('Price must be positive')
    .finite('Price must be a valid number'),

  /** Original/table price (before discount) */
  originalPrice: z.number()
    .positive('Original price must be positive')
    .optional(),

  // ========== STOCK ==========
  
  /** Available quantity */
  stock: z.number()
    .int('Stock must be integer')
    .nonnegative('Stock cannot be negative'),

  /** Stock availability status */
  stockStatus: StockStatusEnum,

  // ========== IMAGES & MEDIA ==========
  
  /** Main product image URL */
  imageUrl: z.string()
    .url('Invalid image URL')
    .optional(),

  /** Gallery images */
  imageUrls: z.array(z.string().url())
    .optional(),

  // ========== METADATA ==========
  
  /** When was this product extracted */
  extractedAt: z.date(),

  /** Source portal/website */
  source: z.string()
    .min(1, 'Source cannot be empty'),

  /** External product URL */
  productUrl: z.string()
    .url('Invalid product URL')
    .optional(),

  // ========== OPTIONAL COMMON FIELDS ==========
  
  /** Product description */
  description: z.string().optional(),

  /** Category/Classification */
  category: z.string().optional(),

  /** Manufacturer */
  manufacturer: z.string().optional(),

  /** Product weight (in kg) */
  weight: z.number().positive().optional(),

  /** Dimensions (format: "L x W x H") */
  dimensions: z.string().optional(),
});

/**
 * Inferred TypeScript type from schema
 */
export type Product = z.infer<typeof ProductSchema>;

/**
 * Raw input from scraper (before normalization)
 * 
 * This is what the extractor returns - may have:
 * - Inconsistent formats
 * - Missing fields
 * - Raw strings that need parsing
 */
export interface RawProductInput {
  sku: string | null;
  name: string | null;
  price: string | number | null;
  originalPrice?: string | number | null;
  stock: string | number | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  productUrl?: string | null;
  description?: string | null;
  category?: string | null;
  manufacturer?: string | null;
  [key: string]: any; // Allow additional fields
}

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  data?: Product;
  errors: Record<string, string[]>;
}

/**
 * Validate a product against schema
 */
export function validateProduct(input: unknown): ValidationResult {
  try {
    const product = ProductSchema.parse(input);
    return {
      success: true,
      data: product,
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: { _: ['Unknown validation error'] },
    };
  }
}

/**
 * Safe parse (doesn't throw)
 */
export function safeParseProduct(input: unknown): Product | null {
  try {
    return ProductSchema.parse(input);
  } catch {
    return null;
  }
}
