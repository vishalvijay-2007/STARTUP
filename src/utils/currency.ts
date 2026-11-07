/**
 * Central Currency Utility for Indian Rupees (INR ₹)
 * Standardizes currency representation using the 'en-IN' locale
 * Formats according to Indian numbering grouping: ₹1,000, ₹10,000, ₹1,00,000, ₹10,00,000, ₹1,00,00,000
 */

export const formatINR = (
  amount: number | string | null | undefined,
  options?: {
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    compact?: boolean;
  }
): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }

  const numericValue = Number(amount);

  if (options?.compact) {
    const abs = Math.abs(numericValue);
    if (abs >= 10000000) {
      const cr = numericValue / 10000000;
      const formatted = cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, '');
      return `₹${formatted} Cr`;
    }
    if (abs >= 100000) {
      const lakh = numericValue / 100000;
      const formatted = lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2).replace(/\.?0+$/, '');
      return `₹${formatted} L`;
    }
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: 0,
  }).format(numericValue);

  return formatted;
};

/**
 * Formats pure number with Indian grouping commas (e.g. 10,00,000) without currency symbol
 */
export const formatIndianNumber = (
  amount: number | string | null | undefined,
  maximumFractionDigits: number = 0
): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits,
  }).format(Number(amount));
};
