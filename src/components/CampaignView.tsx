import React, { useState, useMemo } from 'react';
import { Product, PlatformType, CampaignConfig, FeesConfig } from '../types';
import { money, number, percent } from '../utils/formatters';
import { calc, saleKey } from '../utils/calculator';
import { exportCampaignToExcel } from '../utils/excel';
import { ProductModal } from './ProductModal';
import { CurrencyInput } from './CurrencyInput';
import { Save, CheckSquare, Sparkles, Download, ArrowRight, RefreshCw, Scale, ArrowUpRight, TrendingUp, Edit2, Filter, Search } from 'lucide-react';
import { ViewType } from './Navigation';

interface CampaignViewProps {
  products: Product[];
  platform: PlatformType;
  onPlatformChange: (p: PlatformType) => void;
  campaign: CampaignConfig;
  onCampaignChange: (updater: (prev: CampaignConfig) => CampaignConfig) => void;
  fees: FeesConfig;
  saleOverrides: Record<string, number>;
  onSaleOverrideChange: (sku: string, price: number | null) => void;
  onResetAllOverrides: () => void;
  selectedSkus: Set<string>;
  onToggleSku: (sku: string) => void;
  onSelectAll: (select: boolean) => void;
  onSelectProfitable: () => void;
  onSelectBatch?: (skus: string[], select: boolean) => void;
  onSaveCampaign: () => void;
  onUpdateProduct?: (product: Product) => void;
  onQuickUpdateField?: (sku: string, field: keyof Product, val: any) => void;
  onNavigate: (view: ViewType) => void;
  onShowToast: (msg: string) => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  products,
  platform,
  onPlatformChange,
  campaign,
  onCampaignChange,
  fees,
  saleOverrides,
  onSaleOverrideChange,
  onResetAllOverrides,
  selectedSkus,
  onToggleSku,
  onSelectAll,
  onSelectProfitable,
  onSelectBatch,
  onSaveCampaign,
  onUpdateProduct,
  onQuickUpdateField,
  onNavigate,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [profitFilter, setProfitFilter] = useState<'all' | 'profitable' | 'loss'>('all');
  const currentFees = fees[platform];

  // Calculate stats for current platform
  const calculatedItems = useMemo(() => {
    return products.map((p) => {
      const calculation = calc(p, platform, currentFees, campaign, saleOverrides);
      const isChecked = selectedSkus.has(p.sku);
      return {
        product: p,
        calc: calculation,
        isChecked,
      };
    });
  }, [products, platform, currentFees, campaign, saleOverrides, selectedSkus]);

  // Dual platform calculation for Comparison Mode
  const comparisonItems = useMemo(() => {
    return products.map((p) => {
      const shopeeCalc = calc(p, 'shopee', fees.shopee, { ...campaign, platform: 'shopee' }, saleOverrides);
      const lazadaCalc = calc(p, 'lazada', fees.lazada, { ...campaign, platform: 'lazada' }, saleOverrides);
      const diff = shopeeCalc.profit - lazadaCalc.profit;
      const isChecked = selectedSkus.has(p.sku);

      let betterPlatform: 'shopee' | 'lazada' | 'equal' = 'equal';
      if (diff > 500) betterPlatform = 'shopee';
      else if (diff < -500) betterPlatform = 'lazada';

      return {
        product: p,
        shopee: shopeeCalc,
        lazada: lazadaCalc,
        diff,
        betterPlatform,
        isChecked,
      };
    });
  }, [products, fees, campaign, saleOverrides, selectedSkus]);

  // Selected products metrics
  const selectedItems = useMemo(() => {
    return calculatedItems.filter((i) => i.isChecked);
  }, [calculatedItems]);

  const totalSelectedCount = selectedItems.length;
  const totalSelectedProfit = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.calc.profit, 0);
  }, [selectedItems]);
  const totalSelectedRevenue = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.calc.sale, 0);
  }, [selectedItems]);
  const overallMargin = totalSelectedRevenue > 0 ? (totalSelectedProfit / totalSelectedRevenue) * 100 : 0;

  // Unique categories with counts
  const categoriesWithCount = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || 'Chưa phân loại';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Filtered items for display
  const filteredCalculatedItems = useMemo(() => {
    return calculatedItems.filter((item) => {
      const p = item.product;
      const cat = p.category || 'Chưa phân loại';
      if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      if (profitFilter === 'profitable' && item.calc.profit < 0) return false;
      if (profitFilter === 'loss' && item.calc.profit >= 0) return false;
      return true;
    });
  }, [calculatedItems, categoryFilter, searchQuery, profitFilter]);

  const filteredComparisonItems = useMemo(() => {
    return comparisonItems.filter((item) => {
      const p = item.product;
      const cat = p.category || 'Chưa phân loại';
      if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        if (!matchName && !matchSku) return false;
      }
      if (profitFilter === 'profitable' && item.shopee.profit < 0 && item.lazada.profit < 0) return false;
      if (profitFilter === 'loss' && (item.shopee.profit >= 0 || item.lazada.profit >= 0)) return false;
      return true;
    });
  }, [comparisonItems, categoryFilter, searchQuery, profitFilter]);

  // Visible SKUs currently shown in active filter
  const visibleSkus = useMemo(() => {
    return filteredCalculatedItems.map((i) => i.product.sku);
  }, [filteredCalculatedItems]);

  const allVisibleSelected =
    visibleSkus.length > 0 && visibleSkus.every((sku) => selectedSkus.has(sku));

  const handleToggleVisible = () => {
    const nextState = !allVisibleSelected;
    if (onSelectBatch) {
      onSelectBatch(visibleSkus, nextState);
    } else {
      visibleSkus.forEach((sku) => {
        if (nextState !== selectedSkus.has(sku)) {
          onToggleSku(sku);
        }
      });
    }
  };

  const handleSelectCurrentCategory = (select: boolean) => {
    if (categoryFilter === 'all') {
      onSelectAll(select);
      return;
    }
    const catSkus = products
      .filter((p) => (p.category || 'Chưa phân loại') === categoryFilter)
      .map((p) => p.sku);
    if (onSelectBatch) {
      onSelectBatch(catSkus, select);
    } else {
      catSkus.forEach((sku) => {
        if (select !== selectedSkus.has(sku)) {
          onToggleSku(sku);
        }
      });
    }
  };

  const allChecked = products.length > 0 && selectedSkus.size === products.length;

  const handleExportCampaign = () => {
    if (products.length === 0) {
      onShowToast('Chưa có sản phẩm nào!');
      return;
    }

    if (viewMode === 'compare') {
      const rows = comparisonItems.map((item) => ({
        'Mã SKU': item.product.sku,
        'Tên sản phẩm': item.product.name,
        'Ngành hàng': item.product.category,
        'Giá vốn (nhập)': item.product.cost,
        'Giá bán Shopee': Math.round(item.shopee.sale),
        'Phí Shopee': Math.round(item.shopee.totalFee),
        'Lãi ròng Shopee': Math.round(item.shopee.profit),
        'Biên LN Shopee': `${item.shopee.margin.toFixed(2)}%`,
        'Giá bán Lazada': Math.round(item.lazada.sale),
        'Phí Lazada': Math.round(item.lazada.totalFee),
        'Lãi ròng Lazada': Math.round(item.lazada.profit),
        'Biên LN Lazada': `${item.lazada.margin.toFixed(2)}%`,
        'Chênh lệch (Shopee - Lazada)': Math.round(item.diff),
        'Sàn có lợi hơn':
          item.betterPlatform === 'shopee'
            ? 'Shopee (+)'
            : item.betterPlatform === 'lazada'
            ? 'Lazada (+)'
            : 'Ngang nhau',
      }));
      exportCampaignToExcel(rows as any, 'KDT89-so-sanh-shopee-lazada.xlsx');
      onShowToast('Đã xuất bảng so sánh 2 sàn Shopee & Lazada ra Excel!');
    } else {
      const rows = calculatedItems.map((item) => ({
        'Mã SKU': item.product.sku,
        'Tên sản phẩm': item.product.name,
        'Ngành hàng': item.product.category,
        'Sàn': platform === 'shopee' ? 'Shopee' : 'Lazada',
        'Giá vốn (nhập)': item.product.cost,
        'Giá bán sau giảm': Math.round(item.calc.sale),
        '% Phí cố định ngành': `${item.calc.categoryPercentRate}%`,
        'Tổng chi phí sàn': Math.round(item.calc.totalFee),
        'Tiền thu về': Math.round(item.calc.moneyReceived),
        'Lợi nhuận ròng': Math.round(item.calc.profit),
        'Biên lợi nhuận': `${item.calc.margin.toFixed(2)}%`,
        'Trạng thái': item.calc.statusText,
      }));
      exportCampaignToExcel(rows as any, `KDT89-${platform}-chien-dich-sale.xlsx`);
      onShowToast(`Đã xuất bảng tính chi phí ${platform === 'shopee' ? 'Shopee' : 'Lazada'} ra file Excel`);
    }
  };

  const groupCount = Object.keys(currentFees.groupFixed || {}).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[#246bfe] dark:text-[#5e95ff] text-xs font-black tracking-widest uppercase">
            CAMPAIGN BUILDER
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13213f] dark:text-white mt-1">
            Chọn sản phẩm cho chương trình sale
          </h1>
          <p className="text-[#71809d] dark:text-[#9bb0d6] text-xs sm:text-sm mt-0.5">
            Mô phỏng trước giá bán, tổng phí sàn, tiền thu về và lãi ròng cho <strong>Shopee</strong> và <strong>Lazada</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCampaign}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#eef3fb] dark:bg-[#1a2b50] hover:bg-[#e4ebf7] dark:hover:bg-[#203666] text-[#284064] dark:text-[#a6c1ee] font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#246bfe]" />
            <span>{viewMode === 'compare' ? 'Xuất so sánh 2 sàn' : 'Xuất file sale'}</span>
          </button>
          <button
            type="button"
            onClick={onSaveCampaign}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#246bfe] hover:bg-[#195de6] text-white font-bold text-xs sm:text-sm shadow-[0_8px_16px_rgba(36,107,254,0.2)] transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu chương trình</span>
          </button>
        </div>
      </div>

      {/* Prominent Platform & Mode Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#162343] p-3 rounded-2xl border border-[#e4e9f2] dark:border-[#2b3b62] shadow-sm">
        {/* Platform Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase pl-1">
            Sàn tính phí:
          </span>
          <button
            type="button"
            onClick={() => {
              onPlatformChange('shopee');
              setViewMode('single');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              platform === 'shopee' && viewMode === 'single'
                ? 'bg-[#ee4d2d] text-white shadow-md'
                : 'bg-orange-50 dark:bg-orange-950/30 text-[#ee4d2d] hover:bg-orange-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span>Shopee (Phí riêng Shopee)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onPlatformChange('lazada');
              setViewMode('single');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              platform === 'lazada' && viewMode === 'single'
                ? 'bg-[#0f146d] dark:bg-[#343ec2] text-white shadow-md'
                : 'bg-blue-50 dark:bg-blue-950/30 text-[#0f146d] dark:text-[#828cf5] hover:bg-blue-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span>Lazada (Phí riêng Lazada)</span>
          </button>
        </div>

        {/* Compare Toggle */}
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'single' ? 'compare' : 'single'))}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
            viewMode === 'compare'
              ? 'bg-[#7559db] text-white border-transparent shadow-md'
              : 'border-[#7559db]/40 text-[#7559db] dark:text-[#a08bf5] hover:bg-[#7559db]/10'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>{viewMode === 'compare' ? 'Đang so sánh Shopee vs Lazada' : 'So sánh 2 sàn song song'}</span>
        </button>
      </div>

      {/* Campaign Settings & Fee Summary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Settings Panel */}
        <section className="lg:col-span-7 bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(18,41,82,0.06)] space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#13213f] dark:text-white">
                Thông tin chương trình sale
              </h2>
              <p className="text-xs sm:text-sm text-[#71809d] dark:text-[#9bb0d6]">
                Điều chỉnh để xem kết quả tính toán ngay lập tức.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
              Tên chương trình
            </label>
            <input
              type="text"
              value={campaign.name}
              onChange={(e) => onCampaignChange((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
              placeholder="Ví dụ: Siêu Sale Ngày Đôi 11.11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                % Khuyến mãi chung (giảm từ Giá niêm yết)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={campaign.discountRate}
                onChange={(e) =>
                  onCampaignChange((prev) => ({ ...prev, discountRate: Number(e.target.value) || 0 }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
              />
              <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                Giá sau KM = Giá niêm yết × (1 - {campaign.discountRate}%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                Voucher shop (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={campaign.voucherRate}
                onChange={(e) =>
                  onCampaignChange((prev) => ({ ...prev, voucherRate: Number(e.target.value) || 0 }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                Phí ship shop chịu (VNĐ/đơn)
              </label>
              <CurrencyInput
                value={campaign.shippingCost}
                onChange={(val) =>
                  onCampaignChange((prev) => ({ ...prev, shippingCost: val }))
                }
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                Lãi mục tiêu (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={campaign.targetMargin}
                onChange={(e) =>
                  onCampaignChange((prev) => ({ ...prev, targetMargin: Number(e.target.value) || 0 }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
              />
            </div>
          </div>

          {/* Mini Real-Time Summary */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-[#f7f9fd] dark:bg-[#1a2b50] rounded-xl p-3 text-center sm:text-left">
              <span className="text-[11px] font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase block">
                Sản phẩm chọn
              </span>
              <strong className="block text-lg font-black text-[#13213f] dark:text-white mt-0.5">
                {number(totalSelectedCount)}
              </strong>
            </div>

            <div className="bg-[#f7f9fd] dark:bg-[#1a2b50] rounded-xl p-3 text-center sm:text-left">
              <span className="text-[11px] font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase block">
                Lãi dự kiến ({platform === 'shopee' ? 'Shopee' : 'Lazada'})
              </span>
              <strong
                className={`block text-base sm:text-lg font-black mt-0.5 truncate ${
                  totalSelectedProfit < 0 ? 'text-red-500' : 'text-[#0d9b73] dark:text-emerald-400'
                }`}
                title={money(totalSelectedProfit)}
              >
                {money(totalSelectedProfit)}
              </strong>
            </div>

            <div className="bg-[#f7f9fd] dark:bg-[#1a2b50] rounded-xl p-3 text-center sm:text-left">
              <span className="text-[11px] font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase block">
                Biên lợi nhuận
              </span>
              <strong
                className={`block text-lg font-black mt-0.5 ${
                  overallMargin >= campaign.targetMargin
                    ? 'text-[#0d9b73] dark:text-emerald-400'
                    : overallMargin >= 0
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`}
              >
                {percent(overallMargin)}
              </strong>
            </div>
          </div>
        </section>

        {/* Fee Summary Box */}
        <section className="lg:col-span-5 bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(18,41,82,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#13213f] dark:text-white">
                  Bộ phí riêng đang dùng
                </h2>
                <p className="text-xs sm:text-sm text-[#71809d] dark:text-[#9bb0d6]">
                  Áp dụng theo sàn <strong>{platform === 'shopee' ? 'Shopee' : 'Lazada'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('fees')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#246bfe] hover:underline cursor-pointer"
              >
                <span>Chỉnh sửa phí</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              {platform === 'shopee' ? (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí xử lý giao dịch</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.payment}% (người mua trả)</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí cố định ngành hàng</span>
                    <strong className="text-[#ee4d2d] font-bold">% ngành × (Giá - Voucher shop)</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí hoa hồng KOL / Tiếp thị</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.affiliate}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí đóng gói & rủi ro hoàn</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.packagingRisk || 5}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí cơ sở hạ tầng</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{money(currentFees.infra)}/đơn</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">PiShip / Freeship trợ giá</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{money(currentFees.piShip)}/đơn</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí Voucher Xtra Shopee</span>
                    <strong className="text-[#ee4d2d] font-bold">{currentFees.voucherExtraPercent ?? 5.5}% (max {money(currentFees.voucherExtraMax ?? 50000)})</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí thanh toán đơn hàng</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.payment}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí hoa hồng sàn Lazada</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.commission}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Tiếp thị liên kết (Affiliate)</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.affiliate}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Freeship Max / Gói sàn</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.campaign}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#e4e9f2]/60 dark:border-[#2b3b62]/60">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Phí đóng gói & rủi ro hoàn</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{currentFees.packagingRisk || 5}%</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#63718d] dark:text-[#9fb1d2]">Chi phí khác / đơn</span>
                    <strong className="text-[#13213f] dark:text-white font-bold">{money(currentFees.other)}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-[#71809d] dark:text-[#8ea2c8] flex items-center justify-between">
            <span>
              {platform === 'shopee' ? 'Shopee: Phí biến đổi + Phí cố định/đơn' : 'Lazada: Phí theo % doanh thu'}
            </span>
            {Object.keys(saleOverrides).length > 0 && (
              <button
                type="button"
                onClick={onResetAllOverrides}
                className="text-[#7559db] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt lại giá riêng ({Object.keys(saleOverrides).length})</span>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Main Table: Single Platform or Side-by-Side Comparison */}
      <section className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl shadow-[0_12px_32px_rgba(18,41,82,0.06)] overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e4e9f2] dark:border-[#2b3b62]">
          <div>
            <h2 className="text-base font-bold text-[#13213f] dark:text-white flex items-center gap-2">
              <span>{viewMode === 'compare' ? 'Bảng so sánh lợi nhuận Shopee vs Lazada' : `Bảng tính giá & phí sàn ${platform === 'shopee' ? 'Shopee' : 'Lazada'}`}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${platform === 'shopee' ? 'bg-[#ffeedb] text-[#ee4d2d]' : 'bg-[#e2e6fc] text-[#0f146d]'}`}>
                {viewMode === 'compare' ? '2 SÀN' : platform.toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-[#71809d] dark:text-[#9bb0d6] mt-0.5">
              {viewMode === 'compare'
                ? 'So sánh trực quan chi phí và lợi nhuận giữa 2 sàn để chọn sàn bán tối ưu nhất.'
                : 'Anh có thể nhập giá sale riêng cho từng sản phẩm nếu muốn bán mức giá đặc biệt.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onSelectProfitable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chọn sản phẩm có lời</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectAll(!allChecked)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef3fb] dark:bg-[#1a2b50] text-[#284064] dark:text-[#a6c1ee] font-bold text-xs hover:bg-[#e4ebf7] transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
            </button>
          </div>
        </div>

        {/* 4-Step Pricing & Visual Effect Workflow Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs shadow-xs space-y-2">
          <div className="font-extrabold text-[#246bfe] dark:text-[#5e95ff] text-xs sm:text-sm flex items-center gap-1.5">
            <span>💡 Cơ chế 4 bước định giá & tạo hiệu ứng thị giác sàn TMĐT:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-slate-700 dark:text-slate-300">
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#14213f] border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">Bước 1</span>
              <strong className="block text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm">1. Giá nhập (vốn)</strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tiền mua hàng từ NCC / xưởng</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#14213f] border border-purple-200 dark:border-purple-800/60 shadow-2xs">
              <span className="block text-[10px] text-[#7559db] dark:text-[#b49eff] uppercase font-black">Bước 2 (Hiệu ứng)</span>
              <strong className="block text-[#7559db] dark:text-[#b49eff] font-extrabold text-xs sm:text-sm">2. Giá niêm yết (gạch)</strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Đặt cao để gạch giá giảm sốc</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#14213f] border border-amber-200 dark:border-amber-800/60 shadow-2xs">
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase font-black">Bước 3</span>
              <strong className="block text-amber-600 dark:text-amber-400 font-extrabold text-xs sm:text-sm">3. % Khuyến mãi</strong>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">% Giảm từ Giá niêm yết ban đầu</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#14213f] border border-blue-200 dark:border-blue-800/60 shadow-2xs">
              <span className="block text-[10px] text-[#246bfe] dark:text-[#7ba9ff] uppercase font-black">Bước 4 (Thực bán & Lãi)</span>
              <strong className="block text-[#246bfe] dark:text-[#7ba9ff] font-extrabold text-xs sm:text-sm">4. Giá sau khuyến mãi</strong>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Lãi = Giá sau KM - Phí sàn - Giá vốn</p>
            </div>
          </div>
        </div>

        {/* Category Dropdown Filter Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-[#14213f]/80 border-t border-[#e4e9f2] dark:border-[#2b3b62] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* 1. Category Dropdown (Dạng xổ xuống) */}
            <div className="flex items-center gap-2">
              <label htmlFor="category-select" className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#246bfe]" />
                <span>Ngành hàng:</span>
              </label>
              <select
                id="category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#162343] text-xs sm:text-sm font-bold text-[#13213f] dark:text-white outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20 cursor-pointer shadow-xs min-w-[200px]"
              >
                <option value="all">📂 Tất cả ngành hàng ({products.length} sản phẩm)</option>
                {categoriesWithCount.map(({ cat, count }) => (
                  <option key={cat} value={cat}>
                    📁 {cat} ({count} sản phẩm)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Batch Actions when a specific category is selected */}
            {categoryFilter !== 'all' && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => handleSelectCurrentCategory(true)}
                  className="px-3 py-2 rounded-xl bg-[#246bfe] hover:bg-[#1c5ee8] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title={`Chọn toàn bộ sản phẩm trong ngành ${categoryFilter} tham gia chương trình sale`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Chọn cả ngành ({visibleSkus.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCurrentCategory(false)}
                  className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                  title="Bỏ chọn toàn bộ sản phẩm ngành này"
                >
                  Bỏ chọn ngành
                </button>
              </div>
            )}

            {/* 2. Search Box */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm SKU hoặc tên SP..."
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#162343] text-xs sm:text-sm text-[#13213f] dark:text-white outline-none focus:border-[#246bfe] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ×
                </button>
              )}
            </div>

            {/* 3. Profit Status Dropdown */}
            <select
              value={profitFilter}
              onChange={(e) => setProfitFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#162343] text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">⚡ Tất cả trạng thái</option>
              <option value="profitable">🟢 Chỉ sản phẩm có lời (≥ 0 đ)</option>
              <option value="loss">🔴 Chỉ sản phẩm đang lỗ (&lt; 0 đ)</option>
            </select>
          </div>

          {/* Right Side: Product Count & Clear Filter */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#162343] border border-slate-200 dark:border-slate-800 font-medium">
              Hiển thị <strong className="text-[#246bfe] font-extrabold">{filteredCalculatedItems.length}</strong> / {products.length} sản phẩm
            </span>
            {(categoryFilter !== 'all' || searchQuery || profitFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                  setProfitFilter('all');
                }}
                className="text-[#246bfe] hover:underline font-bold cursor-pointer"
              >
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Comparison Mode Table */}
        {viewMode === 'compare' ? (
          <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[460px] relative scrollbar-thin rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62]">
            <table className="w-full min-w-[1240px] text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.06)] bg-[#fbfcfe] dark:bg-[#14213f]">
                <tr className="bg-[#fbfcfe] dark:bg-[#14213f] text-[#71809d] dark:text-[#8ea2c8] uppercase text-[11px] font-bold tracking-wider border-b border-[#e4e9f2] dark:border-[#2b3b62]">
                  <th className="py-3 px-3 w-12 text-center sticky top-0 left-0 z-50 bg-[#fbfcfe] dark:bg-[#14213f]">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleVisible}
                      title={
                        categoryFilter !== 'all'
                          ? `Chọn / bỏ chọn tất cả ${visibleSkus.length} sản phẩm ngành ${categoryFilter}`
                          : allChecked
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'
                      }
                      className="w-4 h-4 rounded text-[#246bfe] accent-[#246bfe] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 min-w-[220px] max-w-[260px] sticky top-0 left-12 z-50 bg-[#fbfcfe] dark:bg-[#14213f] shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                    Sản phẩm
                  </th>
                  <th className="py-3 px-2 text-center w-16 sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Tồn kho</th>
                  <th className="py-3 px-2 text-right w-28 sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">1. Giá vốn</th>
                  <th className="py-3 px-2 text-right w-28 text-[#7559db] dark:text-[#b49eff] sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">2. Giá niêm yết</th>
                  <th className="py-3 px-2 text-right w-28 text-[#246bfe] sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">3. Giá sau KM</th>
                  <th className="py-3 px-3 text-right bg-orange-50/90 dark:bg-orange-950/40 text-[#ee4d2d] sticky top-0">
                    Phí Shopee
                  </th>
                  <th className="py-3 px-3 text-right bg-orange-50/90 dark:bg-orange-950/40 text-[#ee4d2d] sticky top-0">
                    Lãi Shopee
                  </th>
                  <th className="py-3 px-3 text-right bg-blue-50/90 dark:bg-blue-950/40 text-[#0f146d] dark:text-[#9da7ff] sticky top-0">
                    Phí Lazada
                  </th>
                  <th className="py-3 px-3 text-right bg-blue-50/90 dark:bg-blue-950/40 text-[#0f146d] dark:text-[#9da7ff] sticky top-0">
                    Lãi Lazada
                  </th>
                  <th className="py-3 px-3 text-center sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Chênh lệch / Tối ưu</th>
                  <th className="py-3 px-2 text-center w-12 sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e9f2] dark:divide-[#2b3b62]">
                {filteredComparisonItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-[#71809d] dark:text-[#8ea2c8]">
                      Không có sản phẩm nào phù hợp với bộ lọc ngành hàng này.
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('all');
                          setSearchQuery('');
                          setProfitFilter('all');
                        }}
                        className="block mx-auto mt-2 text-[#246bfe] font-bold hover:underline cursor-pointer"
                      >
                        Xóa bộ lọc để xem tất cả
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredComparisonItems.map((item) => {
                  const p = item.product;
                  const shopee = item.shopee;
                  const lazada = item.lazada;
                  const diff = item.diff;

                  return (
                    <tr
                      key={p.sku}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        item.isChecked ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center sticky left-0 z-10 bg-white dark:bg-[#162343]">
                        <input
                          type="checkbox"
                          checked={item.isChecked}
                          onChange={() => onToggleSku(p.sku)}
                          className="w-4 h-4 rounded text-[#246bfe] accent-[#246bfe] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 min-w-[220px] max-w-[260px] sticky left-12 z-10 bg-white dark:bg-[#162343] shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                        <strong className="block text-[#13213f] dark:text-white font-bold line-clamp-2 leading-tight text-xs sm:text-sm" title={p.name}>
                          {p.name}
                        </strong>
                        <small className="block text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-0.5 truncate">
                          {p.sku} · {p.category || 'Chưa phân loại'}
                        </small>
                      </td>

                      {/* Tồn kho */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={p.stock}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            onQuickUpdateField?.(p.sku, 'stock', val);
                          }}
                          className="w-16 px-1.5 py-1 text-center font-bold text-xs rounded-lg border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                          title="Tùy chỉnh số lượng tồn kho"
                        />
                      </td>

                      {/* 1. Giá vốn */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <CurrencyInput
                          value={p.cost}
                          onChange={(val) => onQuickUpdateField?.(p.sku, 'cost', val)}
                          className="w-24 px-1.5 py-1 text-right font-bold text-xs rounded-lg border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                          placeholder="0"
                          title="Tùy chỉnh giá vốn / nhập (định dạng dấu chấm)"
                        />
                      </td>

                      {/* 2. Giá niêm yết (gạch) */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <CurrencyInput
                          value={p.listPrice}
                          onChange={(newLP) => {
                            onQuickUpdateField?.(p.sku, 'listPrice', newLP);
                          }}
                          className="w-24 px-1.5 py-1 text-right font-bold text-xs rounded-lg border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-[#14213f] text-[#7559db] dark:text-[#b49eff] outline-none focus:border-[#7559db]"
                          placeholder="0"
                          title="Giá bán niêm yết ban đầu (đặt cao để gạch giá)"
                        />
                      </td>

                      {/* 3. Giá sau KM */}
                      <td className="py-3 px-2 text-right font-bold text-[#246bfe] whitespace-nowrap">
                        {money(shopee.sale)}
                      </td>

                      {/* Shopee Metrics */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-300 bg-orange-50/30 dark:bg-orange-950/5 whitespace-nowrap">
                        {money(shopee.totalFee)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold bg-orange-50/30 dark:bg-orange-950/5 whitespace-nowrap ${
                          shopee.profit < 0 ? 'text-red-500' : 'text-[#ee4d2d]'
                        }`}
                      >
                        {money(shopee.profit)}
                        <span className="block text-[10px] text-[#93a0b6] font-normal">
                          {percent(shopee.margin)}
                        </span>
                      </td>

                      {/* Lazada Metrics */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-300 bg-blue-50/30 dark:bg-blue-950/5 whitespace-nowrap">
                        {money(lazada.totalFee)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold bg-blue-50/30 dark:bg-blue-950/5 whitespace-nowrap ${
                          lazada.profit < 0 ? 'text-red-500' : 'text-[#0f146d] dark:text-[#9da7ff]'
                        }`}
                      >
                        {money(lazada.profit)}
                        <span className="block text-[10px] text-[#93a0b6] font-normal">
                          {percent(lazada.margin)}
                        </span>
                      </td>

                      {/* Comparison Decision */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.betterPlatform === 'shopee' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-950/50 text-[#ee4d2d]">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Shopee +{money(diff)}</span>
                          </span>
                        ) : item.betterPlatform === 'lazada' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/50 text-[#0f146d] dark:text-[#9da7ff]">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Lazada +{money(Math.abs(diff))}</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600">
                            Ngang nhau
                          </span>
                        )}
                      </td>

                      {/* Edit full product */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(p)}
                          title="Tùy chỉnh thông tin sản phẩm"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#246bfe] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Single Platform Detailed Mode */
          <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[460px] relative scrollbar-thin rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62]">
            <table className="w-full min-w-[1360px] text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.06)] bg-[#fbfcfe] dark:bg-[#14213f]">
                <tr className="bg-[#fbfcfe] dark:bg-[#14213f] text-[#71809d] dark:text-[#8ea2c8] uppercase text-[11px] font-bold tracking-wider border-b border-[#e4e9f2] dark:border-[#2b3b62]">
                  <th className="py-3 px-3 w-12 text-center sticky top-0 left-0 z-50 bg-[#fbfcfe] dark:bg-[#14213f]">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleVisible}
                      title={
                        categoryFilter !== 'all'
                          ? `Chọn / bỏ chọn tất cả ${visibleSkus.length} sản phẩm ngành ${categoryFilter}`
                          : allChecked
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả'
                      }
                      className="w-4 h-4 rounded text-[#246bfe] accent-[#246bfe] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 min-w-[220px] max-w-[260px] sticky top-0 left-12 z-50 bg-[#fbfcfe] dark:bg-[#14213f] shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                    Sản phẩm
                  </th>
                  <th className="py-3 px-2 text-center w-16 sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Tồn kho</th>
                  
                  {/* Step 1: Giá nhập vốn */}
                  <th className="py-3 px-2 text-right w-28 bg-slate-100/90 dark:bg-slate-900/60 border-x border-slate-200/60 dark:border-slate-800 sticky top-0">
                    <span className="block text-[9px] text-slate-500 font-black uppercase">Bước 1</span>
                    <span>Giá nhập (vốn)</span>
                  </th>

                  {/* Step 2: Giá niêm yết ban đầu để tạo hiệu ứng gạch giá */}
                  <th className="py-3 px-2 text-right w-32 bg-purple-50/90 dark:bg-purple-950/50 text-[#7559db] dark:text-[#b49eff] border-r border-purple-100 dark:border-purple-900/40 sticky top-0">
                    <span className="block text-[9px] font-black uppercase">Bước 2 (Hiệu ứng)</span>
                    <span>Giá niêm yết (gạch)</span>
                  </th>

                  {/* Step 3: % Khuyến mãi */}
                  <th className="py-3 px-2 text-center w-24 bg-amber-50/90 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-r border-amber-100 dark:border-amber-900/40 sticky top-0">
                    <span className="block text-[9px] font-black uppercase">Bước 3</span>
                    <span>% Khuyến mãi</span>
                  </th>

                  {/* Step 4: Giá sau khuyến mãi bán ra */}
                  <th className="py-3 px-2 text-right w-32 bg-blue-50/90 dark:bg-blue-950/50 text-[#246bfe] dark:text-[#7ba9ff] border-r border-blue-100 dark:border-blue-900/40 sticky top-0">
                    <span className="block text-[9px] font-black uppercase">Bước 4 (Thực bán)</span>
                    <span>Giá sau KM (đ)</span>
                  </th>

                  <th className="py-3 px-2 text-center w-16 sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">% Ngành</th>
                  <th className="py-3 px-3 text-right sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Tổng phí sàn</th>
                  <th className="py-3 px-3 text-right sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Tiền thu về</th>

                  {/* Lãi ròng (Thu về - Vốn) */}
                  <th className="py-3 px-3 text-right bg-emerald-50/90 dark:bg-emerald-950/40 text-[#0d9b73] dark:text-emerald-400 border-x border-emerald-100 dark:border-emerald-900/40 sticky top-0">
                    <span className="block font-black">Lãi ròng</span>
                    <span className="block text-[9px] font-normal text-slate-500 dark:text-slate-400">(Thu về - Vốn)</span>
                  </th>

                  {/* Cột Dự phòng rủi ro 5% tương ứng cột V trong Excel */}
                  <th className="py-3 px-2 text-right w-24 bg-rose-50/90 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 sticky top-0" title="Khoản dự phòng rủi ro hoàn & đóng gói (5% giá sau KM) trong file Excel">
                    <span className="block text-[9px] font-black uppercase">Dự phòng</span>
                    <span>Rủi ro 5%</span>
                  </th>

                  <th className="py-3 px-2 text-right sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Biên LN</th>
                  <th className="py-3 px-2 text-center sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Trạng thái</th>
                  <th className="py-3 px-2 text-center w-12 sticky top-0 bg-[#fbfcfe] dark:bg-[#14213f]">Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e9f2] dark:divide-[#2b3b62]">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-[#71809d] dark:text-[#8ea2c8]">
                      Hãy nhập danh sách sản phẩm trước để bắt đầu chiến dịch.
                    </td>
                  </tr>
                ) : filteredCalculatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-[#71809d] dark:text-[#8ea2c8]">
                      Không có sản phẩm nào phù hợp với bộ lọc ngành hàng này.
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter('all');
                          setSearchQuery('');
                          setProfitFilter('all');
                        }}
                        className="block mx-auto mt-2 text-[#246bfe] font-bold hover:underline cursor-pointer"
                      >
                        Xóa bộ lọc để xem tất cả
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCalculatedItems.map((item) => {
                    const p = item.product;
                    const c = item.calc;
                    const key = saleKey(platform, p.sku);
                    const isCustomPrice = Object.prototype.hasOwnProperty.call(saleOverrides, key);

                    let statusBadge = (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-[#ffe1e2] text-[#b33a45] dark:bg-red-950/40 dark:text-red-400">
                        Đang lỗ
                      </span>
                    );
                    if (c.status === 'good') {
                      statusBadge = (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-[#dff8ee] text-[#087a5a] dark:bg-emerald-950/40 dark:text-emerald-400">
                          Đạt mục tiêu
                        </span>
                      );
                    } else if (c.status === 'warn') {
                      statusBadge = (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-[#fff0c9] text-[#986000] dark:bg-amber-950/40 dark:text-amber-400">
                          Có lời thấp
                        </span>
                      );
                    }

                    const feeTooltip =
                      platform === 'shopee'
                        ? `Phí xử lý giao dịch 6%: ${money(
                            c.breakdown.paymentFee
                          )} | Voucher Xtra (5.5%, max 50k): ${money(
                            c.breakdown.voucherExtra
                          )} | PiShip trợ giá: ${money(
                            c.breakdown.piShip
                          )} | Phí cơ sở hạ tầng: ${money(
                            c.breakdown.infraFee
                          )} | Phí cố định ngành (${c.categoryPercentRate}%): ${money(
                            c.breakdown.categoryFixedFee
                          )} | Hoa hồng KOL ${currentFees.affiliate}%: ${money(
                            c.breakdown.kolFee
                          )} = Tổng chi phí sàn: ${money(c.totalFee)}`
                        : `Thanh toán: ${money(c.breakdown.paymentFee)} | Hoa hồng sàn: ${money(
                            c.breakdown.categoryFixedFee
                          )} | Affiliate: ${money(c.breakdown.kolFee)} | Freeship Max: ${money(
                            c.breakdown.otherFee
                          )}`;

                    const profitExplanationTooltip = `Giá người mua trả (${money(c.buyerPrice)}) - Tổng phí sàn (${money(c.totalFee)}) = Tiền thu về (${money(c.moneyReceived)}). Tiền thu về - Giá vốn (${money(p.cost)}) = Lãi ròng ${money(c.profit)}. (Dự phòng rủi ro 5%: ${money(c.breakdown.packagingRiskFee)} -> Lãi sau rủi ro: ${money(c.profitAfterRisk)})`;

                    return (
                      <tr
                        key={p.sku}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          item.isChecked ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center sticky left-0 z-10 bg-white dark:bg-[#162343]">
                          <input
                            type="checkbox"
                            checked={item.isChecked}
                            onChange={() => onToggleSku(p.sku)}
                            className="w-4 h-4 rounded text-[#246bfe] accent-[#246bfe] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 min-w-[220px] max-w-[260px] sticky left-12 z-10 bg-white dark:bg-[#162343] shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                          <strong className="block text-[#13213f] dark:text-white font-bold line-clamp-2 leading-tight text-xs sm:text-sm" title={p.name}>
                            {p.name}
                          </strong>
                          <small className="block text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-0.5 truncate">
                            {p.sku} · {p.category || 'Chưa phân loại'}
                          </small>
                        </td>

                        {/* Tồn kho (Editable) */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={p.stock}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              onQuickUpdateField?.(p.sku, 'stock', val);
                            }}
                            title="Tùy chỉnh số lượng tồn kho của sản phẩm"
                            className="w-16 px-1.5 py-1 text-center font-bold text-xs rounded-lg border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                          />
                        </td>

                        {/* [Bước 1] Giá vốn / Giá nhập (Editable) */}
                        <td className="py-3 px-2 text-right whitespace-nowrap bg-slate-50/40 dark:bg-slate-900/20 border-x border-slate-200/50 dark:border-slate-800/60">
                          <CurrencyInput
                            value={p.cost}
                            onChange={(val) => onQuickUpdateField?.(p.sku, 'cost', val)}
                            title="Bước 1: Giá vốn mua hàng thực tế từ NCC/xưởng. Lãi ròng sẽ lấy Giá sau KM trừ đi giá vốn này."
                            className="w-24 px-1.5 py-1 text-right font-bold text-xs rounded-lg border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                            placeholder="0"
                          />
                        </td>

                        {/* [Bước 2] Giá niêm yết ban đầu (Đặt cao để gạch giá tạo hiệu ứng thị giác) */}
                        <td className="py-3 px-2 text-right whitespace-nowrap bg-purple-50/30 dark:bg-purple-950/20 border-r border-purple-100 dark:border-purple-900/40">
                          <CurrencyInput
                            value={p.listPrice}
                            onChange={(newLP) => {
                              onQuickUpdateField?.(p.sku, 'listPrice', newLP);
                              // Tự động cập nhật lại Giá sau khuyến mãi theo % khuyến mãi hiện tại
                              if (newLP > 0) {
                                const currentDiscount = c.discountRate;
                                const newSalePrice = Math.max(0, Math.round(newLP * (1 - currentDiscount / 100)));
                                onSaleOverrideChange(p.sku, newSalePrice);
                              }
                            }}
                            title="Bước 2: Giá niêm yết ban đầu (đặt cao để gạch giá giảm sốc tạo hiệu ứng thị giác)"
                            className="w-26 px-1.5 py-1 text-right font-extrabold text-xs rounded-lg border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-[#14213f] text-[#7559db] dark:text-[#b49eff] outline-none focus:border-[#7559db]"
                            placeholder="0"
                          />
                        </td>

                        {/* [Bước 3] % Khuyến mãi (Giảm từ giá niêm yết) */}
                        <td className="py-3 px-2 text-center whitespace-nowrap bg-amber-50/30 dark:bg-amber-950/20 border-r border-amber-100 dark:border-amber-900/40">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              step="0.5"
                              value={c.discountRate}
                              onChange={(e) => {
                                const disc = Number(e.target.value);
                                if (disc >= 0 && disc < 100 && p.listPrice > 0) {
                                  const newPrice = Math.round(p.listPrice * (1 - disc / 100));
                                  onSaleOverrideChange(p.sku, newPrice);
                                }
                              }}
                              title="Bước 3: % Khuyến mãi giảm giá (tính từ Giá niêm yết bước 2)"
                              className={`w-14 px-1 py-1 text-center font-bold text-xs rounded-lg border outline-none transition ${
                                isCustomPrice
                                  ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30'
                                  : 'border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white focus:border-amber-500'
                              }`}
                            />
                            <span className="text-[11px] font-bold text-slate-400">%</span>
                          </div>
                        </td>

                        {/* [Bước 4] Giá sau khuyến mãi (Giá bán thực tế cho khách) */}
                        <td className="py-3 px-2 text-right whitespace-nowrap bg-blue-50/30 dark:bg-blue-950/20 border-r border-blue-100 dark:border-blue-900/40">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <CurrencyInput
                              value={Math.round(c.sale)}
                              onChange={(val) => {
                                onSaleOverrideChange(p.sku, val > 0 ? val : null);
                              }}
                              className={`w-28 px-2 py-1 text-right font-extrabold text-xs rounded-lg border outline-none transition ${
                                isCustomPrice
                                  ? 'border-[#246bfe] bg-[#f0f6ff] dark:bg-[#192b52] text-[#246bfe] dark:text-[#8cb8ff] ring-1 ring-[#246bfe]/30'
                                  : 'border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white focus:border-[#246bfe]'
                              }`}
                              placeholder="0"
                              title="Bước 4: Giá sau khuyến mãi (khách mua sẽ thanh toán giá này trước voucher shop)"
                            />
                            {isCustomPrice && (
                              <button
                                type="button"
                                onClick={() => onSaleOverrideChange(p.sku, null)}
                                title="Khôi phục giá tính theo % chung của chiến dịch"
                                className="text-xs text-[#246bfe] hover:text-red-500 font-bold px-0.5 cursor-pointer"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        </td>

                        {/* % Phí cố định ngành (Shopee: Bếp 11%, Gia dụng chung 13%, Tắm nóng 9%, Tivi 7.5%, v.v.) */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-0.5">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.1"
                              value={c.categoryPercentRate}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value) || 0);
                                onQuickUpdateField?.(p.sku, 'categoryPercent', val);
                              }}
                              title="Tùy chỉnh % phí cố định ngành hàng cho sản phẩm này (Shopee STT 168 Bếp: 11%, Gia dụng chung: 13%, Máy nước nóng: 9%)"
                              className="w-14 px-1 py-1 text-center font-bold text-xs rounded-lg border border-[#cfd9ea] dark:border-[#33466f] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe] shadow-2xs hover:border-[#246bfe]"
                            />
                            <span className="text-[11px] font-bold text-slate-400">%</span>
                          </div>
                        </td>

                        {/* Tổng phí sàn */}
                        <td className="py-3 px-3 text-right font-medium text-[#71809d] dark:text-[#9bb0d6] whitespace-nowrap">
                          <span className="border-b border-dotted border-slate-400 cursor-help" title={feeTooltip}>
                            {money(c.totalFee)}
                          </span>
                        </td>

                        {/* Tiền thu về */}
                        <td className="py-3 px-3 text-right font-semibold text-[#13213f] dark:text-white whitespace-nowrap">
                          {money(c.moneyReceived)}
                        </td>

                        {/* Lãi ròng = Tiền thu về - Giá vốn (Cột T file Excel) */}
                        <td
                          className={`py-3 px-3 text-right font-black whitespace-nowrap bg-emerald-50/40 dark:bg-emerald-950/20 border-x border-emerald-100/60 dark:border-emerald-900/40 ${
                            c.profit < 0 ? 'text-red-500' : 'text-[#0d9b73] dark:text-emerald-400'
                          }`}
                        >
                          <span className="cursor-help border-b border-dotted border-emerald-400 block text-xs sm:text-sm font-extrabold" title={profitExplanationTooltip}>
                            {money(c.profit)}
                          </span>
                          <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400" title="Lãi ròng sau khi trừ dự phòng rủi ro 5%">
                            Sau rủi ro: {money(c.profitAfterRisk)}
                          </span>
                        </td>

                        {/* Phí rủi ro & đóng gói 5% (Cột V file Excel) */}
                        <td className="py-3 px-2 text-right font-medium text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10 whitespace-nowrap">
                          <span>{money(c.breakdown.packagingRiskFee)}</span>
                        </td>

                        {/* Biên LN (Cột U file Excel) */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <strong className="block text-xs font-extrabold text-slate-800 dark:text-slate-200" title="Tỷ lệ LN trên giá niêm yết (theo cột U file Excel của anh)">
                            {percent(c.margin)}
                          </strong>
                          <span className="block text-[10px] text-slate-400 font-medium" title="Tỷ lệ LN trên giá thực bán sau KM">
                            {percent(c.marginOnSale)} (thực bán)
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          {statusBadge}
                        </td>

                        {/* Nút sửa chi tiết */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            title="Tùy chỉnh thông tin đầy đủ của sản phẩm"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#246bfe] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal for Quick Edit from Campaign screen */}
      <ProductModal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSave={(updated) => {
          onUpdateProduct?.(updated);
          setEditingProduct(null);
        }}
        product={editingProduct}
        existingCategories={Array.from(new Set(products.map((p) => p.category).filter(Boolean)))}
      />
    </div>
  );
};

