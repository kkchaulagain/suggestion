const mongoose = require('mongoose');

const crmNoteSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

crmNoteSchema.index({ businessId: 1, createdAt: -1 });

export const CrmNote = mongoose.model('CrmNote', crmNoteSchema);
module.exports = CrmNote;
