import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { money, percent } from '../utils/formatters';
import { CurrencyInput } from './CurrencyInput';
import { X, Save, Plus, Package, Layers, Sparkles, Wand2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  existingCategories: string[];
}

const POPULAR_CATEGORIES = [
  { name: 'Bếp & Thiết bị nhà bếp', fee: 11 },
  { name: 'Thiết bị gia dụng lớn & nhỏ', fee: 13 },
  { name: 'Máy tắm nước nóng & Bình nóng lạnh', fee: 9 },
  { name: 'Máy lọc nước & Cây nước', fee: 13 },
  { name: 'Điện máy & Tivi', fee: 7.5 },
  { name: 'Thiết bị chăm sóc sức khỏe', fee: 12 },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  existingCategories,
}) => {
  const isEditing = Boolean(product);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [categoryPercent, setCategoryPercent] = useState<number | ''>('');
  const [cost, setCost] = useState<number | ''>('');
  const [listPrice, setListPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  // Combine existing categories with popular ones
  const allCategoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    existingCategories.forEach((c) => c && set.add(c));
    POPULAR_CATEGORIES.forEach((c) => set.add(c.name));
    return Array.from(set);
  }, [existingCategories]);

  // Suggest fee based on category
  const getSuggestedFee = (catName: string): number => {
    const match = POPULAR_CATEGORIES.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (match) return match.fee;
    if (catName.toLowerCase().includes('bếp')) return 11;
    if (catName.toLowerCase().includes('nóng') || catName.toLowerCase().includes('tắm')) return 9;
    if (catName.toLowerCase().includes('tivi') || catName.toLowerCase().includes('điện máy')) return 7.5;
    return 13; // General household goods
  };

  useEffect(() => {
    if (product) {
      setSku(product.sku || '');
      setName(product.name || '');
      setCategory(product.category || allCategoryOptions[0] || 'Bếp & Thiết bị nhà bếp');
      setCategoryPercent(product.categoryPercent ?? getSuggestedFee(product.category || ''));
      setCost(product.cost ?? 0);
      setListPrice(product.listPrice ?? 0);
      setStock(product.stock ?? 10);
      setWeight(product.weight ?? 1000);
      setCustomCategory('');
    } else {
      const defaultCat = allCategoryOptions[0] || 'Bếp & Thiết bị nhà bếp';
      setSku(`SP-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory(defaultCat);
      setCategoryPercent(getSuggestedFee(defaultCat));
      setCost('');
      setListPrice('');
      setStock(10);
      setWeight(1000);
      setCustomCategory('');
    }
    setError(null);
  }, [product, isOpen, allCategoryOptions]);

  if (!isOpen) return null;

  const resolvedCategory = category === '__custom__' ? customCategory.trim() : category;
  const costNum = Number(cost) || 0;
  const priceNum = Number(listPrice) || 0;
  const stockNum = Number(stock) || 0;
  const totalVal = costNum * stockNum;

  // Live estimated calculations
  const estimatedDiscountedPrice = priceNum > 0 ? Math.round(priceNum * 0.9) : 0; // ~10% discount
  const estimatedCategoryFeeRate = Number(categoryPercent) || getSuggestedFee(resolvedCategory);
  // Estimate ~22% total fee (6% pay + ~11-13% fixed + 5% risk/packaging)
  const estimatedTotalFee = Math.round(estimatedDiscountedPrice * ((6 + estimatedCategoryFeeRate + 5) / 100));
  const estimatedProfit = estimatedDiscountedPrice - estimatedTotalFee - costNum;
  const estimatedMargin = estimatedDiscountedPrice > 0 ? (estimatedProfit / estimatedDiscountedPrice) * 100 : 0;

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val !== '__custom__') {
      setCategoryPercent(getSuggestedFee(val));
    }
  };

  const handleGenerateSku = () => {
    let prefix = 'SP';
    const catLower = resolvedCategory.toLowerCase();
    if (catLower.includes('bếp')) prefix = 'BEP';
    else if (catLower.includes('nóng') || catLower.includes('tắm')) prefix = 'MNN';
    else if (catLower.includes('lọc')) prefix = 'MLN';
    else if (catLower.includes('tivi')) prefix = 'TV';
    else if (catLower.includes('gia dụng')) prefix = 'GD';
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${rand}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setError('Vui lòng nhập Mã SKU của sản phẩm!');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập Tên sản phẩm!');
      return;
    }
    if (!resolvedCategory) {
      setError('Vui lòng chọn hoặc nhập Ngành hàng!');
      return;
    }
    if (costNum < 0) {
      setError('Giá nhập không được âm!');
      return;
    }
    if (priceNum < 0) {
      setError('Giá niêm yết không được âm!');
      return;
    }

    const newProd: Product = {
      sku: sku.trim(),
      name: name.trim(),
      category: resolvedCategory,
      cost: costNum,
      listPrice: priceNum,
      stock: stockNum,
      weight: Number(weight) || 0,
      categoryPercent: categoryPercent !== '' ? Number(categoryPercent) : getSuggestedFee(resolvedCategory),
      platform: product?.platform || 'all',
    };

    onSave(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4e9f2] dark:border-[#2b3b62] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#14213f]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#246bfe] flex items-center justify-center">
              {isEditing ? <Package className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#13213f] dark:text-white">
                {isEditing ? 'Tùy chỉnh thông tin sản phẩm' : 'Thêm sản phẩm mới trực tiếp'}
              </h3>
              <p className="text-xs text-[#71809d] dark:text-[#8ea2c8]">
                {isEditing
                  ? `Mã SKU: ${product?.sku}`
                  : 'Tự thêm sản phẩm lẻ vào kho & chương trình sale mà không cần tải file'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#51617e] dark:text-[#9fb2d4]">
                  Mã SKU <span className="text-red-500">*</span>
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] font-bold text-[#246bfe] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title="Tự động sinh mã SKU ngẫu nhiên"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Tạo mã tự động</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                disabled={isEditing}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ví dụ: BEP-001"
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition font-mono ${
                  isEditing
                    ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-white dark:bg-[#14213f] border-[#e4e9f2] dark:border-[#2b3b62] text-[#13213f] dark:text-white focus:border-[#246bfe]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                Ngành hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe] cursor-pointer"
              >
                {allCategoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ Ngành hàng khác...</option>
              </select>
            </div>
          </div>

          {category === '__custom__' && (
            <div>
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                Nhập tên ngành hàng mới
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ví dụ: Thiết bị thông minh"
                className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bếp Hồng Ngoại Sanaky VH-3100HG"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe]"
            />
          </div>

          {/* Pricing & Stock Grid */}
          <div className="p-4 rounded-xl bg-[#f8fafe] dark:bg-[#14213f] border border-[#e4e9f2] dark:border-[#2b3b62] space-y-3.5">
            <div className="text-xs font-black text-[#246bfe] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Giá cả, % phí ngành & tồn kho</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal normal-case">
                (Định dạng tiền tự thêm dấu chấm)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  Bước 1: Giá vốn / Giá nhập (VNĐ) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={cost}
                  onChange={(val) => setCost(val)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-right outline-none focus:border-[#246bfe]"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block text-right">
                  Tiền mua hàng từ xưởng / NCC
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7559db] dark:text-[#b49eff] mb-1">
                  Bước 2: Giá niêm yết (Gạch giá - VNĐ) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={listPrice}
                  onChange={(val) => setListPrice(val)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-[#162343] text-[#7559db] dark:text-[#b49eff] text-sm font-bold text-right outline-none focus:border-[#7559db]"
                />
                <span className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 block text-right font-medium">
                  Đặt cao để gạch giá giảm sốc
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  % Phí cố định ngành
                </label>
                <div className="inline-flex items-center w-full">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={categoryPercent}
                    onChange={(e) => setCategoryPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="11"
                    className="w-full px-2.5 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-center outline-none focus:border-[#246bfe]"
                  />
                  <span className="ml-1 text-xs font-bold text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block text-center">
                  Shopee: Bếp 11%, Gia dụng 13%
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  Số lượng tồn kho
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10"
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-center outline-none focus:border-[#246bfe]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block text-center">
                  Số lượng cái/chiếc
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  Khối lượng (gram)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1000"
                  className="w-full px-2.5 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-center outline-none focus:border-[#246bfe]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block text-center">
                  Trọng lượng đóng gói
                </span>
              </div>
            </div>

            {/* Live Profit Preview Box */}
            {costNum > 0 && priceNum > 0 && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-950/30 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ước tính kết quả khi tham gia sale (~giảm 10%):</span>
                  </span>
                  <span className="text-slate-500 font-semibold">
                    Thực bán: <strong>{money(estimatedDiscountedPrice)}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-slate-600 dark:text-slate-300">
                    Lãi ròng dự kiến: <strong className={estimatedProfit < 0 ? 'text-red-500' : 'text-[#0d9b73] dark:text-emerald-400 font-extrabold'}>{money(estimatedProfit)}</strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Biên LN: <strong className={estimatedMargin < 0 ? 'text-red-500' : 'text-emerald-600 font-bold'}>{percent(estimatedMargin)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#e4e9f2] dark:border-[#2b3b62] flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Tổng giá trị tồn kho: <strong className="text-[#0d9b73] dark:text-emerald-400 font-bold">{money(totalVal)}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#246bfe] hover:bg-[#195de6] text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
