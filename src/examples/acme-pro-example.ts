/**
 * Example: Customizing B2B Product Scraper for "AcmePro" Portal
 * 
 * This file shows how to adapt the universal scraper for a specific B2B site.
 * Follow this pattern for your own target website.
 */

// ============================================================================
// STEP 1: Define Your Custom Product Type
// ============================================================================

import { z } from 'zod';
import { ProductSchema } from '@/types/product';

/**
 * Extend base ProductSchema with AcmePro-specific fields
 */
export const AcmeProProductSchema = ProductSchema.extend({
  // AcmePro-specific fields
  acmeProId: z.string().min(1),
  warrantyMonths: z.number().positive().optional(),
  certifications: z.array(z.string()).optional(),
  minimumOrderQuantity: z.number().positive().optional(),
  leadTimeInDays: z.number().positive().optional(),
});

export type AcmeProProduct = z.infer<typeof AcmeProProductSchema>;

// ============================================================================
// STEP 2: Define Selectors for AcmePro Portal
// ============================================================================

import { PageSelectors } from '@/config/selectors';

/**
 * Custom selectors for AcmePro B2B portal
 * 
 * Found by:
 * 1. Opening acmepro.com/product/123
 * 2. F12 → Inspector
 * 3. Right-click on price → "Inspect" → Copy selector
 * 4. Repeat for name, stock, image
 */
export const ACMEPRO_SELECTORS: PageSelectors = {
  product: {
    name: [
      '.acme-product-header h1',      // Primary - their custom class
      'h1.product-name',               // Secondary - standard class
      '.product-title'                 // Fallback
    ],
    price: [
      '.acme-price-final',             // Primary - their custom class
      '[data-acme-price]',             // Secondary - data attribute
      '.price-now'                     // Fallback
    ],
    stock: [
      '.acme-stock-quantity',          // Primary
      '[data-stock]',                  // Secondary
      '.availability'                  // Fallback
    ],
    image: [
      '.acme-product-image img',       // Primary
      '.gallery-main img:first-child', // Secondary
      'img.product-photo'              // Fallback
    ],
    // AcmePro-specific fields
    warranty: [
      '.acme-warranty',
      '[data-warranty]'
    ],
    certifications: [
      '.acme-certifications',
      '[data-certifications]'
    ],
    leadTime: [
      '.acme-lead-time',
      '[data-delivery-days]'
    ]
  }
};

// ============================================================================
// STEP 3: Create Custom Extractor Class
// ============================================================================

import { getLogger } from '@/utils/logger';
import { extractTextFromSelectors } from '@/config/selectors';
import type { RawProductInput } from '@/types/product';

/**
 * AcmePro-specific product extractor
 */
export class AcmeProExtractor {
  private logger = getLogger();

  /**
   * Extract product data from AcmePro page
   */
  async extract(page: any, sku: string): Promise<RawProductInput> {
    this.logger.info(`Extracting AcmePro product: ${sku}`);

    const name = await extractTextFromSelectors(
      page,
      ACMEPRO_SELECTORS.product.name
    );
    const price = await extractTextFromSelectors(
      page,
      ACMEPRO_SELECTORS.product.price
    );
    const stock = await extractTextFromSelectors(
      page,
      ACMEPRO_SELECTORS.product.stock
    );
    const imageUrl = await page.locator(
      ACMEPRO_SELECTORS.product.image[0]
    ).first().getAttribute('src');

    // AcmePro-specific fields
    const warranty = await extractTextFromSelectors(
      page,
      ACMEPRO_SELECTORS.product.warranty
    );
    const leadTime = await extractTextFromSelectors(
      page,
      ACMEPRO_SELECTORS.product.leadTime
    );
    const certifications = await page.locator(
      ACMEPRO_SELECTORS.product.certifications[0]
    ).allTextContents();

    return {
      sku,
      name,
      price,
      stock,
      imageUrl,
      // Add custom fields
      acmeProId: await this.extractAcmeId(page),
      warrantyMonths: warranty ? parseInt(warranty, 10) : undefined,
      leadTimeInDays: leadTime ? parseInt(leadTime, 10) : undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
      source: 'acmepro',
      extractedAt: new Date(),
    };
  }

  /**
   * AcmePro-specific: Extract their internal product ID
   */
  private async extractAcmeId(page: any): Promise<string> {
    try {
      // AcmePro stores ID in URL or data attribute
      const id = await page.locator('[data-acme-id]').first().getAttribute('data-acme-id');
      return id || '';
    } catch {
      return '';
    }
  }
}

// ============================================================================
// STEP 4: Usage Example
// ============================================================================

/**
 * How to use the AcmePro extractor in your scraper
 * 
 * In your main scraper.ts:
 * 
 * import { AcmeProExtractor } from '@/examples/acme-pro-example';
 * 
 * const extractor = new AcmeProExtractor();
 * const rawData = await extractor.extract(page, '12345');
 * const validated = AcmeProProductSchema.parse(rawData);
 * await repository.persist(validated);
 */

// ============================================================================
// STEP 5: Test Your Custom Extractor
// ============================================================================

/**
 * Example test file: acme-pro.test.ts
 * 
 * import { describe, it, expect, beforeEach } from 'vitest';
 * import { AcmeProExtractor } from './acme-pro-example';
 * 
 * describe('AcmePro Extractor', () => {
 *   let extractor: AcmeProExtractor;
 * 
 *   beforeEach(() => {
 *     extractor = new AcmeProExtractor();
 *   });
 * 
 *   it('should extract product data from AcmePro', async () => {
 *     // Mock page with AcmePro HTML structure
 *     const product = await extractor.extract(mockPage, 'TEST-001');
 *     
 *     expect(product.name).toBeDefined();
 *     expect(product.price).toBeDefined();
 *     expect(product.acmeProId).toBeDefined();
 *   });
 * 
 *   it('should validate against AcmeProProductSchema', () => {
 *     const validated = AcmeProProductSchema.parse(product);
 *     expect(validated).toBeDefined();
 *   });
 * });
 */

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * To create your own custom scraper:
 * 
 * 1. Copy this file and rename it: src/examples/your-site-example.ts
 * 
 * 2. Update these sections:
 *    - ProductSchema (add your specific fields)
 *    - SELECTORS (update CSS selectors for your site)
 *    - Extractor class (custom extraction logic)
 * 
 * 3. Test with one product first:
 *    npm run cli -- --sku YOUR_PRODUCT_SKU
 * 
 * 4. Debug if selectors don't work:
 *    - Open your site in browser
 *    - Press F12
 *    - Find the element
 *    - Copy the selector
 *    - Update SELECTORS
 * 
 * 5. Scale up when working:
 *    npm run cli -- --csv products.csv
 * 
 * Need help? See GETTING_STARTED.md
 */
