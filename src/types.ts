export interface Category {
  id: number;
  name_en: string;
  name_de: string;
  name_fa: string;
  icon: string;
}

export interface Product {
  id: number;
  name_en: string;
  name_de: string;
  name_fa: string;
  description_en: string;
  description_de: string;
  description_fa: string;
  price: number;
  image: string;
  stock: number;
  categoryId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  name_en: string;
  name_de: string;
  name_fa: string;
  price: number;
  image: string;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
