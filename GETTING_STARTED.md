# 🚀 Getting Started with B2B Product Scraper

## 5-Minute Setup

### Step 1: Prerequisites

```bash
# Check you have Node.js 18+
node --version   # Should be v18+
npm --version    # Should be v9+

# Install Playwright browsers
npx playwright install
```

### Step 2: Clone & Install

```bash
git clone https://github.com/yourusername/b2b-product-scraper.git
cd b2b-product-scraper
npm install
```

### Step 3: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings → API** and copy:
   - `SUPABASE_URL` 
   - `SERVICE_ROLE KEY`

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 5: Customize for Your Portal

#### Option A: Use Generic Selectors (Basic)

If your B2B portal uses standard HTML patterns, the included generic selectors might work:

```bash
npm run cli -- --sku 123456
```

#### Option B: Customize Selectors (Recommended)

1. Open your target website in browser
2. Inspect the product page (F12)
3. Find the CSS classes/IDs for: name, price, stock, image
4. Update `src/config/selectors.ts`:

```typescript
export const CUSTOM_SELECTORS: PageSelectors = {
  product: {
    name: [
      '.your-site-product-name',    // Primary
      '.product-header h1',          // Secondary
      'h1'                           // Fallback
    ],
    price: [
      '.your-site-price',            // Primary
      '[data-price]',                // Secondary
      '.price'                       // Fallback
    ],
    stock: [
      '.your-site-stock',
      '[data-availability]',
      '.stock'
    ],
    image: [
      '.your-site-product-image img',
      '.main-image',
      'img.product'
    ]
  }
};
```

### Step 6: Build & Test

```bash
# Build TypeScript
npm run build

# Test with a single product
npm run cli -- --sku 123456

# Expected output:
# ✅ Extracting product 123456...
#    ├─ Name: "Widget Pro"
#    ├─ Price: R$ 299,90
#    ├─ Stock: 45 units
#    └─ Persisted ✓
```

---

## Common Patterns by Site Type

### Industrial Supplier (B2B)

Usually structured like: `name | price | stock | image`

**Selectors to try**:
```typescript
name: ['.prod-name', '.item-title', 'h2.product'],
price: ['.prod-price', '.item-cost', '[data-price]'],
stock: ['.prod-qty', '.stock-level', '.availability'],
image: ['.prod-img', '.thumb-image img', 'img[alt]']
```

### E-commerce Bulk Portal

Often uses data attributes for SEO: `itemprop="name"`, etc.

**Selectors to try**:
```typescript
name: ['h1[itemprop="name"]', 'h1.title', '.product-name'],
price: ['[itemprop="price"]', '.price-now', '.amount'],
stock: ['[itemprop="availability"]', '.stock-qty', '.in-stock'],
image: ['img[itemprop="image"]', '.product-photo', '.gallery img']
```

### Distributor Catalog

Often has complex layouts with nested divs.

**Debug tip**: Right-click → Inspect → Look for `data-testid` or `class` attributes

---

## Testing Your Setup

```bash
# Run the test suite
npm test

# Watch mode (for development)
npm test -- --watch

# See what tests exist
npm test -- --list
```

### Example Manual Test

```bash
# Create test file: test-product.json
[
  { "sku": "TEST001", "internalId": "ID-001" },
  { "sku": "TEST002", "internalId": "ID-002" }
]

# Run scraper
npm run cli -- --json test-product.json

# Check database (Supabase dashboard)
# Table: products → should have new rows
```

---

## Troubleshooting

### ❌ "Price not found"

**Cause**: CSS selector doesn't match your site

**Solution**:
1. Open site → F12 (DevTools)
2. Inspect price element
3. Copy the selector
4. Update `src/config/selectors.ts`

### ❌ "SUPABASE_URL not configured"

**Cause**: `.env` file not set up

**Solution**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

### ❌ "Connection timeout"

**Cause**: Page loads slowly or site blocks Playwright

**Solution**:
```env
# Increase timeout in .env
PLAYWRIGHT_TIMEOUT=90000  # 90 seconds instead of 45

# Or disable headless mode to see what's happening
HEADLESS=false
```

### ❌ "Stock format not recognized"

**Cause**: Stock parsing doesn't handle your format

**Solution**:

Update `src/utils/stock-parser.ts`:

```typescript
// Add your pattern
const patterns = [
  /(\d+)\s*un(?:idade)?s?/i,      // "45 un"
  /(\d+)\s*itens?/i,                // "45 items"
  /stock\D+(\d+)/i,                 // "Stock: 45"
  /(\d+)/,                          // Fallback: first number
];
```

---

## Next Steps

### 1. Run in Production

```bash
npm run verify  # Checks build + health + tests
npm run build
npm start
```

### 2. Add More Products

**From CSV**:
```csv
sku,internal_id
001234,ID-001
001235,ID-002
```

```bash
npm run cli -- --csv products.csv
```

**From JSON**:
```bash
npm run cli -- --json products.json
```

### 3. Schedule Regular Scrapes

Use a cron job or job scheduler:

```bash
# Every day at 9 AM
0 9 * * * cd /path/to/scraper && npm run cli -- --csv daily-products.csv

# Every hour
0 * * * * cd /path/to/scraper && npm run cli -- --sku 123456
```

### 4. Monitor & Alert

Check logs in Supabase dashboard or export them:

```bash
# View last 100 extractions
SELECT * FROM products 
WHERE extracted_at > NOW() - INTERVAL '1 day'
ORDER BY extracted_at DESC
LIMIT 100;
```

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│  CLI Interface (cli.ts)             │
│  - Parse arguments                  │
│  - Load products from CSV/JSON      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Browser Manager (browser.ts)       │
│  - Launch Playwright                │
│  - Handle authentication            │
│  - Manage page navigation           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Product Scraper (product-scraper.ts)
│  - Extract data from page           │
│  - Apply fallback selectors         │
│  - Normalize data                   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Validation (types/product.ts)      │
│  - Validate with Zod schema         │
│  - Handle errors                    │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Database (persistence/*.ts)        │
│  - Persist to Supabase/PostgreSQL   │
│  - Log results                      │
└─────────────────────────────────────┘
```

---

## File Structure Explained

```
src/
├── cli.ts                    ← Start here - main entry point
├── config/
│   └── selectors.ts          ← CUSTOMIZE for your site
├── core/
│   ├── product-scraper.ts    ← Extraction logic
│   └── browser.ts            ← Browser automation
├── utils/
│   ├── price-parser.ts       ← Parse prices
│   ├── stock-parser.ts       ← Parse stock quantities
│   └── logger.ts             ← Logging
├── types/
│   └── product.ts            ← Define your data structure
└── persistence/
    └── supabase-repository.ts ← Save to database
```

**Key file to customize**: `src/config/selectors.ts`

---

## Need Help?

1. **Check existing issues**: [GitHub Issues](https://github.com/yourusername/b2b-product-scraper/issues)
2. **Read the main README**: Full documentation with examples
3. **Inspect your target site**: Use DevTools (F12) to understand the HTML structure
4. **Test with `--verbose` flag**:
   ```bash
   npm run cli -- --sku 123456 --verbose
   ```

---

**Ready?** Start with:
```bash
npm run cli -- --sku 123456
```

If it works, congratulations! 🎉 Now customize for your site and scale up!
