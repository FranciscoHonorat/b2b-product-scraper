/**
 * Universal Price Parser
 * 
 * Handles multiple currency formats:
 * - Brazilian Real: "R$ 1.234,56" or "1.234,56"
 * - USD: "$1,234.56" or "1,234.56"
 * - Euros: "€1.234,56"
 * - Raw decimals: "1234.56" or "1234,56"
 */

/**
 * Parse price from string in multiple formats
 * 
 * Examples:
 * - "R$ 1.234,56" → 1234.56
 * - "$1,234.56" → 1234.56
 * - "1.234,56" → 1234.56
 * - "1,234.56" → 1234.56
 * - "R$ 42,50  Conjunto" → 42.50
 * - "   " → null
 * 
 * @param text Raw price string (can be in various formats)
 * @returns Parsed number or null if invalid (never NaN)
 */
export function parsePrice(text: string | null | undefined): number | null {
  try {
    // Handle empty/null input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return null;
    }

    // Remove currency symbols and trim
    let clean = text
      .replace(/[R$€£¥₹₽]/g, '') // Remove currency symbols
      .replace(/^\s+/, '')         // Trim start
      .replace(/\s+$/, '');        // Trim end

    if (clean.length === 0) {
      return null;
    }

    // Remove non-numeric characters except . and ,
    // But also remove text after number (e.g., "42,50 each")
    const numberMatch = clean.match(/[\d.,]+/);
    if (!numberMatch) {
      return null;
    }

    clean = numberMatch[0];

    // Detect decimal separator
    // Logic: if both . and , exist, the one that appears last is decimal
    // If only one exists, use heuristics
    const hasComma = clean.includes(',');
    const hasDot = clean.includes('.');

    let normalized: string;

    if (hasComma && hasDot) {
      // Both exist: "1.234,56" (BRL) or "1,234.56" (USD)
      // The one appearing last is the decimal separator
      const lastCommaIdx = clean.lastIndexOf(',');
      const lastDotIdx = clean.lastIndexOf('.');

      if (lastCommaIdx > lastDotIdx) {
        // "1.234,56" - BRL format
        // Remove dots (thousands), keep comma (decimal)
        normalized = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // "1,234.56" - USD format
        // Remove commas (thousands), keep dots (decimal)
        normalized = clean.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      // Only comma: could be "1234,56" (BRL) or "1,234" (incomplete USD)
      // If comma is in last 3 positions, it's likely decimal
      const commaPos = clean.lastIndexOf(',');
      const digitsAfterComma = clean.length - commaPos - 1;

      if (digitsAfterComma <= 2) {
        // "1234,56" - comma is decimal
        normalized = clean.replace(',', '.');
      } else {
        // "1,234" - unlikely decimal, treat as thousands sep (USD-like)
        normalized = clean.replace(',', '');
      }
    } else if (!hasComma && hasDot) {
      // Only dot: "1234.56" or "1.234"
      const dotPos = clean.lastIndexOf('.');
      const digitsAfterDot = clean.length - dotPos - 1;

      if (digitsAfterDot === 2 || digitsAfterDot === 3) {
        // Likely decimal: "1234.56" or thousands: "1.234"
        // If exactly 2 digits after dot → decimal
        // If exactly 3 digits after dot → thousands separator
        normalized = digitsAfterDot === 2 ? clean : clean.replace(/\./g, '');
      } else {
        // "1.2" → decimal
        normalized = clean;
      }
    } else {
      // No separators: "1234" or "123.456.789"
      normalized = clean;
    }

    // Final validation
    const num = parseFloat(normalized);
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }

    return num;
  } catch {
    return null;
  }
}

/**
 * Format number as currency string
 * 
 * @param num Number to format
 * @param currency ISO currency code ('BRL', 'USD', etc.)
 * @returns Formatted string (e.g., "R$ 1.234,56")
 */
export function formatPrice(num: number, currency: 'BRL' | 'USD' | 'EUR' = 'BRL'): string {
  if (!isFinite(num)) {
    return '';
  }

  const formats: Record<string, (n: number) => string> = {
    BRL: (n) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    USD: (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    EUR: (n) => `€${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };

  return formats[currency]?.(num) || num.toString();
}

/**
 * Check if string contains a price
 */
export function isLikelyPrice(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const pricePatterns = [
    /\d+[,\.]\d{2}/, // "123.45" or "123,45"
    /[R$€£¥₹₽]\s*\d/, // Currency symbol followed by number
    /^\s*\d+\s*$/, // Just a number
  ];

  return pricePatterns.some((pattern) => pattern.test(text));
}
