const mongoose = require('mongoose');

// Priority multipliers applied to a category's baseSlaHours to compute the due date.
const PRIORITY_MULTIPLIER = {
  Urgent: 0.25,
  High: 0.5,
  Medium: 1,
  Low: 1.5,
};

const activityEntrySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
      default: 'Open',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueAt: { type: Date },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    activity: [activityEntrySchema],
  },
  { timestamps: true }
);

// Auto-generate a human friendly ticket number, e.g. TKT-000123
ticketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

ticketSchema.statics.computeDueDate = function (baseSlaHours, priority, from = new Date()) {
  const multiplier = PRIORITY_MULTIPLIER[priority] ?? 1;
  const hours = baseSlaHours * multiplier;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
};

ticketSchema.virtual('isOverdue').get(function () {
  if (!this.dueAt) return false;
  if (['Resolved', 'Closed'].includes(this.status)) return false;
  return new Date() > new Date(this.dueAt);
});

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.PRIORITY_MULTIPLIER = PRIORITY_MULTIPLIER;
