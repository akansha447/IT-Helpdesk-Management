const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const activityLogEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    description: { type: String, default: '' },
    entityType: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    entityName: { type: String, default: '' },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'manager', 'agent', 'employee'], default: 'employee' },
    department: { type: String, default: '' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    mobile: { type: String, default: '' },
    employeeId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    activityLog: [activityLogEntrySchema],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    role: this.role,
    department: this.department,
    departmentId: this.departmentId,
    mobile: this.mobile,
    employeeId: this.employeeId,
    isActive: this.isActive,
    activityLog: this.activityLog || [],
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
