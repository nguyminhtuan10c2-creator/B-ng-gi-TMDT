/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, FeesConfig, PlatformType, CampaignConfig } from './types';
import {
  Storage,
  DEMO_PRODUCTS,
  SHOPEE_PRODUCTS,
  TMDT_PRODUCTS,
  DEFAULT_FEES,
  DEFAULT_CAMPAIGN,
} from './services/storage';
import {
  getSavedFirebaseConfig,
  initFirebase,
} from './services/firebaseSync';
import { Header } from './components/Header';
import { Navigation, ViewType } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { ProductsView } from './components/ProductsView';
import { CampaignView } from './components/CampaignView';
import { FeesView } from './components/FeesView';
import { Toast } from './components/Toast';
import { FirebaseModal } from './components/FirebaseModal';
import { parseExcelOrCsv } from './utils/excel';
import { productValue, calc } from './utils/calculator';
import { number } from './utils/formatters';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => Storage.getProducts());
  const [fees, setFees] = useState<FeesConfig>(() => Storage.getFees());
  const [saleOverrides, setSaleOverrides] = useState<Record<string, number>>(() =>
    Storage.getOverrides()
  );
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(() => {
    const list = Storage.getSelected();
    if (list.length > 0) return new Set(list);
    // default select all products
    return new Set(Storage.getProducts().map((p) => p.sku));
  });
  const [sourceName, setSourceName] = useState<string>(() => Storage.getSource());
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => Storage.getTheme());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  const [campaign, setCampaign] = useState<CampaignConfig>(() => {
    const saved = Storage.getSavedCampaign();
    if (saved) {
      return {
        ...DEFAULT_CAMPAIGN,
        name: saved.name || DEFAULT_CAMPAIGN.name,
        platform: saved.platform || DEFAULT_CAMPAIGN.platform,
        discountRate: typeof saved.discount === 'number' ? saved.discount : DEFAULT_CAMPAIGN.discountRate,
      };
    }
    return DEFAULT_CAMPAIGN;
  });

  const hiddenHeaderFileRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync theme to document body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    Storage.saveTheme(theme);
  }, [theme]);

  // Check initial Firebase connection
  useEffect(() => {
    const cfg = getSavedFirebaseConfig();
    if (cfg && cfg.projectId) {
      const db = initFirebase(cfg);
      if (db) {
        setIsCloudConnected(true);
      }
    }
  }, []);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Import file handler
  const handleImportFile = async (file: File) => {
    try {
      showToast(`Đang đọc file ${file.name}...`);
      const newProducts = await parseExcelOrCsv(file);
      setProducts(newProducts);
      setSourceName(file.name);
      Storage.saveProducts(newProducts);
      Storage.saveSource(file.name);

      // Reset selected to all new products
      const newSelected = new Set(newProducts.map((p) => p.sku));
      setSelectedSkus(newSelected);
      Storage.saveSelected(Array.from(newSelected));

      showToast(`Đã nhập thành công ${number(newProducts.length)} sản phẩm từ ${file.name}`);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Không thể đọc file. Vui lòng kiểm tra định dạng!');
    }
  };

  // Load demo products
  const handleLoadDemo = () => {
    setProducts(DEMO_PRODUCTS);
    setSourceName('Dữ liệu mẫu');
    Storage.saveProducts(DEMO_PRODUCTS);
    Storage.saveSource('Dữ liệu mẫu');
    const demoSkus = new Set(DEMO_PRODUCTS.map((p) => p.sku));
    setSelectedSkus(demoSkus);
    Storage.saveSelected(Array.from(demoSkus));
    showToast('Đã nạp 6 sản phẩm mẫu');
  };

  const handleLoadShopee = () => {
    setProducts(SHOPEE_PRODUCTS);
    setSourceName('Shopee Shop (215 SP)');
    Storage.saveProducts(SHOPEE_PRODUCTS);
    Storage.saveSource('Shopee Shop (215 SP)');
    const allSkus = new Set(SHOPEE_PRODUCTS.map((p) => p.sku));
    setSelectedSkus(allSkus);
    Storage.saveSelected(Array.from(allSkus));
    showToast('Đã nạp 215 sản phẩm từ file Shopee mass update!');
  };

  const handleLoadTmdt = () => {
    setProducts(TMDT_PRODUCTS);
    setSourceName('Bảng tính Sàn TMĐT (155 SP)');
    Storage.saveProducts(TMDT_PRODUCTS);
    Storage.saveSource('Bảng tính Sàn TMĐT (155 SP)');
    const allSkus = new Set(TMDT_PRODUCTS.map((p) => p.sku));
    setSelectedSkus(allSkus);
    Storage.saveSelected(Array.from(allSkus));
    showToast('Đã nạp 155 sản phẩm có giá vốn thực tế từ Bảng tính Sàn TMĐT!');
  };

  // Save fees
  const handleSaveFees = (newFees: FeesConfig) => {
    setFees(newFees);
    Storage.saveFees(newFees);
  };

  // Full product update
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.sku === updatedProduct.sku ? updatedProduct : p));
      Storage.saveProducts(next);
      return next;
    });
    showToast(`Đã lưu tùy chỉnh sản phẩm: ${updatedProduct.name}`);
  };

  // Quick field edit (cost, listPrice, stock, etc.)
  const handleQuickUpdateProductField = (
    sku: string,
    field: keyof Product,
    value: any
  ) => {
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.sku === sku) {
          return { ...p, [field]: value };
        }
        return p;
      });
      Storage.saveProducts(next);
      return next;
    });
  };

  // Add new product
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.sku === newProduct.sku);
      let next: Product[];
      if (exists) {
        next = prev.map((p) => (p.sku === newProduct.sku ? newProduct : p));
      } else {
        next = [newProduct, ...prev];
      }
      Storage.saveProducts(next);
      return next;
    });
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      next.add(newProduct.sku);
      Storage.saveSelected(Array.from(next));
      return next;
    });
    showToast(`Đã thêm sản phẩm mới: ${newProduct.name}`);
  };

  // Delete product
  const handleDeleteProduct = (sku: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.sku !== sku);
      Storage.saveProducts(next);
      return next;
    });
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      next.delete(sku);
      Storage.saveSelected(Array.from(next));
      return next;
    });
    showToast(`Đã xóa sản phẩm ${sku}`);
  };

  // Custom sale price override for individual product
  const handleSaleOverrideChange = (sku: string, price: number | null) => {
    const key = `${campaign.platform}:${sku}`;
    setSaleOverrides((prev) => {
      const copy = { ...prev };
      if (price !== null && price > 0) {
        copy[key] = price;
      } else {
        delete copy[key];
      }
      Storage.saveOverrides(copy);
      return copy;
    });
    showToast(price ? 'Đã cập nhật giá sale riêng' : 'Đã khôi phục giá theo % chung');
  };

  const handleResetAllOverrides = () => {
    const prefix = `${campaign.platform}:`;
    setSaleOverrides((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        if (k.startsWith(prefix)) {
          delete copy[k];
        }
      });
      Storage.saveOverrides(copy);
      return copy;
    });
    showToast(`Đã đặt lại tất cả giá riêng trên ${campaign.platform === 'shopee' ? 'Shopee' : 'Lazada'}`);
  };

  // Toggle single product selection
  const handleToggleSku = (sku: string) => {
    setSelectedSkus((prev) => {
      const copy = new Set(prev);
      if (copy.has(sku)) {
        copy.delete(sku);
      } else {
        copy.add(sku);
      }
      Storage.saveSelected(Array.from(copy));
      return copy;
    });
  };

  // Select all or deselect all
  const handleSelectAll = (select: boolean) => {
    const nextSet = select ? new Set(products.map((p) => p.sku)) : new Set<string>();
    setSelectedSkus(nextSet);
    Storage.saveSelected(Array.from(nextSet));
    showToast(select ? 'Đã chọn tất cả sản phẩm' : 'Đã bỏ chọn tất cả');
  };

  // Select only profitable products
  const handleSelectProfitable = () => {
    const currentFees = fees[campaign.platform];
    const profitableSkus = products
      .filter((p) => {
        const c = calc(p, campaign.platform, currentFees, campaign, saleOverrides);
        return c.profit >= 0;
      })
      .map((p) => p.sku);

    const nextSet = new Set(profitableSkus);
    setSelectedSkus(nextSet);
    Storage.saveSelected(profitableSkus);
    showToast(`Đã chọn ${profitableSkus.length} sản phẩm có lãi`);
  };

  // Select/deselect a batch of SKUs (e.g. by category)
  const handleSelectBatch = (skus: string[], select: boolean) => {
    setSelectedSkus((prev) => {
      const copy = new Set(prev);
      skus.forEach((sku) => {
        if (select) copy.add(sku);
        else copy.delete(sku);
      });
      Storage.saveSelected(Array.from(copy));
      return copy;
    });
    showToast(select ? `Đã chọn ${skus.length} sản phẩm theo ngành` : `Đã bỏ chọn ${skus.length} sản phẩm`);
  };

  // Save campaign
  const handleSaveCampaign = () => {
    Storage.saveCampaign({
      name: campaign.name,
      platform: campaign.platform,
      discount: campaign.discountRate,
      selected: Array.from(selectedSkus),
      updatedAt: new Date().toISOString(),
    });
    showToast('Đã lưu thiết lập chương trình sale!');
  };

  // Apply data fetched from Firebase Firestore
  const handleApplyCloudData = (cloudData: {
    products: Product[];
    fees: FeesConfig;
    overrides: Record<string, number>;
  }) => {
    if (cloudData.products) {
      setProducts(cloudData.products);
      Storage.saveProducts(cloudData.products);
      setSelectedSkus(new Set(cloudData.products.map((p) => p.sku)));
      Storage.saveSelected(cloudData.products.map((p) => p.sku));
    }
    if (cloudData.fees) {
      setFees(cloudData.fees);
      Storage.saveFees(cloudData.fees);
    }
    if (cloudData.overrides) {
      setSaleOverrides(cloudData.overrides);
      Storage.saveOverrides(cloudData.overrides);
    }
  };

  // Calculations for KPI Cards
  const inventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + productValue(p), 0);
  }, [products]);

  const selectedCampaignCount = selectedSkus.size;

  const expectedProfit = useMemo(() => {
    const currentFees = fees[campaign.platform];
    return products
      .filter((p) => selectedSkus.has(p.sku))
      .reduce((acc, p) => {
        const c = calc(p, campaign.platform, currentFees, campaign, saleOverrides);
        return acc + c.profit;
      }, 0);
  }, [products, selectedSkus, campaign, fees, saleOverrides]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#0e1830] text-[#13213f] dark:text-[#edf3ff] font-sans antialiased transition-colors flex flex-col pb-16 md:pb-0">
      {/* Hidden file input for global topbar import */}
      <input
        ref={hiddenHeaderFileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImportFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Top Header */}
      <Header
        onImportClick={() => hiddenHeaderFileRef.current?.click()}
        onThemeToggle={handleThemeToggle}
        isDark={theme === 'dark'}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        isCloudConnected={isCloudConnected}
      />

      {/* Navigation */}
      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
        productCount={products.length}
        selectedCampaignCount={selectedCampaignCount}
      />

      {/* Main Content Area */}
      <main className="max-w-[1560px] w-full mx-auto p-3 sm:p-5 lg:p-7 flex-1">
        {currentView === 'overview' && (
          <OverviewView
            productCount={products.length}
            inventoryValue={inventoryValue}
            selectedCampaignCount={selectedCampaignCount}
            expectedProfit={expectedProfit}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'products' && (
          <ProductsView
            products={products}
            sourceName={sourceName}
            onImportFile={handleImportFile}
            onLoadDemo={handleLoadDemo}
            onLoadShopee={handleLoadShopee}
            onLoadTmdt={handleLoadTmdt}
            onUpdateProduct={handleUpdateProduct}
            onQuickUpdateField={handleQuickUpdateProductField}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onShowToast={showToast}
          />
        )}

        {currentView === 'campaigns' && (
          <CampaignView
            products={products}
            platform={campaign.platform}
            onPlatformChange={(p) => setCampaign((prev) => ({ ...prev, platform: p }))}
            campaign={campaign}
            onCampaignChange={setCampaign}
            fees={fees}
            saleOverrides={saleOverrides}
            onSaleOverrideChange={handleSaleOverrideChange}
            onResetAllOverrides={handleResetAllOverrides}
            selectedSkus={selectedSkus}
            onToggleSku={handleToggleSku}
            onSelectAll={handleSelectAll}
            onSelectProfitable={handleSelectProfitable}
            onSelectBatch={handleSelectBatch}
            onSaveCampaign={handleSaveCampaign}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onQuickUpdateField={handleQuickUpdateProductField}
            onNavigate={setCurrentView}
            onShowToast={showToast}
          />
        )}

        {currentView === 'fees' && (
          <FeesView
            fees={fees}
            platform={campaign.platform}
            onPlatformChange={(p) => setCampaign((prev) => ({ ...prev, platform: p }))}
            onSaveFees={handleSaveFees}
            products={products}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Cloud & Firebase Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        products={products}
        fees={fees}
        saleOverrides={saleOverrides}
        onApplyCloudData={handleApplyCloudData}
        onShowToast={showToast}
        isCloudConnected={isCloudConnected}
        setIsCloudConnected={setIsCloudConnected}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
