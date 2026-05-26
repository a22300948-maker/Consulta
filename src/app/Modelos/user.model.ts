export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  address?: string;
  postalCode?: string;
  createdAt: string;
}

export interface UserOrderItem {
  orderId: number;
  productoId: number | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface UserOrder {
  id: number;
  paypalOrderId?: string | null;
  total: number;
  ivaRate?: number;
  ivaAmount?: number;
  totalConIva?: number;
  currency: string;
  status: string;
  createdAt: string;
  items: UserOrderItem[];
}
