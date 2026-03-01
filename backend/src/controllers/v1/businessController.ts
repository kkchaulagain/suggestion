import type { Request, Response } from 'express';
const Business = require('../../models/Business');
import type { BusinessDocument, BusinessListItem, GetBusinessesResponse } from '../../types/business';

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

module.exports = { getBusiness };
