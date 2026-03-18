const mongoose = require('mongoose');

const crmActivitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    eventType: { type: String, required: true },
    summary: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

crmActivitySchema.index({ businessId: 1, createdAt: -1 });

export const CrmActivity = mongoose.model('CrmActivity', crmActivitySchema);
module.exports = CrmActivity;
