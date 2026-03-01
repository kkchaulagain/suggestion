import type { Request, Response } from 'express';
const Business = require('../../models/Business');
import type { BusinessDocument, BusinessListItem, GetBusinessesResponse, GetBusinessResponse } from '../../types/business';
import { ApiResponse } from '../../types/api';

function toListItem(doc: BusinessDocument): BusinessListItem {
  return {
    id: String(doc._id),
    owner: String(doc.owner),
    businessname: doc.businessname,
    location: doc.location,
    pancardNumber: doc.pancardNumber,
    description: doc.description,
  };
}

async function getBusiness(req: Request, res: Response): Promise<void> {
  const businesses = await Business.find();
  const businessesResponse: BusinessListItem[] = businesses.map(toListItem);
  const payload: GetBusinessesResponse = {
    message: 'Business API v1',
    ok: true,
    businesses: businessesResponse,
  };
  res.json(payload);
}
async function findBusinessById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const business = await Business.findById(id);
  if (!business) {
    res.status(404).json({ message: 'Business not found', ok: false });
    return;
  }
  const payload: GetBusinessResponse = {
    message: 'Business found',
    ok: true,
    business: toListItem(business),
  };
  res.json(payload);
  return;
}

async function deleteBusiness(req:Request,res:Response):Promise<void>{
  const {id}= req.params;
  const business = await Business.findByIdAndDelete(id);
  
  if(!business){
    const payload:ApiResponse={
      message:'Business not found',
      ok:false,
    };
    res.status(404).json(payload);
    return;
  }
  //business found and deleted from DB
  const payload:ApiResponse={
    message:'Business deleted successfully',
    ok:true,
  };
  res.status(200).json(payload);
}
module.exports = { getBusiness,findBusinessById,deleteBusiness };
