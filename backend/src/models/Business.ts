

const mongoose= require('mongoose');

const businessSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: undefined,
    },
    type: {
        type: String,
        enum: ['personal', 'commercial'],
        required: true,
    },
    businessname:{
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: false,
    },
    pancardNumber: {
        type: String,
        trim: true,
        required: false,
    },
    description:{
        type: String,
        required: true,
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    onboardingCompletedAt: {
        type: Date,
        required: false,
    },
    crmTags: {
        type: [String],
        default: [],
    },
    customFields: {
        type: [
            {
                key: { type: String, required: true },
                value: { type: mongoose.Schema.Types.Mixed },
                fieldType: { type: String, default: 'text' },
            },
        ],
        default: [],
    },
},{timestamps: true});

/** Legacy documents or partial inserts may omit `type`; default before validate so save() passes. */
businessSchema.pre('validate', function (this: { type?: string; set: (k: string, v: string) => void }, next: () => void) {
  if (this.type == null || this.type === '') {
    this.set('type', 'commercial');
  }
  next();
});

export const Business = mongoose.model('Business', businessSchema);

module.exports = Business;