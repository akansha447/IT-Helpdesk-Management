const Department = require('../models/Department');

const getDepartments = async (req, res, next) => {
  try {
    res.json(await Department.find().populate('primaryManager', 'name email').sort({ name: 1 }));
  } catch (error) { next(error); }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, email, primaryManager } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Department name and email are required' });
    res.status(201).json(await Department.create({ name, email, primaryManager: primaryManager || null }));
  } catch (error) { next(error); }
};

const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) { next(error); }
};

module.exports = { getDepartments, createDepartment, updateDepartment };