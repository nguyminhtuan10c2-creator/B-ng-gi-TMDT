import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { money } from '../utils/formatters';
import { CurrencyInput } from './CurrencyInput';
import { X, Save, Plus, Package, Layers } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  existingCategories: string[];
}

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
  const [cost, setCost] = useState<number | ''>('');
  const [listPrice, setListPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSku(product.sku || '');
      setName(product.name || '');
      setCategory(product.category || '');
      setCost(product.cost ?? 0);
      setListPrice(product.listPrice ?? 0);
      setStock(product.stock ?? 0);
      setWeight(product.weight ?? 0);
      setCustomCategory('');
    } else {
      setSku('');
      setName('');
      setCategory(existingCategories[0] || 'Gia dụng');
      setCost('');
      setListPrice('');
      setStock(10);
      setWeight(1000);
      setCustomCategory('');
    }
    setError(null);
  }, [product, isOpen, existingCategories]);

  if (!isOpen) return null;

  const resolvedCategory = category === '__custom__' ? customCategory.trim() : category;
  const costNum = Number(cost) || 0;
  const priceNum = Number(listPrice) || 0;
  const stockNum = Number(stock) || 0;
  const totalVal = costNum * stockNum;

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
      platform: product?.platform || 'all',
    };

    onSave(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e4e9f2] dark:border-[#2b3b62] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#14213f]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#246bfe] flex items-center justify-center">
              {isEditing ? <Package className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#13213f] dark:text-white">
                {isEditing ? 'Tùy chỉnh thông tin sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <p className="text-xs text-[#71809d] dark:text-[#8ea2c8]">
                {isEditing ? `Mã SKU: ${product?.sku}` : 'Nhập thông tin sản phẩm để tính phí & lợi nhuận'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
              <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                Mã SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ví dụ: SP-001"
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
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe]"
              >
                {existingCategories.map((c) => (
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
              placeholder="Ví dụ: Nồi cơm điện tử Ladomax 1.8L"
              className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white text-sm outline-none focus:border-[#246bfe]"
            />
          </div>

          {/* Pricing & Stock Grid */}
          <div className="p-3.5 rounded-xl bg-[#f8fafe] dark:bg-[#14213f] border border-[#e4e9f2] dark:border-[#2b3b62] space-y-3">
            <div className="text-xs font-black text-[#246bfe] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Giá cả & Tồn kho thực tế</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  1. Giá nhập (Giá vốn - VNĐ) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={cost}
                  onChange={(val) => setCost(val)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-right outline-none focus:border-[#246bfe]"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block text-right font-medium">
                  Tiền vốn mua hàng
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  2. Giá niêm yết (Giá gạch ban đầu - VNĐ) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={listPrice}
                  onChange={(val) => setListPrice(val)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-[#162343] text-[#7559db] dark:text-[#b49eff] text-sm font-bold text-right outline-none focus:border-[#7559db]"
                />
                <span className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 block text-right font-medium">
                  Đặt cao tạo hiệu ứng giảm giá
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                  Số lượng tồn trong kho
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-center outline-none focus:border-[#246bfe]"
                />
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
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#162343] text-[#13213f] dark:text-white text-sm font-bold text-center outline-none focus:border-[#246bfe]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-[#627393] dark:text-[#8ea4cc]">Tổng giá trị tồn kho:</span>
              <strong className="text-[#0d9b73] dark:text-emerald-400 font-extrabold">{money(totalVal)}</strong>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#e4e9f2] dark:border-[#2b3b62] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 transition"
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
        </form>
      </div>
    </div>
  );
};
