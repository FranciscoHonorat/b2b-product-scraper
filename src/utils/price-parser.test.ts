import { describe, it, expect } from 'vitest';
import { parsePrice, formatPrice, isLikelyPrice } from '@/utils/price-parser';

describe('Price Parser', () => {
  describe('parsePrice', () => {
    it('should parse Brazilian Real format (1.234,56)', () => {
      expect(parsePrice('R$ 1.234,56')).toBe(1234.56);
      expect(parsePrice('1.234,56')).toBe(1234.56);
    });

    it('should parse USD format (1,234.56)', () => {
      expect(parsePrice('$1,234.56')).toBe(1234.56);
      expect(parsePrice('1,234.56')).toBe(1234.56);
    });

    it('should parse simple decimals', () => {
      expect(parsePrice('42.50')).toBe(42.50);
      expect(parsePrice('42,50')).toBe(42.50);
    });

    it('should handle text after price', () => {
      expect(parsePrice('R$ 42,50  each')).toBe(42.50);
      expect(parsePrice('Price: $19.99 per unit')).toBe(19.99);
    });

    it('should handle whitespace', () => {
      expect(parsePrice('   R$ 199,90   ')).toBe(199.90);
      expect(parsePrice('  1234.56  ')).toBe(1234.56);
    });

    it('should return null for invalid input', () => {
      expect(parsePrice(null)).toBeNull();
      expect(parsePrice(undefined)).toBeNull();
      expect(parsePrice('')).toBeNull();
      expect(parsePrice('   ')).toBeNull();
      expect(parsePrice('abc')).toBeNull();
    });

    it('should handle various currency symbols', () => {
      expect(parsePrice('€1.234,56')).toBe(1234.56);
      expect(parsePrice('£1,234.56')).toBe(1234.56);
      expect(parsePrice('¥12345')).toBe(12345);
    });

    it('should never return NaN', () => {
      const result = parsePrice('invalid@#$');
      expect(result).toBeNull();
      expect(Number.isNaN(result)).toBe(false);
    });
  });

  describe('formatPrice', () => {
    it('should format as BRL', () => {
      expect(formatPrice(1234.56, 'BRL')).toBe('R$ 1.234,56');
      expect(formatPrice(42.50, 'BRL')).toBe('R$ 42,50');
    });

    it('should format as USD', () => {
      expect(formatPrice(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatPrice(42.50, 'USD')).toBe('$42.50');
    });

    it('should format as EUR', () => {
      expect(formatPrice(1234.56, 'EUR')).toContain('1.234,56');
      expect(formatPrice(42.50, 'EUR')).toContain('42,50');
    });

    it('should default to BRL', () => {
      expect(formatPrice(100)).toContain('R$');
    });
  });

  describe('isLikelyPrice', () => {
    it('should detect price-like strings', () => {
      expect(isLikelyPrice('123.45')).toBe(true);
      expect(isLikelyPrice('R$ 199,90')).toBe(true);
      expect(isLikelyPrice('$1,234.56')).toBe(true);
      expect(isLikelyPrice('42')).toBe(true);
    });

    it('should reject non-price strings', () => {
      expect(isLikelyPrice('hello')).toBe(false);
      expect(isLikelyPrice('product name')).toBe(false);
      expect(isLikelyPrice(null)).toBe(false);
      expect(isLikelyPrice('')).toBe(false);
    });
  });

  describe('Round-trip: parse → format → parse', () => {
    it('should preserve value through conversions', () => {
      const original = 1234.56;
      const formatted = formatPrice(original, 'BRL');
      const reparsed = parsePrice(formatted);
      expect(reparsed).toBe(original);
    });
  });
});
