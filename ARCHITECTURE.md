# Architecture & Design Decisions

## Overview

B2B Product Scraper is built with **clean architecture** principles for maintainability, testability, and extensibility.

```
┌─────────────────────────────────────────────────────┐
│              CLI Interface                          │
│         (Parse arguments, load files)               │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│           Browser Management                        │
│    (Launch, authenticate, navigate pages)           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│         Product Scraper (Adapter)                   │
│   (Coordinate extraction, validation, persistence)  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────────┐
│ Data Extractor │   │ Price/Stock Parser │
│ (Selectors)    │   │ (Normalization)    │
└────────────────┘   └─────────────────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Zod Validation     │
        │  (Type safety)      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  Repository Pattern │
        │  (Persistence)      │
        └─────────────────────┘
```

## Key Design Patterns

### 1. **Adapter Pattern**

The `ProductScraper` class adapts multiple components into a cohesive pipeline:

```typescript
class ProductScraper {
  constructor(
    private extractor: DataExtractor,
    private mapper: ProductMapper,
    private validator: SchemaValidator,
    private repository: ProductRepository
  ) {}

  async extract(sku: string) {
    const raw = await this.extractor.extract(sku);
    const mapped = this.mapper.normalize(raw);
    const validated = this.validator.validate(mapped);
    return await this.repository.persist(validated);
  }
}
```

**Why**: Decouples components, easy to test, supports multiple strategies.

### 2. **Repository Pattern**

All database operations go through a repository:

```typescript
class ProductRepository {
  async persist(product: Product): Promise<PersistenceResult> {
    // Supabase client details hidden
  }

  async findBySku(sku: string): Promise<Product | null> {
    // Query logic here
  }
}
```

**Why**: Database implementation is swappable (PostgreSQL → MongoDB, etc.).

### 3. **Strategy Pattern**

Multiple fallback strategies for data extraction:

```typescript
const strategies = [
  { selector: '.primary-price', name: 'Primary' },
  { selector: '[data-price]', name: 'Secondary' },
  { selector: '.price', name: 'Fallback' }
];

for (const strategy of strategies) {
  const value = await page.$(strategy.selector);
  if (value) return value; // Use first successful strategy
}
```

**Why**: Resilient to website structure changes.

### 4. **Factory Pattern**

Create product instances with validation:

```typescript
class ProductFactory {
  static create(raw: RawProductInput): Product {
    return ProductSchema.parse(raw); // Zod handles validation
  }
}
```

**Why**: Ensures all products are valid before use.

## Dependency Injection

No hard dependencies between modules:

```typescript
// Good: Dependencies injected
const scraper = new ProductScraper(
  new DismatalExtractor(),
  new ProductMapper(),
  new ZodValidator(),
  new SupabaseRepository()
);

// Bad: Hard dependencies
class ProductScraper {
  private extractor = new DismatalExtractor(); // ❌ Tightly coupled
}
```

**Why**: Easy to test, swap implementations, support multiple sites.

## Type Safety

Full end-to-end TypeScript with Zod runtime validation:

```typescript
// At compile time
const product: Product = ...;

// At runtime
ProductSchema.parse(unknownData); // Validates + throws if invalid

// Never at runtime
function getValue(data: any): string {
  return data.name; // ❌ No type checking
}
```

**Why**: Catch errors early, IDE autocompletion, better maintainability.

## Error Handling

Structured error handling with context:

```typescript
try {
  return await page.locator(selector).textContent();
} catch (error) {
  logger.error('Failed to extract', error, {
    selector,
    sku: this.currentSku,
    action: 'extraction',
    duration: Date.now() - startTime
  });
  // Return null, try fallback, or throw based on strategy
}
```

**Why**: Debugging is easier with context, logs are searchable.

## Testing Strategy

### Unit Tests

Test individual functions:

```typescript
describe('parsePrice', () => {
  it('should parse BRL format', () => {
    expect(parsePrice('R$ 1.234,56')).toBe(1234.56);
  });
});
```

### Integration Tests

Test component interactions (optional):

```typescript
describe('ProductScraper', () => {
  it('should extract and persist product', async () => {
    const result = await scraper.extract('123');
    expect(result.success).toBe(true);
  });
});
```

### Manual Testing

Test against real website:

```bash
npm run cli -- --sku 123456
```

**Why**: Different test levels catch different issues.

## Performance Considerations

### Sequential Processing

Products extracted one-by-one to respect rate limits:

```typescript
// Good: Respects server load
for (const sku of skus) {
  await scraper.extract(sku);
  await sleep(100); // Small delay between requests
}

// Bad: Hammers server
await Promise.all(skus.map(sku => scraper.extract(sku)));
```

### Caching

Browser session reused across products:

```typescript
const browser = await playwright.chromium.launch();
const page = await browser.newPage();

// Reuse same page for 10+ products
for (const sku of skus) {
  await page.goto(`${url}/${sku}`);
  await scraper.extract(page, sku);
}

await browser.close(); // Close once done
```

### Database Batching

Persist multiple products in single transaction (future):

```typescript
// Future optimization
await repository.persistBatch(products);
```

## Extensibility Points

### 1. Custom Product Type

```typescript
// Extend base schema
const CustomSchema = ProductSchema.extend({
  myField: z.string()
});
```

### 2. Custom Selector Strategy

```typescript
// Create custom extractor
class MyPortalExtractor extends BaseExtractor {
  protected getSelectors() {
    return MY_CUSTOM_SELECTORS;
  }
}
```

### 3. Custom Persistence

```typescript
// Implement repository interface
class MongoRepository implements ProductRepository {
  async persist(product) { /* ... */ }
}
```

### 4. Custom Logger

```typescript
// Replace logger implementation
class CustomLogger implements Logger {
  info(msg, context) { /* ... */ }
}
```

## Future Architecture Improvements

- **Event-driven**: Emit events at key steps (extracted, validated, persisted)
- **Middleware pattern**: Pipeline processing like Express.js
- **Configuration system**: Load strategies/selectors from JSON/YAML
- **Plugin system**: Third-party selector providers
- **Distributed scraping**: Multi-process/multi-machine coordination

## Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| Zod validation | Type safety | Slight performance overhead |
| Sequential scraping | Respect rate limits | Slower for bulk operations |
| Repository pattern | Database agnostic | Extra abstraction layer |
| Fallback strategies | More robust | Requires more selectors |

## Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Design Patterns](https://refactoring.guru/design-patterns)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/)
- [Zod Documentation](https://zod.dev/)
