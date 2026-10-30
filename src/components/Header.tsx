import React from 'react';
import { Upload, Sun, Moon, Database, Cloud } from 'lucide-react';

interface HeaderProps {
  onImportClick: () => void;
  onThemeToggle: () => void;
  isDark: boolean;
  onOpenFirebaseModal: () => void;
  isCloudConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onImportClick,
  onThemeToggle,
  isDark,
  onOpenFirebaseModal,
  isCloudConnected,
}) => {
  return (
    <header className="h-[70px] md:h-[76px] bg-[#0b1734] text-white flex items-center justify-between px-4 sm:px-6 lg:px-12 gap-3 border-b border-[#1c2c54] shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 md:h-[42px] md:w-[42px] rounded-xl bg-gradient-to-br from-[#ff9b40] to-[#f05240] grid place-items-center font-black text-xs md:text-sm tracking-tight text-white shadow-[0_5px_14px_rgba(246,120,55,0.35)] shrink-0">
          KDT
        </div>
        <div>
          <strong className="block text-sm md:text-base font-bold tracking-tight text-white leading-tight">
            KDT-89 Pricing Studio
          </strong>
          <span className="block text-[#aab7d5] text-[11px] md:text-xs font-medium">
            Tính giá bán đa sàn
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={onImportClick}
          className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl bg-[#246bfe] hover:bg-[#1a5ce5] text-white font-bold text-xs md:text-sm shadow-[0_8px_16px_rgba(36,107,254,0.2)] transition active:scale-95 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden xs:inline">Nhập Excel</span>
          <span className="xs:hidden">Excel</span>
        </button>

        <button
          type="button"
          onClick={onOpenFirebaseModal}
          title="Kết nối Firebase & Cloud"
          className={`inline-flex items-center gap-1.5 px-2.5 py-2 md:px-3 md:py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
            isCloudConnected
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/15'
          }`}
        >
          {isCloudConnected ? <Cloud className="w-3.5 h-3.5 text-emerald-400" /> : <Database className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isCloudConnected ? 'Cloud đã kết nối' : 'Firebase / Cloud'}</span>
        </button>

        <button
          type="button"
          onClick={onThemeToggle}
          title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          className="p-2 md:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-90 cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
