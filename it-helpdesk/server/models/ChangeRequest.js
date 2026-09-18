const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema(
  {
    crNumber: { type: String, unique: true },
    relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    changeType: { type: String, enum: ['Standard', 'Normal', 'Emergency'], required: true },
    description: { type: String, required: true },
    businessJustification: { type: String, required: true },
    knowledgeBase: { type: String, default: '' },
    impactAnalysis: { type: String, default: '' },
    riskAssessment: { type: String, default: '' },
    riskMitigation: { type: String, default: '' },
    estimatedEffort: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0 },
    requesterName: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    implementDate: { type: Date },
    plannedDate: { type: Date },
    plannedClosedDate: { type: Date },
    implementTeam: { type: String, default: '' },
    changeManager: { type: String, default: '' },
    systemImpacted: { type: String, default: '' },
    dependencies: { type: String, default: '' },
    attachmentName: { type: String, default: '' },
    status: { type: String, enum: ['Draft', 'Pending CAB', 'Approved', 'Rejected', 'Closed'], default: 'Draft' },
    remark: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

changeRequestSchema.pre('save', async function (next) {
  if (this.isNew && !this.crNumber) {
    const count = await mongoose.model('ChangeRequest').countDocuments();
    this.crNumber = `CR-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);