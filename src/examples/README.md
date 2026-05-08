# Examples

This directory contains example customizations and adapters for popular B2B portals.

## Available Examples

### 1. AcmePro Portal Example (`acme-pro-example.ts`)

Complete example showing how to adapt the scraper for a specific B2B website.

**What it demonstrates:**
- ✅ Extending the base `ProductSchema` with custom fields
- ✅ Defining custom CSS selectors
- ✅ Creating a custom extractor class
- ✅ Handling AcmePro-specific business logic
- ✅ Testing your custom implementation

**How to use:**
1. Open `acme-pro-example.ts`
2. Rename to match your target site (e.g., `my-portal-example.ts`)
3. Update selectors for your website
4. Create your custom extractor class
5. Test with one product first

**Step-by-step guide:**

```typescript
// 1. Define your custom product fields
export const MyProductSchema = ProductSchema.extend({
  myCustomField: z.string(),
  warrantyMonths: z.number().optional(),
});

// 2. Find selectors from your website
// F12 → Inspector → Right-click element → "Inspect"
export const MY_SELECTORS: PageSelectors = {
  product: {
    name: ['.your-name-class', '.fallback'],
    price: ['.your-price-class', '.fallback'],
    // ... etc
  }
};

// 3. Create custom extractor
export class MyExtractor {
  async extract(page: any, sku: string) {
    // Use selectors to extract data
    // Return RawProductInput
  }
}

// 4. Test it
npm run cli -- --sku TEST001
```

## Creating Your Own Example

### File Structure

```
src/examples/
├── acme-pro-example.ts         ← Reference example
├── my-site-example.ts          ← Your custom example
├── README.md                   ← This file
└── test-data/
    └── my-site-products.json   ← Test products
```

### Checklist

- [ ] Copy `acme-pro-example.ts` → `your-site-example.ts`
- [ ] Update product schema with your fields
- [ ] Find CSS selectors for your site
- [ ] Create custom extractor class
- [ ] Test with one product
- [ ] Create example test file
- [ ] Document any special requirements
- [ ] Submit PR to add to examples

### Tips

1. **Finding selectors**: F12 → Elements → Right-click → Copy selector
2. **Testing selectors**: Use DevTools console
   ```javascript
   document.querySelectorAll('.price'); // See if it matches
   ```
3. **Handle rate limiting**: Add delays between requests
4. **Scrape during off-hours**: Be respectful to the portal
5. **Update selectors regularly**: Websites change frequently

## Popular Portal Patterns

### Industrial Supplier Sites

Usually structured:
```
<h1 class="product-name">Widget Pro</h1>
<span class="price">R$ 1.234,56</span>
<div class="stock">Qty: 45</div>
<img src="..." alt="product">
```

Typical selectors:
```typescript
name: ['h1.product-name', '.product-title'],
price: ['.price', '[data-price]'],
stock: ['.stock', '[data-qty]'],
image: ['img.product', '.main-image']
```

### E-commerce Bulk Sites

Often use semantic HTML + data attributes:
```html
<h1 itemprop="name">Product Name</h1>
<span itemprop="price" content="1234.56">R$ 1.234,56</span>
<span itemprop="availability">InStock</span>
<img itemprop="image" src="..." />
```

Typical selectors:
```typescript
name: ['h1[itemprop="name"]', '.title'],
price: ['[itemprop="price"]', '.amount'],
stock: ['[itemprop="availability"]', '.stock'],
image: ['[itemprop="image"]', '.gallery img']
```

### API-First Platforms

Some portals might be best scraped via their API:
- Check for `/api/` endpoints
- Use network tab (DevTools)
- API responses might be more reliable than HTML parsing

## Contributing Examples

Found a working example? Help others! 

1. Create a new file: `src/examples/SITE_NAME-example.ts`
2. Follow the structure from `acme-pro-example.ts`
3. Include comments explaining the site-specific logic
4. Add a test file
5. Submit a PR

Example PR description:
```
feat(example): add scraper for AcmePro portal

- Supports custom warranty field
- Handles AcmePro's unique markup
- 100% test coverage
- Tested on 10+ real products

Closes #123
```

## Troubleshooting Examples

### "Selectors don't work"

1. Check if selectors are correct (open in DevTools)
2. Website might have changed → update selectors
3. Try simpler selectors (e.g., `'h1'` instead of `'div.header h1'`)

### "Price/stock not parsing correctly"

1. Check format (e.g., "R$ 1.234,56" vs "1,234.56")
2. Might need custom parser in your extractor
3. Add normalization in the mapper

### "Need to handle authentication"

Update the browser setup in your custom extractor:

```typescript
export class MyAuthExtractor extends BaseExtractor {
  async extractWithAuth(page: any, username: string, password: string) {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', username);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Then extract
    return await this.extract(page);
  }
}
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [CSS Selectors Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Zod Documentation](https://zod.dev/)
- [Base Project README](../README.md)

---

**Happy scraping!** 🚀

If you create a working example, consider sharing it as a PR or discussion.
