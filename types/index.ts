// ==============================
// Domain Types (mirrors Prisma models)
// ==============================

export type ProductStatus = "DRAFT" | "ACTIVE" | "SOLD_OUT" | "INACTIVE";
export type ReservationStatus = "CONFIRMED" | "CANCELLED";

export interface Product {
  id: string;
  serialNo: string;
  name: string;
  imageUrl: string;
  totalStock: number;
  reservedStock: number;
  price: number;
  cost: number;
  note?: string | null;
  storeName?: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  // 計算欄位
  availableStock: number;
}

export interface Guest {
  id: string;
  guestToken: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  orderNo: string;
  productId: string;
  guestId: string;
  nicknameSnapshot: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: ReservationStatus;
  reservedAt: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional)
  product?: Product;
  guest?: Guest;
}

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
}

// ==============================
// API Request / Response Types
// ==============================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Products
export interface ProductListItem {
  id: string;
  serialNo: string;
  name: string;
  imageUrl: string;
  price: number;
  availableStock: number;
  status: ProductStatus;
}

export interface ProductDetail extends Product {
  availableStock: number;
}

// Guests
export interface GuestUpsertRequest {
  guestToken: string;
  nickname: string;
}

// Reservations
export interface CreateReservationRequest {
  productId: string;
  guestToken: string;
  nickname: string;
  quantity: number;
}

export interface ReservationSummary {
  orderNo: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface MyReservationsResponse {
  reservations: Reservation[];
  totalItems: number;
  totalAmount: number;
}

// Admin
export interface CreateProductRequest {
  name: string;
  totalStock: number;
  price: number;
  cost: number;
  note?: string;
  storeName?: string;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  name?: string;
  totalStock?: number;
  price?: number;
  cost?: number;
  note?: string;
  storeName?: string;
  imageUrl?: string;
  status?: ProductStatus;
}

export interface BuyerSummary {
  nickname: string;
  guestToken: string;
  totalItems: number;
  totalAmount: number;
  reservationCount: number;
  lastReservationAt: string;
}

// Admin Login
export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

// ==============================
// localStorage Keys
// ==============================
export const STORAGE_KEYS = {
  GUEST_TOKEN: "buyhelper_guest_token",
  GUEST_NICKNAME: "buyhelper_guest_nickname",
} as const;
