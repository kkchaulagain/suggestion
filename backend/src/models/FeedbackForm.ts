const mongoose = require('mongoose');

const FEEDBACK_FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'date',
  'time',
  'url',
  'checkbox',
  'radio',
  'dropdown',
  'scale',
  'rating',
  'image',
  // Legacy types kept for backward compat with pre-migration forms
  'short_text',
  'long_text',
  'big_text',
  'image_upload',
  'name',
  'scale_1_10',
];

const validationSchema = new mongoose.Schema(
  {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String, trim: true },
    countryCode: { type: Boolean },
  },
  { _id: false },
);

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
    options: {
      type: [String],
      default: undefined,
    },
    allowAnonymous: {
      type: Boolean,
      default: false,
    },
    stepId: {
      type: String,
      trim: true,
    },
    stepOrder: {
      type: Number,
    },
    validation: {
      type: validationSchema,
      default: undefined,
    },
  },
  { _id: false },
);

const formStepSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Step id is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Step title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    order: {
      type: Number,
      required: [true, 'Step order is required'],
    },
  },
  { _id: false },
);

const FORM_KINDS = ['form', 'poll', 'survey'] as const;

const feedbackFormSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: { values: FORM_KINDS, message: 'Kind must be form, poll, or survey' },
      default: 'form',
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business id is required'],
      index: true,
    },
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
    showResultsPublic: {
      type: Boolean,
      default: false,
    },
    steps: {
      type: [formStepSchema],
      default: undefined,
      validate: [
        {
          validator(steps: Array<{ id?: string; order?: number }>) {
            if (!Array.isArray(steps) || steps.length === 0) return true;
            const ids = steps.map((s) => s?.id).filter(Boolean);
            return new Set(ids).size === ids.length;
          },
          message: 'Step ids must be unique within the form',
        },
        {
          validator(steps: Array<{ id?: string; order?: number }>) {
            if (!Array.isArray(steps) || steps.length === 0) return true;
            const orders = steps.map((s) => s?.order).filter((o) => o !== undefined && o !== null);
            return new Set(orders).size === orders.length;
          },
          message: 'Step order values must be unique within the form',
        },
      ],
    },
    fields: {
      type: [feedbackFieldSchema],
      required: [true, 'Fields are required'],
      validate: [
        {
          validator(fields: Array<{ name?: string; type?: string; label?: string }>) {
            return Array.isArray(fields) && fields.length > 0;
          },
          message: 'Form must include at least one field',
        },
        {
          validator(fields: Array<{ name?: string }>) {
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

module.exports = { FeedbackForm, FEEDBACK_FIELD_TYPES, FORM_KINDS };
