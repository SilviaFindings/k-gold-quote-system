/**
 * API 客户端工具函数
 */

const API_BASE = '';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

/**
 * 获取认证 token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * 创建带认证的请求头
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * 通用 API 请求函数
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

// ============================================
// 认证 API
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<{ user: any }> {
  return apiRequest<{ user: any }>('/api/auth/me');
}

export async function logout(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
}

// ============================================
// 产品 API
// ============================================

export interface Product {
  id: string;
  userId: string;
  category: string;
  subCategory: string;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  karat: string;
  goldColor: string;
  goldPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;
  stoneCost: number;
  platingCost: number;
  moldCost: number;
  commission: number;
  supplierCode: string;
  orderChannel?: string;
  shape?: string;
  specialMaterialLoss?: number;
  specialMaterialCost?: number;
  specialProfitMargin?: number;
  specialLaborFactorRetail?: number;
  specialLaborFactorWholesale?: number;
  laborCostDate: string;
  accessoryCostDate: string;
  stoneCostDate: string;
  platingCostDate: string;
  moldCostDate: string;
  commissionDate: string;
  timestamp: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  productCode?: string;
  karat?: string;
  goldColor?: string;
}

export async function getProducts(filters?: ProductFilters, limit: number = 100, skip: number = 0): Promise<{ products: Product[] }> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.subCategory) params.append('subCategory', filters.subCategory);
  if (filters?.productCode) params.append('productCode', filters.productCode);
  if (filters?.karat) params.append('karat', filters.karat);
  if (filters?.goldColor) params.append('goldColor', filters.goldColor);
  params.append('limit', limit.toString());
  params.append('skip', skip.toString());

  return apiRequest<{ products: Product[] }>(`/api/products?${params}`);
}

export async function createProduct(data: Partial<Product>): Promise<{ product: Product }> {
  return apiRequest<{ product: Product }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<{ product: Product }> {
  return apiRequest<{ product: Product }>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

export async function batchDeleteProducts(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
  return apiRequest<{ success: boolean; deletedCount: number }>('/api/products/batch-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ============================================
// 价格历史 API
// ============================================

export interface PriceHistory extends Product {
  productId: string;
}

export async function getPriceHistory(productId?: string, limit: number = 100, skip: number = 0): Promise<{ history: PriceHistory[] }> {
  const params = new URLSearchParams();
  if (productId) params.append('productId', productId);
  params.append('limit', limit.toString());
  params.append('skip', skip.toString());

  return apiRequest<{ history: PriceHistory[] }>(`/api/price-history?${params}`);
}

export async function createPriceHistory(data: Partial<PriceHistory>): Promise<{ history: PriceHistory }> {
  return apiRequest<{ history: PriceHistory }>('/api/price-history', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// 配置 API
// ============================================

export interface AppConfig {
  goldPrice: number;
  goldPriceTimestamp: string;
  priceCoefficients: any;
  dataVersion: number;
}

export async function getConfigs(): Promise<{ configs: Record<string, any> }> {
  return apiRequest<{ configs: Record<string, any> }>('/api/config');
}

export async function setConfig(key: string, value: any): Promise<{ config: any }> {
  return apiRequest<{ config: any }>('/api/config', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}

export async function initializeConfig(): Promise<{ success: boolean; message: string; coefficients: any; goldPrice: number }> {
  return apiRequest<{ success: boolean; message: string; coefficients: any; goldPrice: number }>('/api/init', {
    method: 'POST',
  });
}
