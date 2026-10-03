/**
 * Utility to clean and normalize scanned or typed barcodes.
 * Removes prefixes like "ISBN:", whitespace, hyphens, and non-barcode characters.
 */
export const cleanBarcode = (code?: string | null): string => {
  if (!code) return '';
  return code
    .toString()
    .trim()
    .replace(/^ISBN:?\s*/i, '') // Remove "ISBN:" or "ISBN " prefix if present
    .replace(/[\s\-]/g, '');    // Remove spaces and hyphens
};
