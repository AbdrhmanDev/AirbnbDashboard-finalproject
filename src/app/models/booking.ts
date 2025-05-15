import { Hotel } from './hotel';

export interface UserAddress {
  country: string;
  city: string;
}

export interface HostDetails {
  isSuperHost: boolean;
  reviews: any[]; // You can create a specific Review interface if needed
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  dateOfBirth: string;
  gender: string;
  role: string;
  address: UserAddress;
  hostDetails: HostDetails;
  bookings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  reviewId?: string | Review;
}

export interface Property {
  propertyId: string | Hotel;
  hostId: string | User;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  startDate: Date | string;
  endDate: Date | string;
  price: number;
  serviceFee?: number;
  taxes?: number;
  totalPrice: number;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';
  companions: number;
  petsAllowed: boolean;
  review?: Review;
}

export interface Booking {
  _id?: string;
  userId: string | User;
  properties: Property[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateBookingDTO {
  userId: string;
  hostId: string;
  propertyId: string;
  companions: number;
  petsAllowed: boolean;
  startDate: string;
  endDate: string;
  totalPrice: number;
}

export interface UpdateBookingDTO {
  companions?: number;
  petsAllowed?: boolean;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  totalPrice?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
