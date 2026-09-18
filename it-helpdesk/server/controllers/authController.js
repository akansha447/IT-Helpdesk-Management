const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc  Register a new user (self-signup always creates an "employee")
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

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
      department,
      role: 'employee',
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// @desc  Login
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    user.activityLog = user.activityLog || [];
    user.activityLog.push({
      action: 'login',
      description: `${user.name} logged in`,
      entityType: 'user',
      entityId: user._id,
      entityName: user.name,
      createdAt: new Date(),
    });
    await user.save();

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// @desc  Logout
// @route POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.activityLog = user.activityLog || [];
    user.activityLog.push({
      action: 'logout',
      description: `${user.name} logged out`,
      entityType: 'user',
      entityId: user._id,
      entityName: user.name,
      createdAt: new Date(),
    });
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
