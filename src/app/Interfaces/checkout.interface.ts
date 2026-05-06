export interface PaypalItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  items: PaypalItem[];
  total: number;
}
