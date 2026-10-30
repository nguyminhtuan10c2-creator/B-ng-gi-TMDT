import React, { useState, useEffect, useRef } from 'react';
import { formatVND, parseVND } from '../utils/formatters';

interface CurrencyInputProps {
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  title,
  disabled = false,
  min = 0,
  max,
  autoFocus = false,
}) => {
  const [text, setText] = useState<string>(() => {
    const num = Number(value);
    return num > 0 ? formatVND(num) : '';
  });

  const isFocusedRef = useRef(false);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      const num = Number(value);
      setText(num > 0 ? formatVND(num) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip everything except digits
    const digitsOnly = rawVal.replace(/[^\d]/g, '');

    if (digitsOnly === '') {
      setText('');
      onChange(0);
      return;
    }

    let parsedNum = parseInt(digitsOnly, 10);
    if (isNaN(parsedNum)) parsedNum = 0;
    if (min !== undefined && parsedNum < min) parsedNum = min;
    if (max !== undefined && parsedNum > max) parsedNum = max;

    // Format with dots
    const formatted = formatVND(parsedNum);
    setText(formatted);
    onChange(parsedNum);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    e.target.select();
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const num = Number(value);
    setText(num > 0 ? formatVND(num) : '');
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      title={title}
      autoFocus={autoFocus}
      className={className}
    />
  );
};
