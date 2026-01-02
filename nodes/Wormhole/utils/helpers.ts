/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';

/**
 * Clean undefined values from an object
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }
  
  return cleaned;
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const cleaned = cleanObject(params);
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(cleaned)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.append(key, String(value));
    }
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse pagination from response
 */
export function parsePagination(response: IDataObject): {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
} {
  const page = (response.page as number) || 1;
  const pageSize = (response.pageSize as number) || (response.limit as number) || 50;
  const totalItems = (response.total as number) || (response.totalItems as number) || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasMore = page < totalPages;
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasMore,
  };
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: string | number | Date): string {
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  if (typeof timestamp === 'number') {
    // Handle Unix timestamps (seconds or milliseconds)
    const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
    return new Date(ms).toISOString();
  }
  
  // Already a string, try to parse and reformat
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return timestamp;
  }
  
  return date.toISOString();
}

/**
 * Format amount with decimals
 */
export function formatAmount(
  amount: string | number,
  decimals: number = 18,
  displayDecimals: number = 6
): string {
  const amountStr = String(amount);
  const amountBigInt = BigInt(amountStr);
  const divisor = BigInt(10 ** decimals);
  
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.slice(0, displayDecimals).replace(/0+$/, '');
  
  if (!trimmedFractional) {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmedFractional}`;
}

/**
 * Parse amount string to raw amount
 */
export function parseAmount(amount: string, decimals: number = 18): string {
  const parts = amount.split('.');
  const wholePart = parts[0] || '0';
  let fractionalPart = parts[1] || '';
  
  // Pad or truncate fractional part
  if (fractionalPart.length > decimals) {
    fractionalPart = fractionalPart.slice(0, decimals);
  } else {
    fractionalPart = fractionalPart.padEnd(decimals, '0');
  }
  
  const combined = wholePart + fractionalPart;
  return BigInt(combined).toString();
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Truncate string to a maximum length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Check if a string is valid hex
 */
export function isValidHex(str: string): boolean {
  const cleanStr = str.startsWith('0x') ? str.slice(2) : str;
  return /^[0-9a-fA-F]+$/.test(cleanStr);
}

/**
 * Normalize hex string (remove 0x prefix, lowercase)
 */
export function normalizeHex(hex: string): string {
  let normalized = hex.toLowerCase();
  if (normalized.startsWith('0x')) {
    normalized = normalized.slice(2);
  }
  return normalized;
}

/**
 * Add 0x prefix to hex string if not present
 */
export function addHexPrefix(hex: string): string {
  if (hex.startsWith('0x')) {
    return hex;
  }
  return '0x' + hex;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) {
    return target;
  }
  
  const source = sources.shift();
  
  if (source) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];
        
        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          target[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          ) as T[Extract<keyof T, string>];
        } else {
          target[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
  }
  
  return deepMerge(target, ...sources);
}
