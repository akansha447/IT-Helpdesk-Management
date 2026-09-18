const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDepartments, createDepartment, updateDepartment } = require('../controllers/departmentController');

router.get('/', protect, authorize('admin'), getDepartments);
router.post('/', protect, authorize('admin'), createDepartment);
router.put('/:id', protect, authorize('admin'), updateDepartment);
module.exports = router;