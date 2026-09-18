const User = require('../models/User');

// @desc  List all users
// @route GET /api/users
// @access admin
const getUsers = async (req, res, next) => {
  try {
    if (req.user.role === 'manager' && !req.user.departmentId) return res.json([]);
    const filter = req.user.role === 'manager' ? { departmentId: req.user.departmentId || null } : {};
    const users = await User.find(filter).populate('departmentId', 'name').sort({ createdAt: -1 });
    res.json(users.map((u) => u.toSafeObject()));
  } catch (error) {
    next(error);
  }
};

// @desc  Get active team members (for ticket assignment dropdowns)
// @route GET /api/users/agents
// @access admin, agent
const getAgents = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'manager') filter.departmentId = req.user.departmentId || null;
    const agents = await User.find(filter).populate('departmentId', 'name').sort({
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
    const { username, name, email, password, role, department, departmentId, mobile, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      username,
      name,
      email,
      password,
      role: role || 'employee',
      department,
      departmentId: departmentId || null,
      mobile,
      employeeId,
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
    const { username, name, role, department, departmentId, mobile, employeeId, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'manager') {
      if (!req.user.departmentId || String(user.departmentId) !== String(req.user.departmentId)) {
        return res.status(403).json({ message: 'Managers can only manage users in their department' });
      }
      if (role === 'admin') return res.status(403).json({ message: 'Managers cannot promote users to admin' });
    }

    if (name !== undefined) user.name = name;
    if (username !== undefined) user.username = username;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (departmentId !== undefined) user.departmentId = departmentId || null;
    if (mobile !== undefined) user.mobile = mobile;
    if (employeeId !== undefined) user.employeeId = employeeId;
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
    if (req.user.role === 'manager' && (!req.user.departmentId || String(user.departmentId) !== String(req.user.departmentId))) {
      return res.status(403).json({ message: 'Managers can only manage users in their department' });
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
