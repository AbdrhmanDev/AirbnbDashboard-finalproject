export interface Address {
  fullAddress?: string;
  country: string;
  city: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface SpaceDetails {
  bedrooms: number;
  path: number; // عدد الحمامات
  beds: number;
  area: number;
  rooms: number;
}

export interface Capacity {
  adults: number;
  children: number;
  infants: number;
}

export interface SafetyFeatures {
  smokeDetector: boolean;
  carbonMonoxideDetector: boolean;
  firstAidKit: boolean;
  fireExtinguisher: boolean;
}

export interface Review {
  reviewId: string;
}

export interface Hotel2 {
  _id: string;
  title: string;
  categoryId: string;
  description: string;
  pricePerNight: number;
  aboutThisSpace?: string;
  address: Address;
  images: string[];
  rating?: number;
  amenities?: string[];
  reviews?: Review[];
  status: 'available' | 'booked' | 'unavailable' | 'maintenance';
  spaceDetails: SpaceDetails;
  capacity: Capacity;
  petPolicy?: 'allowed' | 'not_allowed' | 'on_request';
  view?: 'ocean' | 'mountain' | 'city' | 'garden' | 'none';
  advantages: string[];
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  propertyType:
    | 'apartment'
    | 'villa'
    | 'house'
    | 'private_room'
    | 'shared_room';
  safetyFeatures?: SafetyFeatures;
  houseRules?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
