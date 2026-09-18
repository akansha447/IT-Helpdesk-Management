const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    category: { type: String, default: 'General' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
