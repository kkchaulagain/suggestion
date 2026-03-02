import type { Request, Response } from 'express';
const Business = require('../../models/Business');
import type { BusinessDocument, BusinessListItem, GetBusinessesResponse, GetBusinessResponse, } from '../../types/business';
import type { ApiResponse } from '../../types/api';

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
async function updateBusiness(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
 //geting form the body cause we wanna change that
  const { businessname, location, pancardNumber, description } = req.body;

  //checking empty body FIRST
  const updateFields: Partial<BusinessListItem> = {};
  if (businessname) updateFields.businessname = businessname;
  if (location) updateFields.location = location;
  if (pancardNumber) updateFields.pancardNumber = pancardNumber;
  if (description) updateFields.description = description;

  if (Object.keys(updateFields).length === 0) {
    res.status(400).json({
      message: 'No valid fields to update',
      ok: false,
    });
    return;
  }

  // check if business exists
  const business = await Business.findByIdAndUpdate(id, updateFields, { new: true });

  if (!business) {
    res.status(404).json({
      message: 'Business not found',
      ok: false,
    });
    return;
  }

  res.status(200).json({
    message: 'Business updated successfully',
    ok: true,
    business: toListItem(business),
  });
}
module.exports = { getBusiness,findBusinessById,deleteBusiness,updateBusiness };
