import type { Types } from 'mongoose';
import type { ApiResponse } from './api';

export type BusinessDocument = {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  businessname: string;
  location: string;
  pancardNumber: number;
  description: string;
};

export type BusinessListItem = {
  id: string;
  owner: string;
  businessname: string;
  location: string;
  pancardNumber: number;
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