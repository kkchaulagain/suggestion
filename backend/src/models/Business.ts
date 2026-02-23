

const mongoose= require('mongoose');

const businessSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    businessname:{
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    pancardNumber: {
        type: Number,
        required: true,
    },
    description:{
        type: String,
        required: true,    
    },

        
},{timestamps: true});
export const Business = mongoose.model('Business', businessSchema);

module.exports = Business;