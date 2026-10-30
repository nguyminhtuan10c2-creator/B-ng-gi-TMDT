export interface Product {
  sku: string;
  name: string;
  category: string;
  cost: number;
  listPrice: number;
  stock: number;
  weight: number;
  categoryPercent?: number; // % Phí cố định ngành hàng riêng cho sản phẩm (ví dụ 11%)
  platform?: 'shopee' | 'lazada' | 'all';
}

export interface DetailedFeeBreakdown {
  paymentFee: number;
  categoryFixedFee: number;
  voucherExtra: number;
  piShip: number;
  infraFee: number;
  kolFee: number;
  packagingRiskFee: number;
  otherFee: number;
  shopVoucher: number;
  shippingCost: number;
}

export interface PlatformFees {
  commission: number;        // Phí hoa hồng sàn chung (%)
  payment: number;           // Phí xử lý giao dịch / thanh toán (%) (Shopee: 6%, Lazada: 4%)
  affiliate: number;         // Phí tiếp thị KOL / Affiliate (%) (Mặc định 5%)
  campaign: number;          // Phí gói chương trình (%)
  packagingRisk: number;     // Phí rủi ro, đóng gói (%) (Mặc định 5%)
  fixed: number;             // Phí cố định mặc định/đơn (VNĐ)
  other: number;             // Chi phí khác mặc định/đơn (VNĐ)
  infra: number;             // Phí cơ sở hạ tầng (Shopee: 3.000 đ, Lazada: 0 đ)
  piShip: number;            // Phí PiShip / Freeship trợ giá / đơn (2.700 đ)
  voucherExtra: number;      // Voucher Extra sàn / đơn (mức trần mặc định 50.000 đ)
  voucherExtraPercent?: number; // % Phí Voucher Xtra (Shopee: 5.5%)
  voucherExtraMax?: number;     // Mức trần tối đa Voucher Xtra (Shopee: 50.000 đ)
  groupFixed: Record<string, number>; // Phí cố định riêng theo nhóm (VNĐ)
  categoryPercent: Record<string, number>; // % Phí cố định theo từng ngành hàng (Shopee: 3.8% - 16.7%)
}

export interface FeesConfig {
  shopee: PlatformFees;
  lazada: PlatformFees;
}

export type PlatformType = 'shopee' | 'lazada';

export interface CampaignConfig {
  name: string;
  platform: PlatformType;
  discountRate: number;   // Giảm giá (%) so với niêm yết
  voucherRate: number;    // Voucher shop (%) trên giá sale
  shippingCost: number;   // Phí ship shop chịu (VNĐ)
  targetMargin: number;   // Lãi mục tiêu (%)
  campaignQuantity: number; // Số lượng tối đa (0 = không giới hạn)
}

export interface SavedCampaign {
  name: string;
  platform: PlatformType;
  discount: number;
  selected: string[];
  updatedAt?: string;
}

export interface ProductCalculation {
  sale: number;
  buyerPrice: number;
  totalFee: number;
  moneyReceived: number;
  profit: number;
  profitAfterRisk: number;   // Lợi nhuận sau khi trừ phí rủi ro đóng gói 5%
  margin: number;            // Tỷ lệ LN trên giá niêm yết (theo chuẩn file Excel của anh, ví dụ 6.55%)
  marginOnSale: number;      // Tỷ lệ LN trên giá thực bán (sau KM)
  fixedFee: number;
  categoryPercentRate: number;
  discountRate: number;      // % giảm giá thực tế so với giá niêm yết
  breakdown: DetailedFeeBreakdown;
  isOverridden: boolean;
  status: 'good' | 'warn' | 'bad';
  statusText: string;
}
