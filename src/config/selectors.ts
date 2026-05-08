/**
 * CSS Selectors Configuration
 * 
 * Customize these selectors for your target B2B portal.
 * Use the 3-level fallback strategy:
 * 1. Primary selector (most reliable)
 * 2. Secondary selector (alternative)
 * 3. Tertiary selector (fallback)
 * 
 * Example for another site:
 * 
 * export const SELECTORS = {
 *   product: {
 *     name: [
 *       '.product-header h1',        // Primary
 *       '[data-qa="product-name"]',  // Secondary
 *       '.product-title'             // Fallback
 *     ],
 *     price: [
 *       '.price-now',
 *       '[data-testid="current-price"]',
 *       '.product-pricing'
 *     ],
 *     stock: [
 *       '.stock-indicator',
 *       '[data-stock]',
 *       '.availability'
 *     ]
 *   }
 * };
 */

export interface SelectorConfig {
  [key: string]: string[];
}

export interface PageSelectors {
  [section: string]: SelectorConfig;
}

/**
 * GENERIC/TEMPLATE SELECTORS
 * 
 * These are common patterns found on many B2B portals.
 * Update these based on your target website's actual structure.
 */
export const GENERIC_SELECTORS: PageSelectors = {
  product: {
    name: [
      'h1.product-name',
      '[data-qa="product-name"]',
      '.product-title',
      'h1[itemprop="name"]',
    ],
    price: [
      '.price',
      '[data-price]',
      '.product-price',
      '[itemprop="price"]',
      '.current-price',
    ],
    stock: [
      '.stock-quantity',
      '[data-stock]',
      '.availability',
      '[itemprop="availability"]',
      '.product-stock',
    ],
    image: [
      '.product-image img',
      '[data-gallery] img:first-child',
      '.main-image img',
      'img[itemprop="image"]',
      '.product-photo img',
    ],
    description: [
      '.product-description',
      '[data-qa="description"]',
      '.product-details',
      '[itemprop="description"]',
    ],
    manufacturer: [
      '.brand',
      '.manufacturer',
      '[data-manufacturer]',
      '[itemprop="brand"]',
    ],
  },

  listing: {
    productCard: [
      '.product-card',
      '[data-qa="product-card"]',
      '.product-item',
      '.product-grid-item',
    ],
    pagination: [
      '.pagination',
      '[data-qa="pagination"]',
      '.pager',
      'nav[aria-label="Pagination"]',
    ],
  },

  // Common form elements
  form: {
    input: 'input',
    button: 'button',
    submit: 'button[type="submit"]',
  },
};

/**
 * Example: CUSTOM SELECTORS FOR "ACME B2B PORTAL"
 * 
 * If your target is "acme.com/b2b", you'd create something like:
 * 
 * export const ACME_PORTAL_SELECTORS: PageSelectors = {
 *   product: {
 *     name: [
 *       '.acme-product-name',         // Acme uses this class
 *       '.product-header h2',         // Fallback
 *       'h1.title'                    // Last resort
 *     ],
 *     price: [
 *       '.acme-price-final',          // Their CSS class
 *       '[data-acme-price]',          // Data attribute
 *       '.price'                      // Generic fallback
 *     ],
 *     // ... etc
 *   }
 * };
 */

/**
 * Get selectors for a section
 * 
 * @param section e.g., 'product', 'listing'
 * @returns Array of selectors to try in order
 */
export function getSelectors(section: string, field: string): string[] {
  const sectionConfig = GENERIC_SELECTORS[section];
  if (!sectionConfig) {
    console.warn(`Unknown section: ${section}`);
    return [];
  }

  const selectors = sectionConfig[field];
  if (!selectors) {
    console.warn(`Unknown field: ${section}.${field}`);
    return [];
  }

  return selectors;
}

/**
 * Try multiple selectors in order until one is found
 * 
 * Usage in your scraper:
 * 
 * const nameSelectors = getSelectors('product', 'name');
 * const nameElement = await trySelectors(page, nameSelectors);
 */
export async function trySelectors(
  page: any, // Page from Playwright
  selectors: string[]
): Promise<any> {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        return element;
      }
    } catch {
      // Selector didn't work, try next
      continue;
    }
  }
  return null;
}

/**
 * Try to extract text from multiple selectors
 */
export async function extractTextFromSelectors(
  page: any,
  selectors: string[]
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const text = await page.locator(selector).first().textContent();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Try to extract attribute from multiple selectors
 */
export async function extractAttributeFromSelectors(
  page: any,
  selectors: string[],
  attribute: string
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const value = await page.locator(selector).first().getAttribute(attribute);
      if (value && value.trim().length > 0) {
        return value.trim();
      }
    } catch {
      continue;
    }
  }
  return null;
}
