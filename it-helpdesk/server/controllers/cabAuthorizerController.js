const CabAuthorizer = require('../models/CabAuthorizer');

const getCabAuthorizers = async (req, res, next) => {
  try {
    const filter = req.query.activeOnly === 'true' ? { isActive: true } : {};
    const authorizers = await CabAuthorizer.find(filter).sort({ createdAt: -1 });
    res.json(authorizers);
  } catch (error) {
    next(error);
  }
};

const createCabAuthorizer = async (req, res, next) => {
  try {
    const { name, mobile, email, username, password } = req.body;
    if (!name || !mobile || !email || !username || !password) {
      return res.status(400).json({ message: 'All CAB authorizer fields are required' });
    }
    const existing = await CabAuthorizer.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) return res.status(400).json({ message: 'Email or username is already in use' });

    const authorizer = await CabAuthorizer.create({ name, mobile, email, username, password });
    const safeAuthorizer = authorizer.toObject();
    delete safeAuthorizer.password;
    res.status(201).json(safeAuthorizer);
  } catch (error) {
    next(error);
  }
};

const toggleCabAuthorizer = async (req, res, next) => {
  try {
    const authorizer = await CabAuthorizer.findById(req.params.id);
    if (!authorizer) return res.status(404).json({ message: 'CAB authorizer not found' });
    authorizer.isActive = !authorizer.isActive;
    await authorizer.save();
    res.json(authorizer);
  } catch (error) {
    next(error);
  }
};

const updateCabAuthorizer = async (req, res, next) => {
  try {
    const { name, mobile, email, username, password } = req.body;
    if (!name || !mobile || !email || !username) {
      return res.status(400).json({ message: 'Name, mobile, email and username are required' });
    }

    const duplicate = await CabAuthorizer.findOne({
      _id: { $ne: req.params.id },
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (duplicate) return res.status(400).json({ message: 'Email or username is already in use' });

    const authorizer = await CabAuthorizer.findById(req.params.id).select('+password');
    if (!authorizer) return res.status(404).json({ message: 'CAB authorizer not found' });
    authorizer.name = name;
    authorizer.mobile = mobile;
    authorizer.email = email;
    authorizer.username = username;
    if (password) authorizer.password = password;
    await authorizer.save();

    const safeAuthorizer = authorizer.toObject();
    delete safeAuthorizer.password;
    res.json(safeAuthorizer);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCabAuthorizers, createCabAuthorizer, updateCabAuthorizer, toggleCabAuthorizer };