import * as XLSX from 'xlsx';
import { Product } from '../types';
import { productValue } from './calculator';

export function parseMoney(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  let s = String(val || '').trim();
  if (!s || s === '#VALUE!' || s.toLowerCase().includes('bỏ mẫu') || s.toLowerCase().includes('hết')) {
    return 0;
  }
  s = s.replace(/\s|₫|VND|đ/gi, '');
  if ((s.match(/\./g) || []).length > 1) {
    s = s.replace(/\./g, '');
  } else if (/^\d+\.\d{3}$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

export function parseStock(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, Math.round(val));
  const s = String(val || '').trim().toLowerCase();
  if (s === 'hết' || s === 'het' || s.includes('hết hàng') || s.includes('bỏ mẫu')) {
    return 0;
  }
  const n = parseInt(s.replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

export function cleanCategory(cat: string, name: string): string {
  const c = (cat || '').trim();
  const inferred = inferCategory(name);
  if (c === 'GD') {
    return inferred !== 'Điện máy gia dụng' ? inferred : 'Gia dụng';
  }
  if (c === 'NC') return 'Nồi cơm điện';
  if (c === 'Mic') return 'Micro & Âm thanh';
  if (c === 'TV') return 'Tivi & Màn hình';
  if (c.toLowerCase() === 'tủ lạnh') return 'Tủ lạnh';
  if (c.toLowerCase() === 'cây nước nóng' || c.toLowerCase() === 'máy lọc nước') {
    return 'Máy lọc nước & Cây nước';
  }
  // If Excel file misclassified a water purifier as "Máy nước nóng"
  if (c === 'Máy nước nóng' && inferred === 'Máy lọc nước & Cây nước') {
    return 'Máy lọc nước & Cây nước';
  }
  if (c) return c;
  return inferred;
}

export function inferCategory(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('điều hòa') || n.includes('máy lạnh')) return 'Máy lạnh & Điều hòa';
  
  // 1. Water purifiers and water dispensers (check before water heaters to prevent "nước nóng lạnh" false match)
  if (
    n.includes('lọc nước') ||
    n.includes('lọc nước') ||
    n.includes('cây nước') ||
    n.includes('bình để dưới') ||
    n.includes('nước nóng lạnh') ||
    n.includes('chungho') ||
    n.includes('karofi')
  ) {
    return 'Máy lọc nước & Cây nước';
  }

  // 2. Water heaters (shower water heaters)
  if (
    n.includes('máy nước nóng') ||
    n.includes('máy tắm nóng') ||
    n.includes('tắm nóng') ||
    n.includes('bình nóng lạnh') ||
    n.includes('nước nóng trực tiếp') ||
    n.includes('nước nóng gián tiếp') ||
    (n.includes('nước nóng') && !n.includes('lọc nước') && !n.includes('cây nước'))
  ) {
    return 'Máy nước nóng';
  }

  if (
    n.includes('nồi cơm') ||
    n.includes('nồi chiên') ||
    n.includes('nồi áp suất') ||
    n.includes('nồi lẩu') ||
    n.includes('bộ nồi') ||
    n.includes('quánh') ||
    n.includes('nồi hấp')
  ) {
    return 'Nồi & Gia dụng bếp';
  }
  if (n.includes('tivi') || n.includes('ti vi')) return 'Tivi & Màn hình';
  if (n.includes('quạt') || n.includes('quạh')) return 'Quạt làm mát';
  if (n.includes('loa') || n.includes('micro') || n.includes('karaoke')) return 'Âm thanh & Loa';
  if (
    n.includes('bếp từ') ||
    n.includes('bếp điện') ||
    n.includes('bếp ga') ||
    n.includes('bếp gas') ||
    n.includes('bếp hồng ngoại') ||
    n.includes('bếp nướng')
  ) {
    return 'Bếp điện & Gas';
  }
  if (n.includes('lò vi sóng')) return 'Lò vi sóng';
  if (n.includes('hút bụi') || n.includes('robot')) return 'Thiết bị hút bụi';
  if (n.includes('ấm đun') || n.includes('ấm siêu tốc') || n.includes('bình siêu tốc') || n.includes('bình đun')) {
    return 'Ấm siêu tốc';
  }
  if (n.includes('máy giặt')) return 'Máy giặt';
  if (n.includes('tủ lạnh')) return 'Tủ lạnh';
  if (n.includes('xay') || n.includes('đánh trứng')) return 'Máy xay & Pha cà phê';
  if (n.includes('bàn ủi') || n.includes('bàn là')) return 'Bàn ủi';
  if (n.includes('pin sạc') || n.includes('sạc đa năng')) return 'Phụ kiện & Pin sạc';
  return 'Điện máy gia dụng';
}

export function normalizeRow(row: Record<string, unknown>, index = 0): Product {
  const keys = Object.keys(row);
  const find = (names: string[]): unknown => {
    const k = keys.find((x) =>
      names.some((n) =>
        x
          .toLowerCase()
          .replace(/\s|\n|_/g, '')
          .includes(n)
      )
    );
    return k ? row[k] : '';
  };

  // 1. Identify Product Name
  const baseName = String(
    row['Tên Sản phẩm'] ||
    find(['tênsảnphẩm', 'tênvt', 'tênsp', 'tênhàng', 'tên']) ||
    ''
  ).trim().replace(/\r?\n/g, ' ');

  // 2. Identify Variant if present
  const varName = String(row['Tên phân loại'] || find(['tênphânloại']) || '').trim();
  const finalName = varName && baseName && !baseName.includes(varName)
    ? `${baseName} (${varName})`
    : baseName || 'Sản phẩm chưa đặt tên';

  // 3. Identify SKU
  const shopeeSku = String(row['SKU'] || '').trim();
  const shopeeParentSku = String(row['SKU Sản phẩm'] || '').trim();
  const shopeeItemId = String(row['Mã Sản phẩm'] || '').trim();
  const shopeeVarId = String(row['Mã Phân loại'] || '').trim();
  const genericSku = String(find(['sku', 'mãvt', 'mãsp', 'mãhàng', 'mã']) || '').trim();

  // Try extracting model code from name (e.g. RWF-W1917TV(K), IC20R1SV)
  const codeMatch = finalName.match(/([A-Z0-9]{3,}-[A-Z0-9\(\)]+)/i);
  const extractedCode = codeMatch ? codeMatch[1].replace(/[\(\)]/g, '') : '';

  const sku =
    shopeeSku ||
    shopeeParentSku ||
    (shopeeVarId ? `PL-${shopeeVarId}` : '') ||
    genericSku ||
    (shopeeItemId ? `SP-${shopeeItemId}` : '') ||
    extractedCode ||
    `SP-${String(index + 1).padStart(3, '0')}`;

  // 4. Stock
  const stock = parseStock(row['Số lượng'] || find(['sốlượng', 'tồnkho', 'tồn']));

  // 5. Prices
  const rawListVal = row['Giá bán Hiện tại'] || row['Giá'] || find(['giábánhệntại', 'giá', 'giábán', 'giániêmyết', 'giágốc']);
  const listPrice = parseMoney(rawListVal);

  const rawCostVal = row['Giá nhập'] || find(['giánhập', 'giávốn', 'giávốnsảnphẩm']);
  let cost = parseMoney(rawCostVal);

  const rawValue = row['Giá trị'] || row['Giá trị vật tư'] || find(['giátrị', 'giátrịvậttư']);
  const totalValue = parseMoney(rawValue);

  if (!cost && stock > 0 && totalValue > 0) {
    cost = Math.round(totalValue / stock);
  } else if (!cost && listPrice > 0) {
    cost = Math.round(listPrice * 0.75);
  }

  // 6. Category
  const catCandidate = String(row['NHÓM'] || find(['nhóm', 'ngành', 'category', 'loại', 'ngànhhàng']) || '').trim();
  const category = cleanCategory(catCandidate, finalName);

  const weight = Number(find(['khốilượng', 'trọnglượng', 'weight']) || 0);

  return {
    sku,
    name: finalName,
    category,
    cost: cost || 0,
    listPrice: listPrice || (cost ? Math.round(cost * 1.25) : 0),
    stock,
    weight: isNaN(weight) ? 0 : weight,
  };
}

export async function parseExcelOrCsv(file: File): Promise<Product[]> {
  const buffer = await file.arrayBuffer();
  // SheetJS handles CSV (semicolon, comma, quotes, utf8) and XLSX transparently
  const workbook = XLSX.read(buffer, { type: 'array' });
  const allRows: Record<string, unknown>[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });
    if (data.length) {
      allRows.push(...data);
    }
  });

  const products = allRows
    .map((row, idx) => normalizeRow(row, idx))
    .filter((p) => p.name && p.name !== 'Sản phẩm chưa đặt tên' && (p.listPrice > 0 || p.cost > 0));

  if (!products.length) {
    throw new Error('Không tìm thấy dòng dữ liệu sản phẩm trong file');
  }

  return products;
}

export function exportProductsToExcel(products: Product[], filename = 'KDT89-danh-sach-san-pham.xlsx') {
  const rows = products.map((p) => ({
    SKU: p.sku,
    'Tên sản phẩm': p.name,
    'Ngành hàng': p.category,
    'Giá nhập': p.cost,
    'Giá niêm yết': p.listPrice,
    'Tồn kho': p.stock,
    'Giá trị tồn': productValue(p),
    'Khối lượng (g)': p.weight,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sản phẩm');
  XLSX.writeFile(workbook, filename);
}

export function exportCampaignToExcel(
  campaignRows: Array<{
    sku: string;
    name: string;
    category: string;
    cost: number;
    salePrice: number;
    totalFee: number;
    profit: number;
    margin: string;
    status: string;
  }>,
  filename = 'KDT89-bang-tinh-sale.xlsx'
) {
  const worksheet = XLSX.utils.json_to_sheet(campaignRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chiến dịch sale');
  XLSX.writeFile(workbook, filename);
}
