export interface OrderData {
  orderId: string;
  shipCity: string;
  freight: number;
  shipName: string;
}

export interface Distributor {
  id: number;
  companyId: number;
  companyName: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  country: string;
  orderData: OrderData[];
  isUsingInnerGridStatePresets: boolean;
}
