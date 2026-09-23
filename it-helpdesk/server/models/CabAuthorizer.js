const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cabAuthorizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cabAuthorizerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('CabAuthorizer', cabAuthorizerSchema);