import React, { useState, useMemo, useRef } from 'react';
import { Product } from '../types';
import { money, number } from '../utils/formatters';
import { productValue } from '../utils/calculator';
import { exportProductsToExcel } from '../utils/excel';
import { matchProductSearch } from '../utils/search';
import { ProductModal } from './ProductModal';
import { CurrencyInput } from './CurrencyInput';
import {
  Upload,
  Download,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Package,
  Layers,
  Check,
  ToggleLeft,
  ToggleRight,
  Boxes,
  AlertTriangle,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  sourceName: string;
  onImportFile: (file: File) => void;
  onLoadDemo: () => void;
  onLoadShopee: () => void;
  onLoadTmdt: () => void;
  onUpdateProduct: (product: Product) => void;
  onQuickUpdateField: (sku: string, field: keyof Product, val: any) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (sku: string) => void;
  onShowToast: (msg: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  sourceName,
  onImportFile,
  onLoadDemo,
  onLoadShopee,
  onLoadTmdt,
  onUpdateProduct,
  onQuickUpdateField,
  onAddProduct,
  onDeleteProduct,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-stock'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  }, [products]);

  // Total inventory stats
  const totalStockCount = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + productValue(p), 0);
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => (Number(p.stock) || 0) <= 0).length;
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search.trim() && !matchProductSearch(p, search)) {
        return false;
      }

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchCategory) return false;

      let matchStock = true;
      if (stockFilter === 'in-stock') matchStock = p.stock > 5;
      else if (stockFilter === 'low-stock') matchStock = p.stock > 0 && p.stock <= 5;
      else if (stockFilter === 'out-stock') matchStock = p.stock <= 0;

      return matchStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  // Total matches across all categories when search is active
  const totalMatchesAcrossAllCategories = useMemo(() => {
    if (!search.trim()) return 0;
    return products.filter((p) => matchProductSearch(p, search)).length;
  }, [products, search]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      onShowToast('Chưa có sản phẩm nào để xuất!');
      return;
    }
    exportProductsToExcel(filteredProducts.length > 0 ? filteredProducts : products);
    onShowToast(`Đã xuất ${number(filteredProducts.length || products.length)} sản phẩm ra file Excel`);
  };

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, product: null });
  };

  const handleOpenEdit = (p: Product) => {
    setModalState({ isOpen: true, product: p });
  };

  const handleSaveModal = (savedProd: Product) => {
    if (modalState.product) {
      onUpdateProduct(savedProd);
    } else {
      onAddProduct(savedProd);
    }
  };

  const handleDelete = (p: Product) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.name}" (${p.sku})?`)) {
      onDeleteProduct(p.sku);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[#246bfe] dark:text-[#5e95ff] text-xs font-black tracking-widest uppercase">
            KHO SẢN PHẨM & GIÁ VỐN
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13213f] dark:text-white mt-1">
            Quản lý & Tùy chỉnh sản phẩm
          </h1>
          <p className="text-[#71809d] dark:text-[#9bb0d6] text-xs sm:text-sm mt-0.5">
            Dễ dàng chỉnh sửa giá nhập, giá niêm yết, tồn kho và các thuộc tính sản phẩm.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#246bfe] hover:bg-[#195de6] text-white font-bold text-xs sm:text-sm shadow-[0_6px_16px_rgba(36,107,254,0.25)] transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </button>

          <button
            type="button"
            onClick={onLoadTmdt}
            title="Nạp bảng tính chi phí sàn TMĐT (155 sản phẩm có đầy đủ giá nhập và biểu phí)"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sàn TMĐT (155 SP)</span>
          </button>

          <button
            type="button"
            onClick={onLoadShopee}
            title="Nạp lại 215 sản phẩm từ file Shopee mass update"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#fff2ee] dark:bg-[#341b17] hover:bg-[#ffe3dc] dark:hover:bg-[#45221d] text-[#ee4d2d] dark:text-[#ff7859] border border-[#ffcfc4] dark:border-[#63291d] font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#ee4d2d]"></span>
            <span>Shopee Mass (215 SP)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#eef3fb] dark:bg-[#1a2b50] hover:bg-[#e4ebf7] dark:hover:bg-[#203666] text-[#284064] dark:text-[#a6c1ee] font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#246bfe]" />
            <span>Nhập Excel</span>
          </button>

          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#eef3fb] dark:bg-[#1a2b50] hover:bg-[#e4ebf7] dark:hover:bg-[#203666] text-[#284064] dark:text-[#a6c1ee] font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#7559db]" />
            <span>Mẫu 6 SP</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase">Tổng số lượng tồn</span>
            <strong className="block text-xl font-extrabold text-[#13213f] dark:text-white mt-0.5">
              {number(totalStockCount)} cái
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#246bfe] flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase">Tổng giá trị tồn kho</span>
            <strong className="block text-xl font-extrabold text-[#0d9b73] dark:text-emerald-400 mt-0.5">
              {money(totalInventoryValue)}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0d9b73] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#71809d] dark:text-[#8ea2c8] uppercase">Sản phẩm hết hàng</span>
            <strong className={`block text-xl font-extrabold mt-0.5 ${outOfStockCount > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {number(outOfStockCount)} sản phẩm
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Import Drag & Drop Panel */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white dark:bg-[#162343] border rounded-2xl p-4 sm:p-5 shadow-[0_12px_32px_rgba(18,41,82,0.06)] transition-all ${
          isDragging
            ? 'border-[#246bfe] ring-4 ring-[#246bfe]/15 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-[#e4e9f2] dark:border-[#2b3b62]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eef3fb] dark:bg-[#1e2f55] text-[#246bfe] flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#13213f] dark:text-white">
                Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây để nạp tự động
              </p>
              <p className="text-[11px] sm:text-xs text-[#71809d] dark:text-[#8ea2c8]">
                Nhận diện thông minh: Mã SKU, Tên sản phẩm, Ngành hàng, Giá nhập, Giá niêm yết, Tồn kho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[#246bfe] text-white font-bold text-xs hover:bg-[#195de6] transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            Chọn file từ máy tính
          </button>
        </div>
      </div>

      {/* Search, Filter & Quick-Edit Mode Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#162343] p-3.5 rounded-2xl border border-[#e4e9f2] dark:border-[#2b3b62]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f4f7fc] dark:bg-[#121c35] border border-[#e4e9f2] dark:border-[#243354] rounded-xl flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#71809d] dark:text-[#8ea2c8] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã SKU, tên sản phẩm hoặc ngành hàng..."
            className="w-full text-xs sm:text-sm outline-none bg-transparent text-[#13213f] dark:text-white placeholder-[#8a97ae]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsInlineEditMode(!isInlineEditMode);
              onShowToast(!isInlineEditMode ? 'Đã bật chế độ sửa nhanh: Anh có thể gõ trực tiếp vào ô Giá nhập, Giá niêm yết, Tồn kho!' : 'Đã tắt chế độ sửa nhanh');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
              isInlineEditMode
                ? 'bg-[#246bfe] border-[#246bfe] text-white shadow-[0_4px_12px_rgba(36,107,254,0.3)]'
                : 'bg-[#f4f7fc] dark:bg-[#14213f] border-[#e4e9f2] dark:border-[#2b3b62] text-[#43516e] dark:text-[#a0b3d6] hover:border-[#246bfe]'
            }`}
            title="Cho phép gõ trực tiếp giá nhập, giá niêm yết, tồn kho ngay trong bảng"
          >
            {isInlineEditMode ? (
              <>
                <ToggleRight className="w-4 h-4 text-white" />
                <span>Đang sửa nhanh trực tiếp</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span>Bật sửa nhanh trong bảng</span>
              </>
            )}
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-[#e4e9f2] dark:border-[#2b3b62] rounded-xl px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#14213f] text-[#43516e] dark:text-[#a0b3d6] outline-none cursor-pointer"
          >
            <option value="all">Tất cả ngành ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="border border-[#e4e9f2] dark:border-[#2b3b62] rounded-xl px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#14213f] text-[#43516e] dark:text-[#a0b3d6] outline-none cursor-pointer"
          >
            <option value="all">Tất cả tồn kho</option>
            <option value="in-stock">Còn hàng (&gt;5)</option>
            <option value="low-stock">Sắp hết (1-5)</option>
            <option value="out-stock">Hết hàng (≤0)</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eef3fb] dark:bg-[#1a2b50] hover:bg-[#e4ebf7] dark:hover:bg-[#203666] text-[#284064] dark:text-[#a6c1ee] font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#246bfe]" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Products Table Panel */}
      <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl shadow-[0_12px_32px_rgba(18,41,82,0.06)] overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e4e9f2] dark:border-[#2b3b62]">
          <div>
            <h2 className="text-base font-bold text-[#13213f] dark:text-white flex items-center gap-2">
              <span>Sản phẩm trong kho</span>
              {isInlineEditMode && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 dark:bg-blue-900/50 text-[#246bfe]">
                  Chế độ chỉnh sửa trực tiếp đang BẬT
                </span>
              )}
            </h2>
            <p className="text-xs text-[#71809d] dark:text-[#9bb0d6] mt-0.5">
              Hiển thị {number(filteredProducts.length)} / {number(products.length)} sản phẩm
              {isInlineEditMode && ' — Mọi chỉnh sửa được tự động lưu ngay lập tức'}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f1f4f9] dark:bg-[#203359] text-[#71809d] dark:text-[#9fb5dc] self-start sm:self-auto">
            {sourceName}
          </span>
        </div>

        {/* Helper banner if matches found outside active category */}
        {selectedCategory !== 'all' && filteredProducts.length === 0 && totalMatchesAcrossAllCategories > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <span className="font-bold">⚠️ Không tìm thấy sản phẩm nào trong ngành "{selectedCategory}" khớp với "{search}".</span>
              <span>Nhưng có <strong>{totalMatchesAcrossAllCategories} sản phẩm</strong> phù hợp ở các ngành khác!</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition shrink-0 cursor-pointer"
            >
              Xem tất cả ({totalMatchesAcrossAllCategories} sản phẩm)
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#fbfcfe] dark:bg-[#14213f] text-[#71809d] dark:text-[#8ea2c8] uppercase text-[11px] font-bold tracking-wider border-b border-[#e4e9f2] dark:border-[#2b3b62]">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Ngành hàng</th>
                <th className="py-3 px-4 text-right">
                  Giá nhập (vốn) {isInlineEditMode && <span className="text-[#246bfe] lowercase">(gõ số)</span>}
                </th>
                <th className="py-3 px-4 text-right">
                  Giá niêm yết {isInlineEditMode && <span className="text-[#246bfe] lowercase">(gõ số)</span>}
                </th>
                <th className="py-3 px-4 text-center">
                  Tồn kho {isInlineEditMode && <span className="text-[#246bfe] lowercase">(gõ số)</span>}
                </th>
                <th className="py-3 px-4 text-right">Giá trị tồn</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e9f2] dark:divide-[#2b3b62]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71809d] dark:text-[#8ea2c8]">
                    Chưa có sản phẩm phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const val = productValue(p);
                  let stockPillClass = 'bg-[#dff8ee] text-[#087a5a] dark:bg-emerald-950/40 dark:text-emerald-400';
                  if (p.stock <= 0) {
                    stockPillClass = 'bg-[#ffe1e2] text-[#b33a45] dark:bg-red-950/40 dark:text-red-400';
                  } else if (p.stock <= 5) {
                    stockPillClass = 'bg-[#fff0c9] text-[#986000] dark:bg-amber-950/40 dark:text-amber-400';
                  }

                  return (
                    <tr
                      key={p.sku}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#13213f] dark:text-white whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#13213f] dark:text-white min-w-[220px] max-w-sm">
                        <div className="line-clamp-2 leading-snug" title={p.name}>
                          {p.name}
                        </div>
                        {p.weight > 0 && (
                          <div className="text-[11px] text-[#71809d] dark:text-[#8ea2c8] mt-0.5">
                            {number(p.weight)} g
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#51617e] dark:text-[#a0b3d6]">
                        {p.category || 'Chưa phân loại'}
                      </td>

                      {/* Giá nhập (Cost) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isInlineEditMode ? (
                          <CurrencyInput
                            value={p.cost}
                            onChange={(val) => onQuickUpdateField(p.sku, 'cost', val)}
                            className="w-28 px-2 py-1 text-right text-xs sm:text-sm font-bold rounded-lg border border-[#246bfe]/50 bg-blue-50/30 dark:bg-blue-950/20 text-[#13213f] dark:text-white outline-none focus:ring-2 focus:ring-[#246bfe]/30"
                          />
                        ) : (
                          <span className="font-medium text-[#13213f] dark:text-white">
                            {money(p.cost)}
                          </span>
                        )}
                      </td>

                      {/* Giá niêm yết (List price) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isInlineEditMode ? (
                          <CurrencyInput
                            value={p.listPrice}
                            onChange={(val) => onQuickUpdateField(p.sku, 'listPrice', val)}
                            className="w-28 px-2 py-1 text-right text-xs sm:text-sm font-bold rounded-lg border border-purple-300 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 text-[#7559db] dark:text-[#b49eff] outline-none focus:ring-2 focus:ring-purple-400/30"
                          />
                        ) : (
                          <span className="font-medium text-[#13213f] dark:text-white">
                            {money(p.listPrice)}
                          </span>
                        )}
                      </td>

                      {/* Tồn kho (Stock) */}
                      <td className="py-3 px-4 text-center">
                        {isInlineEditMode ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={p.stock}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              onQuickUpdateField(p.sku, 'stock', val);
                            }}
                            className="w-20 px-2 py-1 text-center text-xs sm:text-sm font-bold rounded-lg border border-[#246bfe]/50 bg-blue-50/30 dark:bg-blue-950/20 text-[#13213f] dark:text-white outline-none focus:ring-2 focus:ring-[#246bfe]/30"
                          />
                        ) : (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${stockPillClass}`}>
                            {number(p.stock)}
                          </span>
                        )}
                      </td>

                      {/* Giá trị tồn */}
                      <td className="py-3.5 px-4 text-right font-bold text-[#0d9b73] dark:text-emerald-400 whitespace-nowrap">
                        {money(val)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Tùy chỉnh đầy đủ thông tin sản phẩm"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#246bfe] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            title="Xóa sản phẩm này"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit product */}
      <ProductModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, product: null })}
        onSave={handleSaveModal}
        product={modalState.product}
        existingCategories={categories.length > 0 ? categories : ['Gia dụng', 'Điện máy', 'Thiết bị']}
      />
    </div>
  );
};
