// Enums
export enum UserRole {
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_CLIENT = 'ROLE_CLIENT',
  ROLE_MANAGER = 'ROLE_MANAGER'
}

export enum OrderStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT'
}

// Entities
export interface User {
  id: number;
  username: string;
  password: string;
  roles: UserRole[];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  purchase_priceht: number;
  profit_margin_percent: number;
  vat_percent: number;
  selling_pricettc: number;
  active: boolean;
  characteristics: Record<string, string> | null;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface Order {
  id: number;
  order_date: Date;
  status: OrderStatus;
  user_id: number | null;
  total_amount: number;
  first_name: string;
  last_name: string;
  address: string;
  phone: string;
  email: string | null;
  has_stock_shortage: boolean;
  reference: string | null;
  city: string | null;
  governorate: string | null;
  delivery_fee: number | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface StockBatch {
  id: number;
  product_id: number;
  batch_number: string;
  initial_quantity: number;
  current_quantity: number;
  unit_price: number;
  expiration_date: Date | null;
}

export interface StockMovement {
  id: number;
  product_id: number;
  batch_id: number | null;
  type: MovementType;
  quantity: number;
  unit_price: number;
  movement_date: Date;
  reason: string | null;
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  log_type: string;
  message: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  page_url: string | null;
}

export interface Settings {
  key: string;
  value: string;
}

// DTOs
export interface ProductDTO {
  id: number;
  name: string;
  description: string | null;
  purchasePriceHT: number;
  profitMarginPercent: number;
  vatPercent: number;
  sellingPriceTTC: number;
  stockQuantity: number;
  active: boolean;
  characteristics: Record<string, string> | null;
  imageUrls: string[];
}

export interface ProductRequest {
  name: string;
  description: string | null;
  purchasePriceHT: number;
  profitMarginPercent: number;
  vatPercent: number;
  characteristics: Record<string, string> | null;
  imageUrls?: string[]; // Rendu optionnel avec ?
}

export interface CheckoutRequest {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string | null;
  city?: string;
  governorate?: string;
  deliveryFee?: number;
  items: Record<number, number>; // productId -> quantity
}

export interface StockInboundRequest {
  productId: number;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  expirationDate: string | null;
  reason: string | null;
}

export interface StockMovementResponse {
  id: number;
  movementDate: Date;
  type: MovementType;
  quantity: number;
  unitPrice: number;
  reason: string | null;
  productId: number;
  productName: string;
  batchNumber: string | null;
}

export interface ProductStockStats {
  totalUnits: number;
  averagePurchasePrice: number;
  totalPurchaseValue: number;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  role?: string;
}

export interface AuthResponse {
  token: string;
}

export interface LogEntryRequest {
  logType: string;
  message: string | null;
  details: Record<string, any> | null;
  userAgent: string | null;
  pageUrl: string | null;
}

export interface LogEntryDTO {
  id: number;
  ipAddress: string | null;
  timestamp: Date;
  logType: string;
  message: string | null;
  details: Record<string, any> | null;
  userAgent: string | null;
  pageUrl: string | null;
}

export interface CategoryDTO {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
}

export interface CategoryRequest {
  name: string;
  parentId?: number | null;
}
