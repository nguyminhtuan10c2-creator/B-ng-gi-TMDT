import React from 'react';
import { LayoutDashboard, Package, Tag, Settings } from 'lucide-react';

export type ViewType = 'overview' | 'products' | 'campaigns' | 'fees';

interface NavigationProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  productCount: number;
  selectedCampaignCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  productCount,
  selectedCampaignCount,
}) => {
  const navItems: { id: ViewType; label: string; shortLabel: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      shortLabel: 'Tổng quan',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'products',
      label: 'Sản phẩm',
      shortLabel: 'Sản phẩm',
      icon: <Package className="w-5 h-5" />,
      badge: productCount,
    },
    {
      id: 'campaigns',
      label: 'Chương trình sale',
      shortLabel: 'Sale',
      icon: <Tag className="w-5 h-5" />,
      badge: selectedCampaignCount > 0 ? selectedCampaignCount : undefined,
    },
    {
      id: 'fees',
      label: 'Thiết lập phí',
      shortLabel: 'Biểu phí',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Navigation */}
      <nav
        aria-label="Điều hướng chính"
        className="hidden md:flex h-[58px] bg-white dark:bg-[#14213f] border-b border-[#e4e9f2] dark:border-[#2b3b62] px-4 sm:px-6 lg:px-12 items-center gap-2 overflow-x-auto transition-colors"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#edf3ff] dark:bg-[#1f305a] text-[#246bfe] dark:text-[#5e95ff]'
                  : 'text-[#6d7b96] dark:text-[#93a3c2] hover:text-[#13213f] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              {item.label}
              {typeof item.badge === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-[#246bfe] text-white'
                      : 'bg-[#eef3fb] dark:bg-[#203157] text-[#637497] dark:text-[#a0b2d6]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation (Mobile-First) */}
      <nav
        aria-label="Điều hướng mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white/95 dark:bg-[#121e3a]/95 backdrop-blur-md border-t border-[#e4e9f2] dark:border-[#2b3b62] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] transition-colors"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer relative ${
                isActive
                  ? 'text-[#246bfe] dark:text-[#5e95ff]'
                  : 'text-[#7e8ca6] dark:text-[#8898b8]'
              }`}
            >
              <div className="relative">
                {item.icon}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#246bfe] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'font-bold' : ''}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
