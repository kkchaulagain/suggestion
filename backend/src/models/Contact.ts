const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    lastSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackSubmission',
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    firstSubmittedAt: {
      type: Date,
    },
    lastSubmittedAt: {
      type: Date,
    },
  },
  { timestamps: false },
);

contactSchema.index({ businessId: 1, email: 1 }, { unique: true, sparse: true });
contactSchema.index({ businessId: 1, phone: 1 }, { unique: true, sparse: true });
contactSchema.index({ businessId: 1, lastSubmittedAt: -1 });

export const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
