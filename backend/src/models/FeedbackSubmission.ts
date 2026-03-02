const mongoose = require('mongoose');
const { FEEDBACK_FIELD_TYPES } = require('./FeedbackForm');

const formSnapshotFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: {
        values: FEEDBACK_FIELD_TYPES,
        message: 'Field type `{VALUE}` is not supported',
      },
    },
    options: { type: [String], default: undefined },
  },
  { _id: false },
);

const feedbackSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackForm',
      required: [true, 'Form id is required'],
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business id is required'],
      index: true,
    },
    formSnapshot: {
      type: [formSnapshotFieldSchema],
      required: [true, 'Form snapshot is required'],
    },
    responses: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Responses are required'],
      default: {},
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

feedbackSubmissionSchema.index({ formId: 1, submittedAt: -1 });
feedbackSubmissionSchema.index({ businessId: 1, submittedAt: -1 });

const FeedbackSubmission = mongoose.model('FeedbackSubmission', feedbackSubmissionSchema);

module.exports = { FeedbackSubmission };
