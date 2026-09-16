const Category = require('../models/Category');

// @route GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/categories
// @access admin
const createCategory = async (req, res, next) => {
  try {
    const { name, description, baseSlaHours } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const category = await Category.create({
      name,
      description,
      baseSlaHours: baseSlaHours || 48,
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/categories/:id
// @access admin
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, baseSlaHours, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (baseSlaHours !== undefined) category.baseSlaHours = baseSlaHours;
    if (isActive !== undefined) category.isActive = isActive;
    await category.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/categories/:id
// @access admin
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
