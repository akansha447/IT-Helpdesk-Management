const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    primaryManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);