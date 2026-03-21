

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
    /** Listed / regulated company vs private company (default private). */
    isPublicCompany: {
        type: Boolean,
        default: false,
    },
    businessname:{
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: false,
    },
    /** Structured map presence (URLs + coords). Used for future map UIs and geo queries. */
    mapLocation: {
        googleMapsUrl: { type: String, trim: true, default: undefined },
        googleReviewsUrl: { type: String, trim: true, default: undefined },
        latitude: { type: Number, default: undefined },
        longitude: { type: Number, default: undefined },
        placeId: { type: String, trim: true, default: undefined },
    },
    /** GeoJSON Point when latitude & longitude are set — indexed for $near / map APIs. */
    mapGeo: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            validate: {
                validator(v: number[]) {
                    return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
                },
            },
        },
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

businessSchema.index({ mapGeo: '2dsphere' });

/** Legacy documents or partial inserts may omit `type`; default before validate so save() passes. */
businessSchema.pre('validate', function (this: { type?: string; set: (k: string, v: string) => void }, next: () => void) {
  if (this.type == null || this.type === '') {
    this.set('type', 'commercial');
  }
  next();
});

export const Business = mongoose.model('Business', businessSchema);

module.exports = Business;