const mongoose = require('mongoose');

const BLOCK_TYPES = ['heading', 'paragraph', 'form', 'hero', 'feature_card', 'feature_grid', 'image', 'cta', 'stats', 'testimonials', 'pricing', 'faq'] as const;
const PAGE_STATUSES = ['draft', 'published'] as const;

const blockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: { values: BLOCK_TYPES, message: 'Block type must be one of: heading, paragraph, form, hero, feature_card, feature_grid, image, cta, stats, testimonials, pricing, faq' },
    },
    /** For heading: { level: 1|2|3, text: string }. For paragraph: { text: string }. For form: { formId: ObjectId }. */
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { _id: true },
);

const pageSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business id is required'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      maxlength: 120,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    status: {
      type: String,
      enum: { values: PAGE_STATUSES, message: 'Status must be draft or published' },
      default: 'draft',
    },
    blocks: {
      type: [blockSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Page = mongoose.model('Page', pageSchema);

module.exports = { Page, BLOCK_TYPES, PAGE_STATUSES };
