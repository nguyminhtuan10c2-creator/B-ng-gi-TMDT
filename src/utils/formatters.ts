export const money = (n: number | string | undefined | null): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
};

export const number = (n: number | string | undefined | null): string => {
  return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
};

export const percent = (n: number | undefined | null, decimals = 1): string => {
  return `${(Number(n) || 0).toFixed(decimals)}%`;
};

export const formatVND = (n: number | string | undefined | null): string => {
  if (n === null || n === undefined || n === '') return '';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[^\d]/g, ''));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
};

export const parseVND = (str: string | number | undefined | null): number => {
  if (str === null || str === undefined || str === '') return 0;
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return cleaned === '' ? 0 : parseInt(cleaned, 10);
};
