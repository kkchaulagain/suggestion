import type { Types } from 'mongoose';
import type { ApiResponse } from './api';

export type BusinessType = 'personal' | 'commercial';

export type BusinessDocument = {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  type: BusinessType;
  businessname: string;
  location?: string;
  pancardNumber?: string;
  description: string;
};

export type BusinessListItem = {
  id: string;
  owner: string;
  type: BusinessType;
  businessname: string;
  location?: string;
  pancardNumber?: string;
  description: string;
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