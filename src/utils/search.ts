/**
 * Utility functions for fast, smart, accent-insensitive search in Vietnamese e-commerce.
 * Supports:
 * - Accent/diacritic stripping (e.g. "bep" matches "bếp", "dieu hoa" matches "điều hòa")
 * - Smart compound noun phrase recognition (prevents "máy lạnh" from matching "máy lọc nước nóng lạnh")
 * - E-commerce synonyms (e.g. "máy lạnh" <-> "điều hòa", "máy nước nóng" <-> "máy tắm nóng")
 * - SKU / Model code punctuation stripping (e.g. "vh3100" matches "VH-3100HG", "022" matches "TMDT-022")
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

const SYNONYM_PAIRS: [string, string][] = [
  ['may lanh', 'dieu hoa'],
  ['dieu hoa', 'may lanh'],
  ['may nuoc nong', 'may tam nong'],
  ['may tam nong', 'may nuoc nong'],
  ['lo vi song', 'microwave'],
  ['microwave', 'lo vi song'],
];

/**
 * Matches a query against a product's SKU, Name, and Category.
 */
export function matchProductSearch(p: SearchableItem, query: string): boolean {
  if (!query || !query.trim()) return true;

  const trimmedQuery = query.trim();
  const rawQuery = trimmedQuery.toLowerCase();
  const normalizedQuery = removeVietnameseTones(trimmedQuery);
  const cleanQuery = cleanPunctuation(trimmedQuery);

  const rawText = `${p.sku || ''} ${p.name || ''} ${p.category || ''}`.toLowerCase();
  const normalizedText = removeVietnameseTones(rawText);
  const cleanSku = cleanPunctuation(p.sku || '');
  const cleanAll = cleanPunctuation(rawText);

  // 1. Direct exact or normalized substring match
  if (rawText.includes(rawQuery) || normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // 2. Direct alphanumeric clean match (e.g. "vh3100" matching "VH-3100HG", SKU match)
  if (cleanQuery.length >= 2 && (cleanSku.includes(cleanQuery) || cleanAll.includes(cleanQuery))) {
    return true;
  }

  // 3. Exact query synonym match (when query itself is a known synonym)
  for (const [src, dst] of SYNONYM_PAIRS) {
    if (normalizedQuery === src && normalizedText.includes(dst)) {
      return true;
    }
  }

  // 4. Multi-token match with Vietnamese compound noun protection
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    // Compound phrase guard: if query contains "máy" and "lạnh",
    // do NOT loosely match products that only contain "máy ... nóng lạnh" without actual "máy lạnh" or "điều hòa".
    if (tokens.includes('may') && tokens.includes('lanh')) {
      if (!normalizedText.includes('may lanh') && !normalizedText.includes('dieu hoa')) {
        return false;
      }
    }

    // Water heater guard: if query is "máy nước nóng", do NOT match "máy lọc nước" unless it specifically has "máy nước nóng"
    if (normalizedQuery.includes('may nuoc nong') && normalizedText.includes('loc nuoc') && !normalizedText.includes('may nuoc nong')) {
      return false;
    }

    // Token requirement list with synonym flexibility
    const reqTokens: { term: string; options: string[] }[] = [];
    let i = 0;
    while (i < tokens.length) {
      if (i + 1 < tokens.length && tokens[i] === 'may' && tokens[i + 1] === 'lanh') {
        reqTokens.push({ term: 'may lanh', options: ['may lanh', 'dieu hoa'] });
        i += 2;
      } else if (i + 1 < tokens.length && tokens[i] === 'dieu' && tokens[i + 1] === 'hoa') {
        reqTokens.push({ term: 'dieu hoa', options: ['dieu hoa', 'may lanh'] });
        i += 2;
      } else if (i + 1 < tokens.length && tokens[i] === 'loc' && tokens[i + 1] === 'nuoc') {
        reqTokens.push({ term: 'loc nuoc', options: ['loc nuoc', 'cay nuoc'] });
        i += 2;
      } else {
        reqTokens.push({ term: tokens[i], options: [tokens[i]] });
        i += 1;
      }
    }

    const allMatched = reqTokens.every(({ options }) => {
      return options.some((opt) => {
        const cOpt = cleanPunctuation(opt);
        return (
          normalizedText.includes(opt) ||
          (cOpt.length >= 2 && cleanAll.includes(cOpt))
        );
      });
    });

    if (allMatched) return true;
  }

  return false;
}
