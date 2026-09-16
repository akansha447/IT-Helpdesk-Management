const User = require('../models/User');

// @desc  List all users
// @route GET /api/users
// @access admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map((u) => u.toSafeObject()));
  } catch (error) {
    next(error);
  }
};

// @desc  Get agents + admins only (for assignment dropdowns)
// @route GET /api/users/agents
// @access admin, agent
const getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({ role: { $in: ['agent', 'admin'] }, isActive: true }).sort({
      name: 1,
    });
    res.json(agents.map((u) => u.toSafeObject()));
  } catch (error) {
    next(error);
  }
};

// @desc  Create a user (admin can create agents/admins/employees directly)
// @route POST /api/users
// @access admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      department,
    });

    res.status(201).json(user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

// @desc  Update a user's role, department, or active status
// @route PUT /api/users/:id
// @access admin
const updateUser = async (req, res, next) => {
  try {
    const { name, role, department, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json(user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a user
// @route DELETE /api/users/:id
// @access admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getAgents, createUser, updateUser, deleteUser };
