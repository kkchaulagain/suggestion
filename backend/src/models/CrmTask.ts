const mongoose = require('mongoose');

const crmTaskSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

crmTaskSchema.index({ businessId: 1, createdAt: -1 });

export const CrmTask = mongoose.model('CrmTask', crmTaskSchema);
module.exports = CrmTask;
