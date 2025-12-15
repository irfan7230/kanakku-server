export interface BusinessProfile {
    uid: string;
    email: string;
    name?: string;
    address?: string;
    phone?: string;
    createdAt?: string;
}

export interface WholesaleShop {
    id?: string;
    userId: string;
    name: string;
    ownerName: string;
    contactNumber: string;
    address: string;
    upiId?: string;
    isActive: boolean;
    createdAt: string;
}

export interface Product {
    id?: string;
    shopId: string;
    userId: string;
    name: string;
    price: number;
    quantity: number;
    imagePath?: string;
    purchasedAt: string;
    isActive: boolean;
    createdAt: string;
}

export interface Transaction {
    id?: string;
    shopId: string;
    userId: string;
    amount: number;
    type: 'purchase' | 'payment';
    date: string;
    note?: string;
    relatedProductId?: string;
    isActive: boolean;
    createdAt: string;
}
