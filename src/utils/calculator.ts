import { Product, PlatformFees, CampaignConfig, ProductCalculation, PlatformType, DetailedFeeBreakdown } from '../types';

export function productValue(p: Product): number {
  return (Number(p.stock) || 0) * (Number(p.cost) || 0);
}

export function saleKey(platform: PlatformType, sku: string): string {
  return `${platform}:${sku}`;
}

export function getFixedFee(p: Product, fees: PlatformFees): number {
  const groups = fees.groupFixed || {};
  if (p.category && Object.prototype.hasOwnProperty.call(groups, p.category)) {
    return Number(groups[p.category]) || 0;
  }
  return Number(fees.fixed) || 0;
}

export function getCategoryPercent(p: Product, fees: PlatformFees): number {
  // 1. Ưu tiên % phí riêng được người dùng nhập trực tiếp cho sản phẩm
  if (typeof p.categoryPercent === 'number' && p.categoryPercent > 0) {
    return p.categoryPercent;
  }

  // 2. Nhận diện thông minh theo tên sản phẩm dựa trên Biểu phí Shopee mới 23/05/2026:
  const nameLower = (p.name || '').toLowerCase();
  
  // Bếp từ, bếp điện, bếp hồng ngoại, bếp nướng, bếp ga -> 11.0% (STT 168)
  if (
    nameLower.includes('bếp') ||
    nameLower.includes('bếp từ') ||
    nameLower.includes('bếp điện') ||
    nameLower.includes('bếp hồng ngoại') ||
    nameLower.includes('bếp nướng') ||
    nameLower.includes('bếp ga')
  ) {
    return 11.0;
  }

  // Nồi chiên, lò vi sóng, lò nướng, nồi áp suất, nồi cơm, máy xay sinh tố, máy ép -> 11.0% (STT 149-165)
  if (
    nameLower.includes('nồi chiên') ||
    nameLower.includes('lò vi sóng') ||
    nameLower.includes('lò nướng') ||
    nameLower.includes('nồi áp suất') ||
    nameLower.includes('nồi cơm') ||
    nameLower.includes('máy xay sinh tố') ||
    nameLower.includes('máy xay thực phẩm') ||
    nameLower.includes('máy ép')
  ) {
    return 11.0;
  }

  // Máy nước nóng, máy tắm nóng, cây nước nóng, tủ lạnh, tủ đông -> 9.0%
  if (
    nameLower.includes('máy nước nóng') ||
    nameLower.includes('máy tắm nóng') ||
    nameLower.includes('cây nước nóng') ||
    nameLower.includes('tủ lạnh') ||
    nameLower.includes('tủ đông')
  ) {
    return 9.0;
  }

  // Máy giặt & máy sấy -> 8.5%
  if (nameLower.includes('máy giặt') || nameLower.includes('máy sấy')) {
    return 8.5;
  }

  // Thiết bị làm mát, quạt làm mát -> 10.5%
  if (nameLower.includes('quạt') || nameLower.includes('làm mát')) {
    return 10.5;
  }

  // Ấm đun siêu tốc, bình siêu tốc -> 13.0%
  if (nameLower.includes('ấm siêu tốc') || nameLower.includes('ấm đun') || nameLower.includes('bình siêu tốc')) {
    return 13.0;
  }

  // Máy hút bụi -> 10.0%
  if (nameLower.includes('máy hút bụi') || nameLower.includes('hút bụi')) {
    return 10.0;
  }

  // Loa & âm thanh -> 12.0%
  if (nameLower.includes('loa') || nameLower.includes('karaoke') || nameLower.includes('micro')) {
    return 12.0;
  }

  // 3. Tra cứu theo bảng danh mục ngành hàng đã cấu hình
  const catMap = fees.categoryPercent || {};
  if (p.category && Object.prototype.hasOwnProperty.call(catMap, p.category)) {
    return Number(catMap[p.category]) || 0;
  }

  // 4. Mặc định fallback hoa hồng sàn chung
  return Number(fees.commission) || 0;
}

export function getSalePrice(
  p: Product,
  platform: PlatformType,
  discountRate: number,
  saleOverrides: Record<string, number>
): { price: number; isOverridden: boolean } {
  const key = saleKey(platform, p.sku);
  const override = Number(saleOverrides[key]);
  if (Number.isFinite(override) && override > 0) {
    return { price: override, isOverridden: true };
  }
  const calcPrice = Number(p.listPrice || 0) * (1 - (Number(discountRate) || 0) / 100);
  return { price: Math.max(0, Math.round(calcPrice)), isOverridden: false };
}

export function calc(
  p: Product,
  platform: PlatformType,
  fees: PlatformFees,
  campaign: CampaignConfig,
  saleOverrides: Record<string, number>
): ProductCalculation {
  const { price: sale, isOverridden } = getSalePrice(
    p,
    platform,
    campaign.discountRate,
    saleOverrides
  );

  const voucherRate = (Number(campaign.voucherRate) || 0) / 100;
  const shippingCost = Number(campaign.shippingCost) || 0;

  // 1. Voucher của shop (nếu có trong chiến dịch sale)
  const shopVoucher = Math.round(sale * voucherRate);

  // 2. Căn cứ tính phí Shopee: (Giá bán sản phẩm - Voucher của shop)
  const priceAfterShopVoucher = Math.max(0, sale - shopVoucher);

  // Platform parameters
  const piShip = Number(fees.piShip || 0);
  const infraFee = Number(fees.infra || 0);

  // Giá người mua thực tế thanh toán (sau khi trừ voucher shop và trợ giá PiShip)
  // Cột R trong Excel: giá tiền người mua phải trả = sale - piShip - shopVoucher
  const buyerPrice = Math.max(0, sale - piShip - shopVoucher);

  const paymentRate = Number(fees.payment || 0) / 100;
  let paymentFee = 0;

  const categoryPercentRate = getCategoryPercent(p, fees);
  let categoryFixedFee = 0;
  let voucherExtra = 0;

  if (platform === 'shopee') {
    // 1. Phí xử lý giao dịch Shopee (Cột J trong Excel):
    // Phí 6% áp dụng trên (sale - infraFee - shopVoucher)
    paymentFee = Math.round(Math.max(0, sale - infraFee - shopVoucher) * paymentRate);

    // 2. Voucher Extra Shopee (Cột K trong Excel):
    // 5.5% tính trên giá tiền người mua trả (sale - piShip - shopVoucher), tối đa 50.000 đ
    const vPercent = (Number(fees.voucherExtraPercent) || 5.5) / 100;
    const vMax = fees.voucherExtraMax !== undefined ? Number(fees.voucherExtraMax) : 50000;
    voucherExtra = Math.min(vMax, Math.round(buyerPrice * vPercent));

    // 3. Phí cố định ngành hàng Shopee (Cột N trong Excel):
    // % phí cố định ngành * giá tiền người mua trả (sale - piShip - shopVoucher)
    categoryFixedFee = Math.round(buyerPrice * (categoryPercentRate / 100));
  } else {
    // Lazada:
    paymentFee = Math.round(buyerPrice * paymentRate);
    categoryFixedFee = Math.round(buyerPrice * (categoryPercentRate / 100));
    voucherExtra = Math.min(Number(fees.voucherExtra || 0), sale);
  }

  // Phí hoa hồng KOL / Tiếp thị liên kết (Cột P trong Excel):
  const kolRate = Number(fees.affiliate || 0) / 100;
  const kolFee = Math.round(Math.max(0, sale - shopVoucher) * kolRate);

  // Phí rủi ro & đóng gói (Cột V trong Excel: 5% * Giá sau KM):
  // Lưu ý: Đây là khoản dự phòng rủi ro nội bộ của Shop, không nộp cho sàn Shopee
  const packagingRiskRate = Number(fees.packagingRisk || 0) / 100;
  const packagingRiskFee = Math.round(sale * packagingRiskRate);

  const campaignRate = Number(fees.campaign || 0) / 100;
  const campaignFee = Math.round(sale * campaignRate);

  const appliedFixedFee = getFixedFee(p, fees);
  const otherFee = Number(fees.other || 0);

  const breakdown: DetailedFeeBreakdown = {
    paymentFee,
    categoryFixedFee,
    voucherExtra,
    piShip,
    infraFee,
    kolFee,
    packagingRiskFee,
    otherFee: otherFee + appliedFixedFee + campaignFee,
    shopVoucher,
    shippingCost,
  };

  // Tổng chi phí sàn (Cột Q trong Excel):
  // = Phí xử lý giao dịch + Voucher extra + PiShip + Phí cơ sở hạ tầng + Phí cố định + Phí hoa hồng KOL (+ voucher shop + ship)
  const totalFee =
    paymentFee +
    voucherExtra +
    piShip +
    infraFee +
    categoryFixedFee +
    kolFee +
    appliedFixedFee +
    otherFee +
    campaignFee +
    shopVoucher +
    shippingCost;

  // Tiền thu về từ sàn (Cột S trong Excel):
  // = giá tiền người mua phải trả - Tổng chi phí sàn
  const moneyReceived = Math.max(0, buyerPrice - totalFee);

  // Lợi Nhuận ròng (Cột T trong Excel):
  // = Tiền thu về - Giá vốn nhập
  const cost = Number(p.cost || 0);
  const profit = moneyReceived - cost;

  // Lợi nhuận sau khi trừ phí dự phòng rủi ro đóng gói 5%
  const profitAfterRisk = profit - packagingRiskFee;

  const listPrice = Number(p.listPrice || 0);
  // Tỷ lệ lợi nhuận theo Giá niêm yết (Cột U trong Excel: Lợi nhuận / Giá bán Hiện tại)
  const margin = listPrice > 0 ? (profit / listPrice) * 100 : (sale > 0 ? (profit / sale) * 100 : 0);
  // Tỷ lệ lợi nhuận trên Giá thực bán sau KM
  const marginOnSale = sale > 0 ? (profit / sale) * 100 : 0;

  const targetMargin = Number(campaign.targetMargin) || 0;
  let status: 'good' | 'warn' | 'bad' = 'bad';
  let statusText = 'Đang lỗ';

  if (marginOnSale >= targetMargin || margin >= targetMargin) {
    status = 'good';
    statusText = 'Đạt mục tiêu';
  } else if (profit >= 0) {
    status = 'warn';
    statusText = 'Có lời thấp';
  }

  const discountRate = listPrice > 0
    ? Math.max(0, Math.round(((listPrice - sale) / listPrice) * 1000) / 10)
    : Number(campaign.discountRate) || 0;

  return {
    sale,
    buyerPrice,
    totalFee,
    moneyReceived,
    profit,
    profitAfterRisk,
    margin,
    marginOnSale,
    fixedFee: appliedFixedFee,
    categoryPercentRate,
    discountRate,
    breakdown,
    isOverridden,
    status,
    statusText,
  };
}
