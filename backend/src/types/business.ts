import type { Types } from 'mongoose';
import type { ApiResponse } from './api';

export type BusinessType = 'personal' | 'commercial';

export type BusinessMapLocation = {
  googleMapsUrl?: string;
  googleReviewsUrl?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
};

export type BusinessDocument = {
  _id: Types.ObjectId;
  owner?: Types.ObjectId | null;
  type: BusinessType;
  isPublicCompany?: boolean;
  businessname: string;
  location?: string;
  pancardNumber?: string;
  description: string;
  mapLocation?: BusinessMapLocation;
};

export type BusinessListItem = {
  id: string;
  owner: string;
  type: BusinessType;
  isPublicCompany: boolean;
  businessname: string;
  location?: string;
  pancardNumber?: string;
  description: string;
  mapLocation?: BusinessMapLocation;
};

export type GetBusinessesResponse = ApiResponse & {
  businesses: BusinessListItem[];
};

export type GetBusinessResponse = ApiResponse & {
  business: BusinessListItem;
};
export type UpdateBusinessResponse=ApiResponse &{
  business:BusinessListItem;
}