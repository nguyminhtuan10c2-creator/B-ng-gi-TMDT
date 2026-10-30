import React, { useState } from 'react';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  initFirebase,
  syncToFirebase,
  syncFromFirebase,
  FirebaseCustomConfig,
} from '../services/firebaseSync';
import { Product, FeesConfig } from '../types';
import { X, Cloud, CheckCircle2, Copy, ExternalLink, RefreshCw, UploadCloud, DownloadCloud, Terminal } from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  fees: FeesConfig;
  saleOverrides: Record<string, number>;
  onApplyCloudData: (cloudData: { products: Product[]; fees: FeesConfig; overrides: Record<string, number> }) => void;
  onShowToast: (msg: string) => void;
  isCloudConnected: boolean;
  setIsCloudConnected: (connected: boolean) => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  products,
  fees,
  saleOverrides,
  onApplyCloudData,
  onShowToast,
  isCloudConnected,
  setIsCloudConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'deploy'>('firebase');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appId, setAppId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const cfg = getSavedFirebaseConfig();
      if (cfg) {
        setApiKey(cfg.apiKey || '');
        setProjectId(cfg.projectId || '');
        setAppId(cfg.appId || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndConnect = async () => {
    if (!apiKey.trim() || !projectId.trim()) {
      onShowToast('Vui lòng nhập Project ID và API Key!');
      return;
    }

    const config: FirebaseCustomConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: `${projectId.trim()}.firebaseapp.com`,
      appId: appId.trim() || '1:123456789:web:abcdef',
    };

    saveFirebaseConfig(config);
    const db = initFirebase(config);
    if (db) {
      setIsCloudConnected(true);
      onShowToast('Đã lưu cấu hình Firebase! Đang thử đồng bộ...');
      const success = await syncToFirebase(products, fees, saleOverrides);
      if (success) {
        onShowToast('Đồng bộ lên Firestore thành công!');
      } else {
        onShowToast('Đã kết nối Firebase (vui lòng kiểm tra Firestore Rules nếu chưa bật write)');
      }
    } else {
      setIsCloudConnected(false);
      onShowToast('Không thể kết nối với thông tin trên');
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    const success = await syncToFirebase(products, fees, saleOverrides);
    setIsSyncing(false);
    if (success) {
      onShowToast('Đã tải toàn bộ danh sách sản phẩm và biểu phí lên Firestore!');
    } else {
      onShowToast('Lỗi đồng bộ. Hãy kiểm tra cài đặt Firebase!');
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    const data = await syncFromFirebase();
    setIsSyncing(false);
    if (data && data.products) {
      onApplyCloudData(data);
      onShowToast(`Đã nhận ${data.products.length} sản phẩm từ Firebase Firestore!`);
    } else {
      onShowToast('Chưa tìm thấy dữ liệu trên Firestore hoặc chưa có quyền đọc.');
    }
  };

  const handleDisconnect = () => {
    saveFirebaseConfig(null);
    setApiKey('');
    setProjectId('');
    setAppId('');
    setIsCloudConnected(false);
    onShowToast('Đã ngắt kết nối Firebase. Đang dùng bộ nhớ cục bộ (Local Storage).');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#162343] border border-[#e4e9f2] dark:border-[#2b3b62] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e4e9f2] dark:border-[#2b3b62] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#246bfe]/10 text-[#246bfe] flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#13213f] dark:text-white">
                Đồng bộ Cloud & Triển khai
              </h3>
              <p className="text-xs text-[#71809d] dark:text-[#9bb0d6]">
                Chuẩn bị kết nối Firebase Firestore và triển khai lên Vercel / Cloud Run
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#e4e9f2] dark:border-[#2b3b62] px-5 bg-slate-50/50 dark:bg-[#14213f]/50">
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'firebase'
                ? 'border-[#246bfe] text-[#246bfe] dark:text-[#5e95ff]'
                : 'border-transparent text-[#71809d] hover:text-[#13213f]'
            }`}
          >
            Kết nối Firebase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'deploy'
                ? 'border-[#246bfe] text-[#246bfe] dark:text-[#5e95ff]'
                : 'border-transparent text-[#71809d] hover:text-[#13213f]'
            }`}
          >
            Triển khai Vercel / Cloud Run
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {activeTab === 'firebase' ? (
            <>
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 text-[#1e3a8a] dark:text-blue-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Chế độ lưu trữ: {isCloudConnected ? 'Firebase Firestore (Online)' : 'Trình duyệt LocalStorage (Sẵn sàng)'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  App luôn tự động lưu dữ liệu trên trình duyệt. Khi nhập thông tin Firebase bên dưới, app sẽ đồng bộ dữ liệu sản phẩm, biểu phí và giá sale lên Cloud để dùng chung nhiều thiết bị.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                    Firebase Project ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="ví dụ: kdt89-pricing-app"
                    className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                    Firebase Web API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#51617e] dark:text-[#9fb2d4] mb-1">
                    Firebase App ID (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456789:web:abcdef..."
                    className="w-full px-3 py-2 rounded-xl border border-[#e4e9f2] dark:border-[#2b3b62] bg-white dark:bg-[#14213f] text-[#13213f] dark:text-white outline-none focus:border-[#246bfe]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAndConnect}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#246bfe] hover:bg-[#195de6] text-white font-bold text-xs sm:text-sm shadow transition cursor-pointer"
                >
                  Lưu & Kết nối Firebase
                </button>
                {isCloudConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="py-2.5 px-3 rounded-xl border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    Ngắt kết nối
                  </button>
                )}
              </div>

              {isCloudConnected && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncToCloud}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Đẩy lên Cloud</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handlePullFromCloud}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#eef3fb] dark:bg-[#1a2b50] text-[#284064] dark:text-[#a6c1ee] font-bold text-xs hover:bg-[#e4ebf7] transition cursor-pointer disabled:opacity-50"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Lấy từ Cloud về</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#14213f] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#246bfe]" />
                  <span>Cách 1: Triển khai lên Vercel</span>
                </strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dự án đã được cấu hình chuẩn Vite + React + TypeScript:
                </p>
                <div className="bg-[#0b1734] text-slate-100 p-2.5 rounded-lg text-xs font-mono space-y-1">
                  <div>1. Đẩy code lên GitHub repository</div>
                  <div>2. Import repo trên Vercel Dashboard</div>
                  <div>3. Framework Preset: <strong>Vite</strong></div>
                  <div>4. Build Command: <strong>npm run build</strong></div>
                  <div>5. Output Directory: <strong>dist</strong></div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#14213f] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <strong className="block text-sm font-bold text-[#13213f] dark:text-white flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-[#0d9b73]" />
                  <span>Cách 2: Triển khai lên Google Cloud Run</span>
                </strong>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Đã cấu hình server Express chạy ở cổng 3000 hoặc container Cloud Run:
                </p>
                <div className="bg-[#0b1734] text-slate-100 p-2.5 rounded-lg text-xs font-mono">
                  gcloud run deploy kdt89-pricing-studio --source . --port 3000
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Khi cần tích hợp Firestore security rules và authentication chính thức trên Google Cloud, có thể kích hoạt trực tiếp trong AI Studio hoặc thiết lập Firebase Project tương ứng.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
