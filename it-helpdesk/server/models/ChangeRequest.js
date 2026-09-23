const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema(
  {
    crNumber: { type: String, unique: true },
    relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    cabAuthority: { type: mongoose.Schema.Types.ObjectId, ref: 'CabAuthorizer', required: true },
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
    status: { type: String, enum: ['Draft', 'Pending CAB', 'Approved', 'Rejected', 'Implementing', 'Implemented', 'Closed'], default: 'Draft' },
    remark: { type: String, default: '' },
    cabDecision: { type: String, enum: ['Approved', 'Rejected'] },
    cabDecisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cabDecisionAt: { type: Date },
    implementationOwner: { type: String, default: '' },
    implementationStartedAt: { type: Date },
    implementationCompletedAt: { type: Date },
    implementationResult: { type: String, default: '' },
    implementationRemark: { type: String, default: '' },
    implementationSteps: { type: String, default: '' },
    rollbackOwner: { type: String, default: '' },
    preImplementationChecks: { type: String, default: '' },
    rollbackPlan: { type: String, default: '' },
    rollbackTriggerConditions: { type: String, default: '' },
    validationSuccessCriteria: { type: String, default: '' },
    monitoringAfterChange: { type: String, default: '' },
    implementationReviewDate: { type: Date },
    implementationReviewRemark: { type: String, default: '' },
    changeImplementedAsApproved: { type: String, enum: ['Yes', 'No'] },
    securityValidationDone: { type: String, enum: ['Yes', 'No'] },
    issuesObserved: { type: String, default: '' },
    rollbackExecuted: { type: String, enum: ['Yes', 'No'] },
    postReviewDate: { type: Date },
    lessonsLearned: { type: String, default: '' },
    closureApprovedBy: { type: String, default: '' },
    postReviewRemark: { type: String, default: '' },
    pirOutcome: { type: String, enum: ['Successful', 'Successful with issues', 'Failed'] },
    pirNotes: { type: String, default: '' },
    pirCompletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pirCompletedAt: { type: Date },
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