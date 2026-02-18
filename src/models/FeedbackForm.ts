const mongoose = require('mongoose');

const FEEDBACK_FIELD_TYPES = [
  'checkbox',
  'short_text',
  'long_text',
  'big_text',
  'image_upload',
];

const feedbackFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
      match: [
        /^[a-zA-Z][a-zA-Z0-9_]*$/,
        'Field name must start with a letter and contain only letters, numbers, and underscores',
      ],
    },
    label: {
      type: String,
      required: [true, 'Field label is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Field type is required'],
      enum: {
        values: FEEDBACK_FIELD_TYPES,
        message: 'Field type `{VALUE}` is not supported',
      },
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const feedbackFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Form title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    fields: {
      type: [feedbackFieldSchema],
      required: [true, 'Fields are required'],
      validate: [
        {
          validator(fields:any) {
            return Array.isArray(fields) && fields.length > 0;
          },
          message: 'Form must include at least one field',
        },
        {
          validator(fields:any) {
            if (!Array.isArray(fields)) return false;
            const fieldNames = fields
              .map((field) => field?.name?.toLowerCase())
              .filter(Boolean);
            return new Set(fieldNames).size === fieldNames.length;
          },
          message: 'Field names must be unique within the form',
        },
      ],
    },
  },
  { timestamps: true },
);

const FeedbackForm = mongoose.model('FeedbackForm', feedbackFormSchema);

module.exports = { FeedbackForm, FEEDBACK_FIELD_TYPES };
