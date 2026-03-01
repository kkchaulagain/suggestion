const mongoose = require('mongoose');

const defaults = {
  owner: new mongoose.Types.ObjectId(),
  businessname: 'Test Business',
  location: 'Kathmandu',
  pancardNumber: 123456789,
  description: 'Test business description',
};

function buildBusiness(overrides: Record<string, unknown> = {}) {
  return { ...defaults, ...overrides };
}

module.exports = { buildBusiness };
