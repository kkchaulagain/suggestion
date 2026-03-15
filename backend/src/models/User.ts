const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  phone:{
    type: String,
    required: true,
    
  },
  role: {
    type: String,
    enum: ['admin', 'business', 'user', 'governmentservices'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    select: false,
    default: null,
  },
  refreshTokenExpiresAt: {
    type: Date,
    select: false,
    default: null,
  },
  avatarId: {
    type: String,
    trim: true,
    required: false,
  },
}, { timestamps: true });

interface UserDoc {
  isModified(field: string): boolean;
  password: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
}
userSchema.pre('save', async function (this: UserDoc) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
