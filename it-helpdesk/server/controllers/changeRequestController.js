const ChangeRequest = require('../models/ChangeRequest');
const Ticket = require('../models/Ticket');
const CabAuthorizer = require('../models/CabAuthorizer');

const getChangeRequests = async (req, res, next) => {
  try {
    let filter = req.user.role === 'employee' ? { createdBy: req.user._id } : {};
    if (req.user.role === 'manager') {
      if (!req.user.departmentId) return res.json([]);
      const tickets = await Ticket.find({ departmentId: req.user.departmentId }).select('_id');
      filter = { relatedTicket: { $in: tickets.map((ticket) => ticket._id) } };
    }
    const records = await ChangeRequest.find(filter)
      .populate('relatedTicket', 'ticketNumber title')
      .populate('cabAuthority', 'name email username')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) { next(error); }
};

const createChangeRequest = async (req, res, next) => {
  try {
    const required = ['relatedTicket', 'cabAuthority', 'changeType', 'description', 'businessJustification'];
    if (required.some((key) => !req.body[key])) return res.status(400).json({ message: 'Related ticket, CAB authority, change type, description and business justification are required' });
    const ticket = await Ticket.findById(req.body.relatedTicket);
    if (!ticket) return res.status(400).json({ message: 'Related ticket not found' });
    const authorizer = await CabAuthorizer.findOne({ _id: req.body.cabAuthority, isActive: true });
    if (!authorizer) return res.status(400).json({ message: 'Invalid or inactive CAB authority' });
    if (req.user.role === 'employee' && String(ticket.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only use your own tickets' });
    }
    if (req.user.role === 'manager' && String(ticket.departmentId) !== String(req.user.departmentId)) {
      return res.status(403).json({ message: 'Managers can only use tickets in their department' });
    }
    const record = await ChangeRequest.create({ ...req.body, requesterName: req.user.name, createdBy: req.user._id });
    res.status(201).json(await record.populate([{ path: 'relatedTicket', select: 'ticketNumber title' }, { path: 'createdBy', select: 'name' }]));
  } catch (error) { next(error); }
};

const updateChangeRequest = async (req, res, next) => {
  try {
    const existing = await ChangeRequest.findById(req.params.id).populate('relatedTicket', 'departmentId');
    if (!existing) return res.status(404).json({ message: 'Change request not found' });
    if (req.user.role === 'employee' && String(existing.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own change requests' });
    }
    if (req.user.role === 'manager' && (!req.user.departmentId || String(existing.relatedTicket?.departmentId) !== String(req.user.departmentId))) {
      return res.status(403).json({ message: 'Managers can only manage change requests in their department' });
    }
    if (req.body.cabAuthority) {
      const authorizer = await CabAuthorizer.findOne({ _id: req.body.cabAuthority, isActive: true });
      if (!authorizer) return res.status(400).json({ message: 'Invalid or inactive CAB authority' });
    }
    const { status, cabDecision, cabDecisionBy, cabDecisionAt, implementationStartedAt, implementationCompletedAt, pirCompletedBy, pirCompletedAt, requesterName, createdBy, ...editableFields } = req.body;
    const record = await ChangeRequest.findByIdAndUpdate(req.params.id, editableFields, { new: true, runValidators: true });
    res.json(record);
  } catch (error) { next(error); }
};

const decideChangeRequest = async (req, res, next) => {
  try {
    const { decision, remark } = req.body;
    if (!['Approved', 'Rejected'].includes(decision)) return res.status(400).json({ message: 'Decision must be Approved or Rejected' });

    const existing = await ChangeRequest.findById(req.params.id).populate('relatedTicket', 'departmentId');
    if (!existing) return res.status(404).json({ message: 'Change request not found' });
    if (req.user.role === 'manager' && (!req.user.departmentId || String(existing.relatedTicket?.departmentId) !== String(req.user.departmentId))) {
      return res.status(403).json({ message: 'Managers can only review changes in their department' });
    }
    if (!['Pending CAB', 'Draft'].includes(existing.status)) return res.status(400).json({ message: 'Only draft or pending CAB requests can be decided' });

    const record = await ChangeRequest.findByIdAndUpdate(
      req.params.id,
      { status: decision, cabDecision: decision, cabDecisionBy: req.user._id, cabDecisionAt: new Date(), ...(remark !== undefined ? { remark } : {}) },
      { new: true, runValidators: true }
    ).populate([{ path: 'relatedTicket', select: 'ticketNumber title' }, { path: 'createdBy', select: 'name' }, { path: 'cabDecisionBy', select: 'name' }]);
    res.json(record);
  } catch (error) { next(error); }
};

const updateImplementation = async (req, res, next) => {
  try {
    const { action, implementationOwner, implementationResult, implementationRemark, implementationSteps, rollbackOwner, preImplementationChecks, rollbackPlan, rollbackTriggerConditions, validationSuccessCriteria, monitoringAfterChange, implementationReviewDate, implementationReviewRemark } = req.body;
    const existing = await ChangeRequest.findById(req.params.id).populate('relatedTicket', 'departmentId');
    if (!existing) return res.status(404).json({ message: 'Change request not found' });
    if (req.user.role === 'manager' && (!req.user.departmentId || String(existing.relatedTicket?.departmentId) !== String(req.user.departmentId))) {
      return res.status(403).json({ message: 'Managers can only implement changes in their department' });
    }
    if (action === 'start') {
      if (existing.status !== 'Approved') return res.status(400).json({ message: 'Only approved changes can be started' });
      const record = await ChangeRequest.findByIdAndUpdate(req.params.id, { status: 'Implementing', implementationOwner: implementationOwner || req.user.name, implementationSteps: implementationSteps || '', rollbackOwner: rollbackOwner || '', preImplementationChecks: preImplementationChecks || '', rollbackPlan: rollbackPlan || '', rollbackTriggerConditions: rollbackTriggerConditions || '', validationSuccessCriteria: validationSuccessCriteria || '', monitoringAfterChange: monitoringAfterChange || '', implementationReviewDate: implementationReviewDate || undefined, implementationReviewRemark: implementationReviewRemark || '', implementationStartedAt: new Date() }, { new: true, runValidators: true });
      return res.json(record);
    }
    if (action === 'complete') {
      if (existing.status !== 'Implementing') return res.status(400).json({ message: 'Only implementing changes can be completed' });
      if (!implementationResult) return res.status(400).json({ message: 'Implementation result is required' });
      const record = await ChangeRequest.findByIdAndUpdate(req.params.id, { status: 'Implemented', implementationResult, implementationRemark: implementationRemark || '', implementationCompletedAt: new Date() }, { new: true, runValidators: true });
      return res.json(record);
    }
    return res.status(400).json({ message: 'Implementation action must be start or complete' });
  } catch (error) { next(error); }
};

const completePostImplementation = async (req, res, next) => {
  try {
    const { pirOutcome, pirNotes, changeImplementedAsApproved, securityValidationDone, issuesObserved, rollbackExecuted, postReviewDate, lessonsLearned, closureApprovedBy, postReviewRemark } = req.body;
    if (!['Successful', 'Successful with issues', 'Failed'].includes(pirOutcome)) return res.status(400).json({ message: 'A valid post-implementation outcome is required' });
    const existing = await ChangeRequest.findById(req.params.id).populate('relatedTicket', 'departmentId');
    if (!existing) return res.status(404).json({ message: 'Change request not found' });
    if (req.user.role === 'manager' && (!req.user.departmentId || String(existing.relatedTicket?.departmentId) !== String(req.user.departmentId))) {
      return res.status(403).json({ message: 'Managers can only close changes in their department' });
    }
    if (existing.status !== 'Implemented') return res.status(400).json({ message: 'Only implemented changes can receive a post-implementation review' });
    const record = await ChangeRequest.findByIdAndUpdate(req.params.id, { status: 'Closed', pirOutcome, pirNotes: pirNotes || '', changeImplementedAsApproved, securityValidationDone, issuesObserved: issuesObserved || '', rollbackExecuted, postReviewDate: postReviewDate || new Date(), lessonsLearned: lessonsLearned || '', closureApprovedBy: closureApprovedBy || '', postReviewRemark: postReviewRemark || '', pirCompletedBy: req.user._id, pirCompletedAt: new Date() }, { new: true, runValidators: true });
    res.json(record);
  } catch (error) { next(error); }
};

module.exports = { getChangeRequests, createChangeRequest, updateChangeRequest, decideChangeRequest, updateImplementation, completePostImplementation };