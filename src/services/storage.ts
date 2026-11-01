import { Product, FeesConfig, PlatformType, CampaignConfig, SavedCampaign } from '../types';

export const DEMO_PRODUCTS: Product[] = [
  { sku: 'AW-10KD-1', name: 'Máy lạnh Airwell 1HP Inverter', category: 'Máy lạnh', cost: 4850000, listPrice: 6490000, stock: 12, weight: 32000 },
  { sku: '18JFM(H)VN', name: 'Nồi cơm điện Toshiba RC-18JFM(H)VN', category: 'Gia dụng', cost: 320000, listPrice: 430000, stock: 11, weight: 4500 },
  { sku: 'BEP4200BN', name: 'Bếp điện từ Ferroli IC4200BN', category: 'Gia dụng', cost: 1820000, listPrice: 2550000, stock: 42, weight: 7800 },
  { sku: 'EDI1004', name: 'Bàn ủi Electrolux EDI1004', category: 'Gia dụng', cost: 83000, listPrice: 130000, stock: 17, weight: 1200 },
  { sku: 'GDBEPHA1186', name: 'Bếp nướng điện LADOMAX HA-1186', category: 'Gia dụng', cost: 340000, listPrice: 500000, stock: 6, weight: 3500 },
  { sku: 'GDHA889', name: 'Ấm đun siêu tốc LADOMAX HA-889', category: 'Gia dụng', cost: 142000, listPrice: 210000, stock: 6, weight: 1800 }
];

import { SHOPEE_PRODUCTS } from '../data/shopeeData';
import { TMDT_PRODUCTS } from '../data/tmdtData';
export { SHOPEE_PRODUCTS, TMDT_PRODUCTS };

export const DEFAULT_FEES: FeesConfig = {
  shopee: {
    commission: 0,
    payment: 6,           // Phí xử lý giao dịch (6%)
    affiliate: 5,         // % hoa hồng KOL (5%)
    campaign: 0,
    packagingRisk: 5,     // Phí rủi ro, đóng gói (5%)
    fixed: 0,
    other: 0,
    infra: 3000,          // Phí cơ sở hạ tầng (3.000 đ)
    piShip: 2700,         // PiShip / Freeship trợ giá (2.700 đ)
    voucherExtra: 50000,  // Mức trần Voucher Extra (50.000 đ)
    voucherExtraPercent: 5.5, // 5.5% * (Giá bán - Voucher shop)
    voucherExtraMax: 50000,   // Tối đa 50.000 đ
    groupFixed: {},
    categoryPercent: {
      'Tivi & Màn hình': 7.5,
      'Tivi': 7.5,
      'TV': 7.5,
      'Màn hình': 2.0,
      'Laptop': 2.0,
      'Điện thoại': 2.0,
      'Máy tính bảng': 2.0,
      'Tủ lạnh': 9.0,
      'Tủ đông': 9.0,
      'Máy giặt': 8.5,
      'Máy giặt & Máy sấy': 8.5,
      'Máy rửa bát đĩa': 8.0,
      'Máy Lạnh': 9.5,
      'Máy lạnh & Điều hòa': 9.5,
      'Quạt làm mát': 10.5,
      'Quạt': 10.5,
      'Thiết bị làm mát': 10.5,
      'Máy lọc nước': 9.5,
      'Máy lọc nước & Cây nước': 9.5,
      'Máy tắm nóng': 9.0,
      'Máy nước nóng': 9.0,
      'Cây nước nóng': 9.0,
      'Nồi cơm điện': 11.0,
      'Nồi chiên không dầu': 11.0,
      'Lò vi sóng': 11.0,
      'Lò nướng': 11.0,
      'Nồi áp suất': 11.0,
      'Máy ép, Xay sinh tố': 11.0,
      'Máy xay sinh tố': 11.0,
      'Ấm đun siêu tốc': 13.0,
      'Ấm siêu tốc': 13.0,
      'Máy hút bụi': 10.0,
      'Thiết bị hút bụi': 10.0,
      'Bàn là & Bàn ủi': 10.0,
      'Gia dụng': 13.0,
      'GD': 13.0,
      'Loa': 12.0,
      'Loa & Karaoke': 15.5,
      'Âm thanh & Loa': 12.0,
      'Micro thu âm': 12.0,
      'Mic': 12.0,
      'Điện máy gia dụng': 9.0,
    }
  },
  lazada: {
    commission: 5,        // Hoa hồng Lazada tiêu chuẩn (5%)
    payment: 4,           // Phí xử lý đơn hàng / thanh toán (4%)
    affiliate: 3,         // Tiếp thị liên kết Lazada (3%)
    campaign: 6,          // Freeship Max / Voucher Max (6%)
    packagingRisk: 5,     // Phí rủi ro, đóng gói (5%)
    fixed: 0,
    other: 0,
    infra: 0,             // Không có phí cơ sở hạ tầng
    piShip: 0,
    voucherExtra: 0,
    groupFixed: {},
    categoryPercent: {
      'Tivi & Màn hình': 3.8,
      'TV': 3.8,
      'Tủ lạnh': 3.8,
      'Máy giặt': 5.5,
      'Máy Lạnh': 6.0,
      'Máy lạnh & Điều hòa': 6.0,
      'Quạt làm mát': 6.0,
      'Quạt': 6.0,
      'Máy lọc nước & Cây nước': 6.0,
      'Máy nước nóng': 6.0,
      'Cây nước nóng': 6.0,
      'Nồi cơm điện': 7.0,
      'Gia dụng': 8.0,
      'Loa & Karaoke': 9.0,
      'Âm thanh & Loa': 9.0,
      'Micro & Âm thanh': 9.0,
      'Điện máy gia dụng': 6.0,
    }
  }
};

export const DEFAULT_CAMPAIGN: CampaignConfig = {
  name: 'Sale ngày đôi 11.11',
  platform: 'shopee',
  discountRate: 10,
  voucherRate: 0,
  shippingCost: 0,
  targetMargin: 10,
  campaignQuantity: 0
};

export const Storage = {
  getProducts(): Product[] {
    try {
      const val = localStorage.getItem('kdt-products');
      const list: Product[] = val ? JSON.parse(val) : TMDT_PRODUCTS;
      // Auto-heal any stale cached items in browser localStorage
      let modified = false;
      const cleaned = list.map((p) => {
        const nameLower = (p.name || '').toLowerCase();
        const isWaterPurifier =
          nameLower.includes('lọc nước') ||
          nameLower.includes('lọc nước') ||
          nameLower.includes('cây nước') ||
          nameLower.includes('cay nuoc') ||
          nameLower.includes('nước nóng lạnh') ||
          nameLower.includes('rwf-w');
        if (
          isWaterPurifier &&
          (p.category === 'Máy nước nóng' ||
            p.category === 'Điện máy gia dụng' ||
            p.category === 'Cây nước nóng' ||
            p.category === 'Gia dụng')
        ) {
          modified = true;
          return { ...p, category: 'Máy lọc nước & Cây nước' };
        }
        return p;
      });
      if (modified) {
        localStorage.setItem('kdt-products', JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return TMDT_PRODUCTS;
    }
  },
  saveProducts(products: Product[]) {
    try {
      localStorage.setItem('kdt-products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  },

  getFees(): FeesConfig {
    try {
      const val = localStorage.getItem('kdt-fees');
      if (!val) return DEFAULT_FEES;
      const parsed = JSON.parse(val);
      return {
        shopee: {
          ...DEFAULT_FEES.shopee,
          ...parsed.shopee,
          voucherExtraPercent: parsed.shopee?.voucherExtraPercent ?? DEFAULT_FEES.shopee.voucherExtraPercent ?? 5.5,
          voucherExtraMax: parsed.shopee?.voucherExtraMax ?? DEFAULT_FEES.shopee.voucherExtraMax ?? 50000,
          groupFixed: parsed.shopee?.groupFixed || {},
          categoryPercent: { ...DEFAULT_FEES.shopee.categoryPercent, ...(parsed.shopee?.categoryPercent || {}) }
        },
        lazada: {
          ...DEFAULT_FEES.lazada,
          ...parsed.lazada,
          groupFixed: parsed.lazada?.groupFixed || {},
          categoryPercent: { ...DEFAULT_FEES.lazada.categoryPercent, ...(parsed.lazada?.categoryPercent || {}) }
        }
      };
    } catch {
      return DEFAULT_FEES;
    }
  },
  saveFees(fees: FeesConfig) {
    try {
      localStorage.setItem('kdt-fees', JSON.stringify(fees));
    } catch (e) {
      console.error('Failed to save fees to localStorage', e);
    }
  },

  getOverrides(): Record<string, number> {
    try {
      const val = localStorage.getItem('kdt-sale-overrides');
      return val ? JSON.parse(val) : {};
    } catch {
      return {};
    }
  },
  saveOverrides(overrides: Record<string, number>) {
    try {
      localStorage.setItem('kdt-sale-overrides', JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to save overrides', e);
    }
  },

  getSelected(): string[] {
    try {
      const val = localStorage.getItem('kdt-selected');
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  },
  saveSelected(selected: string[]) {
    try {
      localStorage.setItem('kdt-selected', JSON.stringify(selected));
    } catch (e) {
      console.error('Failed to save selected', e);
    }
  },

  getSource(): string {
    return localStorage.getItem('kdt-source') || 'Bảng tính Sàn TMĐT (155 sản phẩm)';
  },
  saveSource(source: string) {
    localStorage.setItem('kdt-source', source);
  },

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem('kdt-theme') as 'light' | 'dark') || 'light';
  },
  saveTheme(theme: 'light' | 'dark') {
    localStorage.setItem('kdt-theme', theme);
  },

  getSavedCampaign(): SavedCampaign | null {
    try {
      const val = localStorage.getItem('kdt-campaign');
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  saveCampaign(campaign: SavedCampaign) {
    try {
      localStorage.setItem('kdt-campaign', JSON.stringify(campaign));
    } catch (e) {
      console.error('Failed to save campaign', e);
    }
  }
};
