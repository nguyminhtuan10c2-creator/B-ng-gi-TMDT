import React from 'react';
import { ViewType } from './Navigation';
import { money, number } from '../utils/formatters';
import { Plus, ArrowRight, ShieldCheck, Sparkles, TrendingUp, Package, Box, Layers } from 'lucide-react';

interface OverviewViewProps {
  productCount: number;
  inventoryValue: number;
  selectedCampaignCount: number;
  expectedProfit: number;
  onNavigate: (view: ViewType) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  productCount,
  inventoryValue,
  selectedCampaignCount,
  expectedProfit,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[#246bfe] dark:text-[#5e95ff] text-xs font-black tracking-widest uppercase">
            KDT-89 PRICING STUDIO
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13213f] dark:text-white mt-1">
            Kiểm soát giá bán và lợi nhuận
          </h1>
          <p className="text-[#71809d] dark:text-[#9bb0d6] text-xs sm:text-sm mt-1 max-w-2xl">
            Nhập dữ liệu sản phẩm, thử chương trình sale và biết ngay giá nào còn lời, phí sàn là bao nhiêu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('campaigns')}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#246bfe] hover:bg-[#195de6] text-white font-bold text-sm shadow-[0_8px_18px_rgba(36,107,254,0.22)] transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo chương trình sale</span>
        </button>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
        {/* Stat 1: Sản phẩm */}
        <article className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-4 sm:p-5 shadow-[0_12px_32px_rgba(18,41,82,0.06)] border-t-4 border-t-[#246bfe] transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[#71809d] dark:text-[#8ea2c8] font-bold text-xs uppercase tracking-wider">
              Sản phẩm
            </span>
            <Package className="w-4 h-4 text-[#246bfe]" />
          </div>
          <strong className="block text-2xl sm:text-3xl font-extrabold text-[#13213f] dark:text-white my-2 tracking-tight">
            {number(productCount)}
          </strong>
          <small className="text-[#93a0b6] dark:text-[#7f94ba] text-xs">đã nạp vào hệ thống</small>
        </article>

        {/* Stat 2: Giá trị tồn kho */}
        <article className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-4 sm:p-5 shadow-[0_12px_32px_rgba(18,41,82,0.06)] border-t-4 border-t-[#0d9b73] transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[#71809d] dark:text-[#8ea2c8] font-bold text-xs uppercase tracking-wider">
              Giá trị tồn kho
            </span>
            <Box className="w-4 h-4 text-[#0d9b73]" />
          </div>
          <strong className="block text-xl sm:text-2xl font-extrabold text-[#0d9b73] my-2 tracking-tight truncate" title={money(inventoryValue)}>
            {money(inventoryValue)}
          </strong>
          <small className="text-[#93a0b6] dark:text-[#7f94ba] text-xs">theo dữ liệu đã nhập</small>
        </article>

        {/* Stat 3: Đang chọn sale */}
        <article className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-4 sm:p-5 shadow-[0_12px_32px_rgba(18,41,82,0.06)] border-t-4 border-t-[#e87b21] transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[#71809d] dark:text-[#8ea2c8] font-bold text-xs uppercase tracking-wider">
              Đang chọn sale
            </span>
            <Layers className="w-4 h-4 text-[#e87b21]" />
          </div>
          <strong className="block text-2xl sm:text-3xl font-extrabold text-[#13213f] dark:text-white my-2 tracking-tight">
            {number(selectedCampaignCount)}
          </strong>
          <small className="text-[#93a0b6] dark:text-[#7f94ba] text-xs">sản phẩm trong chiến dịch</small>
        </article>

        {/* Stat 4: Lãi dự kiến */}
        <article className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-4 sm:p-5 shadow-[0_12px_32px_rgba(18,41,82,0.06)] border-t-4 border-t-[#7559db] transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[#71809d] dark:text-[#8ea2c8] font-bold text-xs uppercase tracking-wider">
              Lãi dự kiến
            </span>
            <TrendingUp className="w-4 h-4 text-[#7559db]" />
          </div>
          <strong
            className={`block text-xl sm:text-2xl font-extrabold my-2 tracking-tight truncate ${
              expectedProfit < 0 ? 'text-red-500' : 'text-[#7559db]'
            }`}
            title={money(expectedProfit)}
          >
            {money(expectedProfit)}
          </strong>
          <small className="text-[#93a0b6] dark:text-[#7f94ba] text-xs">theo bộ phí đang chọn</small>
        </article>
      </div>

      {/* Two Column Layout: Quick Start & Principles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Quick Start Panel */}
        <section className="lg:col-span-7 bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(18,41,82,0.06)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#13213f] dark:text-white">
                Bắt đầu nhanh
              </h2>
              <p className="text-xs sm:text-sm text-[#71809d] dark:text-[#9bb0d6]">
                Thiết lập dữ liệu cho lần tính đầu tiên.
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="w-full flex items-center text-left gap-3.5 p-3.5 rounded-xl bg-[#f7f9fd] dark:bg-[#1a2b50] hover:bg-[#edf3ff] dark:hover:bg-[#203666] border border-[#edf0f6] dark:border-[#293d6b] transition group cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#e5edff] dark:bg-[#253e77] text-[#246bfe] dark:text-[#6fa3ff] flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition">
                1
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white">
                  Nhập file Excel
                </strong>
                <small className="block text-xs text-[#71809d] dark:text-[#8ea2c8] mt-0.5 truncate">
                  Đưa danh sách SKU, giá nhập, tồn kho vào app (hỗ trợ .xlsx, .xls, .csv).
                </small>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9da9bf] group-hover:text-[#246bfe] group-hover:translate-x-1 transition shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('fees')}
              className="w-full flex items-center text-left gap-3.5 p-3.5 rounded-xl bg-[#f7f9fd] dark:bg-[#1a2b50] hover:bg-[#edf3ff] dark:hover:bg-[#203666] border border-[#edf0f6] dark:border-[#293d6b] transition group cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#e5edff] dark:bg-[#253e77] text-[#246bfe] dark:text-[#6fa3ff] flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition">
                2
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white">
                  Kiểm tra biểu phí
                </strong>
                <small className="block text-xs text-[#71809d] dark:text-[#8ea2c8] mt-0.5 truncate">
                  Điều chỉnh phí Shopee và Lazada, phí cố định theo nhóm theo tài khoản shop.
                </small>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9da9bf] group-hover:text-[#246bfe] group-hover:translate-x-1 transition shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('campaigns')}
              className="w-full flex items-center text-left gap-3.5 p-3.5 rounded-xl bg-[#f7f9fd] dark:bg-[#1a2b50] hover:bg-[#edf3ff] dark:hover:bg-[#203666] border border-[#edf0f6] dark:border-[#293d6b] transition group cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#e5edff] dark:bg-[#253e77] text-[#246bfe] dark:text-[#6fa3ff] flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition">
                3
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white">
                  Tạo chương trình sale
                </strong>
                <small className="block text-xs text-[#71809d] dark:text-[#8ea2c8] mt-0.5 truncate">
                  Chọn sản phẩm, chỉnh giá sale riêng và kiểm soát mức lợi nhuận trước khi chạy.
                </small>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9da9bf] group-hover:text-[#246bfe] group-hover:translate-x-1 transition shrink-0" />
            </button>
          </div>
        </section>

        {/* Calculation Principles Panel */}
        <section className="lg:col-span-5 bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(18,41,82,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#13213f] dark:text-white">
                  Nguyên tắc tính
                </h2>
                <p className="text-xs sm:text-sm text-[#71809d] dark:text-[#9bb0d6]">
                  Mọi thông số đều có thể điều chỉnh sát với shop.
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="space-y-3">
              <div className="border border-[#dbe6ff] dark:border-[#2f4270] bg-[#f2f6ff] dark:bg-[#1b2b4f] rounded-xl p-3.5">
                <span className="text-xs font-semibold text-[#71809d] dark:text-[#91a6cf] block">
                  Lãi ròng từng sản phẩm
                </span>
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white mt-1">
                  Giá bán sau giảm − giá nhập − tổng phí
                </strong>
              </div>

              <div className="border border-[#e7ebf2] dark:border-[#2b3b62] bg-[#f7f9fc] dark:bg-[#182645] rounded-xl p-3.5">
                <span className="text-xs font-semibold text-[#71809d] dark:text-[#91a6cf] block">
                  Giá bán tối thiểu hòa vốn / đạt mục tiêu
                </span>
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white mt-1">
                  (Chi phí + Cố định + Ship) ÷ [1 − (% Phí + % Voucher + % Lãi)]
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Các mức phí mẫu chỉ để chạy thử. Anh có thể thay bằng biểu phí thực tế của gian hàng trong mục <strong>Thiết lập phí</strong>.
          </div>
        </section>
      </div>
    </div>
  );
};
