import React, { useState, useMemo } from 'react';
import { FeesConfig, PlatformType, Product } from '../types';
import { money } from '../utils/formatters';
import { Save, Plus, Trash2, HelpCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface FeesViewProps {
  fees: FeesConfig;
  platform: PlatformType;
  onPlatformChange: (p: PlatformType) => void;
  onSaveFees: (newFees: FeesConfig) => void;
  products: Product[];
  onShowToast: (msg: string) => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  fees,
  platform,
  onPlatformChange,
  onSaveFees,
  products,
  onShowToast,
}) => {
  const [localFees, setLocalFees] = useState<FeesConfig>(fees);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPercent, setNewCatPercent] = useState<number | ''>('');

  React.useEffect(() => {
    setLocalFees(fees);
  }, [fees]);

  const currentPlatformFees = localFees[platform];

  // Distinct categories from products
  const availableCategories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    const defined = Object.keys(currentPlatformFees.categoryPercent || {});
    return Array.from(new Set([...list, ...defined])).sort();
  }, [products, currentPlatformFees.categoryPercent]);

  const handleFieldChange = (
    field: keyof typeof currentPlatformFees,
    val: number
  ) => {
    setLocalFees((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: val,
      },
    }));
  };

  const handleCategoryPercentChange = (cat: string, percent: number) => {
    setLocalFees((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        categoryPercent: {
          ...(prev[platform].categoryPercent || {}),
          [cat]: percent,
        },
      },
    }));
  };

  const handleAddCategoryRate = () => {
    const cat = newCatName.trim();
    const rate = Number(newCatPercent);
    if (!cat) {
      onShowToast('Vui lòng nhập tên ngành hàng!');
      return;
    }
    if (isNaN(rate) || rate < 0) {
      onShowToast('Vui lòng nhập % phí cố định hợp lệ!');
      return;
    }

    setLocalFees((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        categoryPercent: {
          ...(prev[platform].categoryPercent || {}),
          [cat]: rate,
        },
      },
    }));

    setNewCatName('');
    setNewCatPercent('');
    onShowToast(`Đã lưu % phí cố định cho ngành hàng: ${cat}`);
  };

  const handleRemoveCategoryRate = (cat: string) => {
    setLocalFees((prev) => {
      const copy = { ...(prev[platform].categoryPercent || {}) };
      delete copy[cat];
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          categoryPercent: copy,
        },
      };
    });
    onShowToast(`Đã xóa mức phí của ngành hàng ${cat}`);
  };

  const handleSave = () => {
    onSaveFees(localFees);
    onShowToast(`Đã lưu thiết lập biểu phí ${platform === 'shopee' ? 'Shopee' : 'Lazada'}`);
  };

  const categoryEntries = Object.entries(currentPlatformFees.categoryPercent || {}).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[#246bfe] dark:text-[#5e95ff] text-xs font-black tracking-widest uppercase">
            FEE SETTINGS
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13213f] dark:text-white mt-1">
            Thiết lập phí theo từng sàn
          </h1>
          <p className="text-[#71809d] dark:text-[#9bb0d6] text-xs sm:text-sm mt-0.5">
            Phân định rõ ràng cơ cấu biểu phí riêng biệt cho <strong>Shopee</strong> và <strong>Lazada</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#246bfe] hover:bg-[#195ce6] text-white font-bold text-xs sm:text-sm shadow-[0_8px_16px_rgba(36,107,254,0.2)] transition active:scale-95 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Lưu thiết lập</span>
        </button>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="flex items-center gap-1.5 bg-[#e9eef8] dark:bg-[#1a2b50] p-1 rounded-xl w-max">
        <button
          type="button"
          onClick={() => onPlatformChange('shopee')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
            platform === 'shopee'
              ? 'bg-[#ee4d2d] text-white shadow-md'
              : 'text-[#6b7891] dark:text-[#8ea3c9] hover:text-[#13213f]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Sàn Shopee</span>
        </button>
        <button
          type="button"
          onClick={() => onPlatformChange('lazada')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
            platform === 'lazada'
              ? 'bg-[#0f146d] dark:bg-[#343ec2] text-white shadow-md'
              : 'text-[#6b7891] dark:text-[#8ea3c9] hover:text-[#13213f]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Sàn Lazada</span>
        </button>
      </div>

      {/* Main Fee Panel */}
      <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(18,41,82,0.06)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span
              className={`inline-block text-white text-xs font-black px-2.5 py-1 rounded-lg mb-1 ${
                platform === 'shopee' ? 'bg-[#ee4d2d]' : 'bg-[#0f146d] dark:bg-[#343ec2]'
              }`}
            >
              {platform === 'shopee' ? 'Biểu phí Shopee Shop' : 'Biểu phí Lazada Shop'}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#13213f] dark:text-white">
              Phí dịch vụ, thanh toán & chi phí vận hành
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-3 py-2 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Áp dụng tự động vào bảng tính lãi ròng từng sản phẩm của {platform === 'shopee' ? 'Shopee' : 'Lazada'}.</span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
              Phí xử lý giao dịch / Thanh toán (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={currentPlatformFees.payment}
              onChange={(e) => handleFieldChange('payment', Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
            />
            <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
              Shopee thông thường là 6%, Lazada là 4%
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
              % Hoa hồng KOL / Tiếp thị liên kết (Affiliate %)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={currentPlatformFees.affiliate}
              onChange={(e) => handleFieldChange('affiliate', Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
            />
            <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
              Theo file bảng tính là 5% (hoặc theo hợp đồng shop)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
              Phí rủi ro, đóng gói hàng hóa (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={currentPlatformFees.packagingRisk || 0}
              onChange={(e) => handleFieldChange('packagingRisk', Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
            />
            <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
              Chi phí thùng carton, chống sốc, hao hụt (5%)
            </span>
          </div>

          {platform === 'shopee' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  Phí cơ sở hạ tầng (Shopee VNĐ/đơn)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={currentPlatformFees.infra || 0}
                  onChange={(e) => handleFieldChange('infra', Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  Cố định 3.000 ₫ / đơn hàng Shopee
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  PiShip / Phí ship cố định (VNĐ/đơn)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={currentPlatformFees.piShip || 0}
                  onChange={(e) => handleFieldChange('piShip', Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  Theo bảng tính shop là 2.700 ₫
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  % Phí Voucher Xtra (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentPlatformFees.voucherExtraPercent ?? 5.5}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    handleFieldChange('voucherExtraPercent', val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  5.5% × (Giá bán - Voucher shop)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  Mức trần Voucher Xtra tối đa / đơn (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={currentPlatformFees.voucherExtraMax ?? currentPlatformFees.voucherExtra ?? 50000}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    handleFieldChange('voucherExtraMax', val);
                    handleFieldChange('voucherExtra', val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  Tối đa 50.000 ₫ / sản phẩm
                </span>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs space-y-1.5 text-orange-950 dark:text-orange-200">
                <div className="font-extrabold flex items-center gap-1.5 text-sm text-[#ee4d2d]">
                  <span>📌 Cơ chế tính phí chuẩn Shopee đang áp dụng:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>Phí Voucher Xtra:</strong> <code className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 font-bold text-[#ee4d2d]">5.5% × (Giá bán - Voucher shop)</code>, tối đa <strong>50.000 ₫</strong></li>
                  <li><strong>Phí cố định ngành hàng:</strong> <code className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 font-bold text-[#ee4d2d]">% Phí cố định ngành × (Giá bán - Voucher shop)</code></li>
                  <li><strong>Phí xử lý giao dịch:</strong> <code className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 font-bold text-[#ee4d2d]">6% × (Giá bán - Voucher shop - PiShip 2.700 ₫)</code></li>
                  <li><strong>Phí cơ sở hạ tầng:</strong> <strong>3.000 ₫</strong> / đơn</li>
                  <li><strong>Tiếp thị liên kết & Đóng gói:</strong> 5% KOL + 5% Rủi ro đóng gói</li>
                </ul>
              </div>
            </>
          )}

          {platform === 'lazada' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  Phí hoa hồng chuẩn Lazada (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentPlatformFees.commission}
                  onChange={(e) => handleFieldChange('commission', Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  Tiêu chuẩn 5% trên sàn Lazada
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  Freeship Max / Gói chương trình (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentPlatformFees.campaign}
                  onChange={(e) => handleFieldChange('campaign', Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  Thường là 6% (tối đa ~30.000 ₫)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1.5">
                  Chi phí khác / đơn (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={currentPlatformFees.other}
                  onChange={(e) => handleFieldChange('other', Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/20"
                />
                <span className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-1 block">
                  Chi phí phụ trợ vận hành đơn Lazada
                </span>
              </div>
            </>
          )}
        </div>

        {/* Category Percent Commission Table */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#246bfe]" />
                <h3 className="text-sm font-bold text-[#13213f] dark:text-white">
                  Bảng % Phí cố định theo từng ngành hàng ({platform === 'shopee' ? 'Shopee' : 'Lazada'})
                </h3>
              </div>
              <p className="text-xs text-[#71809d] dark:text-[#9bb0d6] mt-0.5">
                Đây là bảng % phí sàn khấu trừ theo từng nhóm ngành hàng (ví dụ: Tivi 3.8%, Nồi cơm 11%, Gia dụng 13%, Loa 15.5%...).
              </p>
            </div>
          </div>

          {/* Add Category rate form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50 dark:bg-[#14213f] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex-1">
              <input
                list="allCategoriesList"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Chọn hoặc nhập tên ngành hàng (ví dụ: Tủ lạnh, Loa...)"
                className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-xs sm:text-sm outline-none focus:border-[#246bfe]"
              />
              <datalist id="allCategoriesList">
                {availableCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="w-full sm:w-40">
              <input
                type="number"
                min="0"
                step="0.1"
                value={newCatPercent}
                onChange={(e) => setNewCatPercent(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="% Phí (ví dụ: 9.5)"
                className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-xs sm:text-sm outline-none focus:border-[#246bfe]"
              />
            </div>

            <button
              type="button"
              onClick={handleAddCategoryRate}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#246bfe] hover:bg-[#195ce6] text-white font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm / Cập nhật</span>
            </button>
          </div>

          {/* Grid of category rates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {categoryEntries.map(([category, rate]) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-[#fbfcfe] dark:bg-[#14213f] text-xs sm:text-sm"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[#13213f] dark:text-white block truncate" title={category}>
                    {category}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={rate}
                      onChange={(e) => handleCategoryPercentChange(category, Number(e.target.value) || 0)}
                      className="w-12 text-right font-black text-xs text-[#246bfe] dark:text-[#5e95ff] bg-transparent outline-none"
                    />
                    <span className="text-xs font-bold text-[#246bfe] dark:text-[#5e95ff]">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryRate(category)}
                    title="Xóa ngành hàng này"
                    className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(18,41,82,0.06)] space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#246bfe]" />
          <h2 className="text-sm font-bold text-[#13213f] dark:text-white">
            Công thức tính chi phí thực tế theo file sàn TMĐT của anh
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-[#f7f9fd] dark:bg-[#1a2b50] rounded-xl p-3.5 border border-[#edf0f6] dark:border-[#2a3c66]">
            <span className="text-[11px] font-bold uppercase text-[#71809d] dark:text-[#8ea2c8] block">
              Phí biến đổi theo ngành
            </span>
            <strong className="block text-xs sm:text-sm text-[#13213f] dark:text-white mt-1">
              Giá sale × (Phí TT 6% + % Phí cố định ngành + KOL 5% + Rủi ro 5%)
            </strong>
          </div>

          <div className="bg-[#f7f9fd] dark:bg-[#1a2b50] rounded-xl p-3.5 border border-[#edf0f6] dark:border-[#2a3c66]">
            <span className="text-[11px] font-bold uppercase text-[#71809d] dark:text-[#8ea2c8] block">
              Phí cố định theo đơn
            </span>
            <strong className="block text-xs sm:text-sm text-[#13213f] dark:text-white mt-1">
              Voucher Extra 50k + PiShip 2.7k + Phí hạ tầng 3k
            </strong>
          </div>

          <div className="bg-[#f7f9fd] dark:bg-[#1a2b50] rounded-xl p-3.5 border border-[#edf0f6] dark:border-[#2a3c66]">
            <span className="text-[11px] font-bold uppercase text-[#71809d] dark:text-[#8ea2c8] block">
              Tiền thu về & Lợi nhuận
            </span>
            <strong className="block text-xs sm:text-sm text-[#0d9b73] dark:text-emerald-400 mt-1">
              Tiền thu về = Giá sale − Tổng chi phí; Lợi nhuận = Tiền thu về − Giá vốn
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
