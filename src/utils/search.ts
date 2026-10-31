/**
 * Utility functions for fast, smart, accent-insensitive search in Vietnamese
 */

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function cleanPunctuation(str: string): string {
  return removeVietnameseTones(str).replace(/[^a-z0-9]/g, '');
}

export interface SearchableItem {
  sku: string;
  name: string;
  category?: string;
  [key: string]: any;
}

/**
 * Matches a query against a product's SKU, Name, and Category.
 * Supports:
 * 1. Diacritic/accent insensitivity ("bep" matches "Bếp")
 * 2. Multi-word/token matching ("bếp sanaky 3100" matches "Bếp Hồng Ngoại Sanaky VH-3100HG")
 * 3. Punctuation insensitivity ("vh3100" matches "VH-3100HG", "tmdt022" matches "TMDT-022")
 * 4. Case-insensitivity
 */
export function matchProductSearch(p: SearchableItem, query: string): boolean {
  if (!query || !query.trim()) return true;

  const trimmedQuery = query.trim();
  const rawQuery = trimmedQuery.toLowerCase();
  const normalizedQuery = removeVietnameseTones(trimmedQuery);
  const cleanQuery = cleanPunctuation(trimmedQuery);

  const rawText = `${p.sku} ${p.name} ${p.category || ''}`.toLowerCase();
  const normalizedText = removeVietnameseTones(`${p.sku} ${p.name} ${p.category || ''}`);
  const cleanSku = cleanPunctuation(p.sku);
  const cleanName = cleanPunctuation(p.name);
  const cleanCategory = cleanPunctuation(p.category || '');
  const cleanAll = `${cleanSku} ${cleanName} ${cleanCategory}`;

  // 1. Exact raw or normalized substring
  if (rawText.includes(rawQuery) || normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // 2. Direct alphanumeric clean match (e.g. "vh3100" matching "VH-3100HG")
  if (cleanQuery.length >= 2 && (cleanSku.includes(cleanQuery) || cleanAll.includes(cleanQuery))) {
    return true;
  }

  // 3. Multi-token match: every word in query must be found in target
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((token) => {
      const cleanToken = token.replace(/[^a-z0-9]/g, '');
      return (
        normalizedText.includes(token) ||
        (cleanToken.length >= 2 && cleanAll.includes(cleanToken))
      );
    });
    if (allTokensMatch) return true;
  }

  return false;
}
