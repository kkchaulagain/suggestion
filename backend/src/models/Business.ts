

const mongoose= require('mongoose');

const businessSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
},{timestamps: true});
export const Business = mongoose.model('Business', businessSchema);

module.exports = Business;